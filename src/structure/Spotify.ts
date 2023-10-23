import axios from "axios"
import { Buffer } from "node:buffer"
import { z } from "zod"
import { envVariablesSchema } from "../schema/ProcessEnv"
import {
    ClientCredentials,
    ClientCredentialsResponse,
    ClientCredentialsSchema,
} from "../schema/Spotify/Authorization"
import { SpotifyPlaylistSchema } from "../schema/Spotify/Playlist"
import { SpotifyTrackSchema } from "../schema/Spotify/Track"
import { loadCache, saveCache } from "../util/Util"

export type LogLevel = "verbose" | "normal" | "silent"

type LoadSpotifyDataCache = {
    type: "track" | "playlist"
    schema: z.Schema
    identifier: string
}

export default class Spotify {
    baseApiURI = "https://api.spotify.com/"
    port = 1110

    private clientCredentials: ClientCredentials | undefined

    constructor(
        private CLIENT_ID: string,
        private CLIENT_SECRET: string,
        public LOG_LEVEL: LogLevel
    ) {}

    static async createClient(logLevel: LogLevel = "normal") {
        const cachedTokens = await loadCache("token", "client")
        if (!cachedTokens) return

        const tokens = envVariablesSchema.safeParse(cachedTokens)

        if (!tokens.success) {
            console.log("Cached tokens are corrupted.")
            if (logLevel === "verbose") console.log(tokens.error)
            return
        }

        const { CLIENT_ID, CLIENT_SECRET } = tokens.data

        return new this(CLIENT_ID, CLIENT_SECRET, logLevel)
    }

    private print(message: unknown, priority: "high" | "normal" | "low" = "normal") {
        switch (this.LOG_LEVEL) {
            case "verbose":
                console.log(message)
            case "normal":
                if (priority === "high" || priority === "normal") console.log(message)
            case "silent":
                if (priority === "high") console.log(message)
        }
    }

    private async loadCachedClientCredentials() {
        const cachedCredentials = await loadCache("token", this.CLIENT_ID)
        if (!cachedCredentials) return

        const credentials = ClientCredentialsSchema.safeParse(cachedCredentials)

        if (!credentials.success) {
            this.print("Client credentials aren't cached.")
            this.print(credentials.error, "low")
            return
        }
        return credentials.data
    }

    private checkRefetchRequired() {
        if (!this.clientCredentials) return true

        const currentTime = new Date().getTime() / 1000
        const expireTime = this.clientCredentials.expire_time

        if (expireTime < currentTime) return true

        return false
    }

    private getBasicToken() {
        const clientIdAndSecret = `${this.CLIENT_ID}:${this.CLIENT_SECRET}`
        return Buffer.from(clientIdAndSecret).toString("base64")
    }

    private getExpireTime(expiresIn: number) {
        return new Date().getTime() / 1000 + expiresIn
    }

    async authorizeClient(forceRefetch = false) {
        let isAuthorizationCompleted = false

        if (!forceRefetch) {
            const credentials = await this.loadCachedClientCredentials()
            if (credentials) {
                this.clientCredentials = credentials
                isAuthorizationCompleted = true
            }
        }

        const refetch = !isAuthorizationCompleted || forceRefetch || this.checkRefetchRequired()
        const url = "https://accounts.spotify.com/api/token"

        if (refetch) {
            this.print("[Spotify] Fetching access token from client ID and SECRET")

            const headers = {
                Authorization: `Basic ${this.getBasicToken()}`,
                "Content-Type": "application/x-www-form-urlencoded",
            }

            const data = new URLSearchParams()
            data.append("grant_type", "client_credentials")

            let response
            try {
                response = await axios.post<ClientCredentialsResponse>(url, data, { headers })
                const clientCredentials = response.data

                clientCredentials.expire_time = this.getExpireTime(clientCredentials.expires_in)

                this.clientCredentials = ClientCredentialsSchema.parse(clientCredentials)

                await saveCache(this.clientCredentials, "token", this.CLIENT_ID)
            } catch (err) {
                this.print("[Spotify] Failed to authorize the client.")
                this.print(err, "low")
                return false
            }
        }
    }

    private async loadSpotifyDataCache(options: LoadSpotifyDataCache) {
        try {
            const cachedData = await loadCache(options.type, options.identifier)
            const data = options.schema.parse(cachedData)
            if (cachedData) return data
        } catch (err) {
            this.print(err, "low")
        }
    }

    private isMissingCredentials() {}

    async getTrack(URI: string) {
        const cachedTrack = await this.loadSpotifyDataCache({
            type: "track",
            identifier: URI,
            schema: SpotifyTrackSchema,
        })

        if (cachedTrack) return cachedTrack

        if (!this.clientCredentials) {
            this.print("Client Credentials not found. Please authorize the client.")
            return
        }
        const url = new URL(`v1/tracks/${URI}`, this.baseApiURI)
        const headers = {
            Authorization: `Bearer ${this.clientCredentials.access_token}`,
        }

        const response = await axios.get(url.toString(), { headers })

        const track = SpotifyTrackSchema.parse(response.data)

        await saveCache(track, "track", URI)

        return track
    }

    async getPlaylist(URI: string) {
        const cachedPlaylist = await this.loadSpotifyDataCache({
            type: "playlist",
            identifier: URI,
            schema: SpotifyPlaylistSchema,
        })

        if (!this.clientCredentials) {
            this.print("Client Credentials not found. Please authorize the client.")
            return
        }
        const url = new URL(`v1/playlists/${URI}`, this.baseApiURI)
        const headers = {
            Authorization: `Bearer ${this.clientCredentials.access_token}`,
        }

        const response = await axios.get(url.toString(), { headers })

        const playlist = SpotifyPlaylistSchema.parse(response.data)

        await saveCache(playlist, "playlist", URI)

        return playlist
    }
}
