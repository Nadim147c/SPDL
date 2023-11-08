import axios from "axios"
import { readFile, writeFile } from "fs/promises"
import { TagConstants, Tags } from "node-id3"
import z from "zod"
import { SpotifyAlbumSchema } from "../schema/Spotify/Album.js"
import {
    ClientCredentials,
    ClientCredentialsResponse,
    ClientCredentialsSchema,
} from "../schema/Spotify/Authorization.js"
import { SpotifyPlaylistSchema } from "../schema/Spotify/Playlist.js"
import { SpotifyTrackSchema } from "../schema/Spotify/Track.js"
import { loadCache, saveCache } from "../util/cache.js"
import { getCachePath, getConfigPath } from "../util/homePaths.js"
import { LoggerType, getLogger } from "../util/logger.js"
import { SimpleTrack } from "../util/simpleTracks.js"

type LoadSpotifyDataCache<T extends z.Schema> = {
    type: "track" | "playlist" | "album"
    schema: T
    identifier: string
}

export default class Spotify {
    baseApiURI = "https://api.spotify.com/"
    port = 1110
    print: LoggerType

    private clientCredentials: ClientCredentials | undefined
    private tokens

    private constructor(tokens: string, verbose: boolean) {
        this.tokens = tokens
        this.print = getLogger("Spotify", verbose)
    }

    static async createClient(verbose: boolean) {
        const print = getLogger("Spotify", verbose)

        let tokenStr
        try {
            const tokenFile = await getConfigPath(".tokens")
            tokenStr = await readFile(tokenFile, { encoding: "utf8" })
        } catch (error) {
            print("Client tokens are missing or corrupted")
            print("Run `spdl setup` to setup your client spotify api id and secrets")
            print(error, true)

            return
        }

        const tokensSchema = z.string().regex(/.{32}:.{32}/)
        const tokens = tokensSchema.safeParse(tokenStr)

        if (tokens.success) {
            return new this(tokens.data, verbose)
        } else {
            print("Cached tokens are corrupted.")
            print("Run `spdl setup` to reset the client tokens")
            print(tokens.error, true)
        }
    }

    private async loadCachedClientCredentials() {
        let cachedCredentialsStr
        try {
            const accessTokenPath = await getCachePath("access-token.json")
            cachedCredentialsStr = await readFile(accessTokenPath, { encoding: "utf8" })
        } catch (error) {
            this.print("Client access token is missing", true)
        }

        if (!cachedCredentialsStr) return

        try {
            const cachedCredentials = JSON.parse(cachedCredentialsStr)
            const credentials = ClientCredentialsSchema.parse(cachedCredentials)

            return credentials
        } catch (error) {
            this.print("Client credentials aren't cached", true)
            this.print(error, true)
        }
    }

    private checkRefetchRequired() {
        if (!this.clientCredentials) return true

        const currentTime = new Date().getTime() / 1000
        const expireTime = this.clientCredentials.expire_time

        if (expireTime < currentTime) return true

        return false
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

        if (!refetch) return isAuthorizationCompleted

        this.print("Fetching access token from client ID and SECRET")
        const headers = {
            Authorization: `Basic ${Buffer.from(this.tokens).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
        }

        const data = new URLSearchParams()
        data.append("grant_type", "client_credentials")

        try {
            const response = await axios.post<ClientCredentialsResponse>(url, data, { headers })
            const clientCredentials = response.data

            clientCredentials.expire_time = this.getExpireTime(clientCredentials.expires_in)

            this.clientCredentials = ClientCredentialsSchema.parse(clientCredentials)

            isAuthorizationCompleted = true
        } catch (error) {
            this.print("Failed to authorize the client")
            this.print(error, true)

            return
        }

        try {
            const accessTokenPath = await getCachePath("access-token.json", false)
            await writeFile(accessTokenPath, JSON.stringify(this.clientCredentials))
        } catch (error) {
            this.print("Failed to cache client credentials")
            this.print(error, true)
        }

        return isAuthorizationCompleted
    }

    async getTrackCover(url: string) {
        const coverId = url.split("/").at(-1)

        if (!coverId) return this.print("Failed to file name from the cover url")

        const path = await getCachePath(`image/${coverId}.jpg`)

        let cover

        try {
            cover = await readFile(path)

            return cover
        } catch (error) {
            this.print(error, true)
        }

        try {
            const imageRes = await axios.get(url, { responseType: "arraybuffer" })
            cover = Buffer.from(imageRes.data)
            await writeFile(path, cover)

            return cover
        } catch (error) {
            this.print("Failed to get track cover image")
            this.print(error, true)
        }
    }

    async getTags(track: SimpleTrack) {
        const tags: Tags = {
            title: track.name,
            artist: track.artists.join(", "),
            album: track.album,
            releaseTime: track.releaseDate,
        }

        const coverUrl = track.coverUrl
        if (!coverUrl) return tags

        const cover = await this.getTrackCover(coverUrl)

        if (!cover) return tags

        tags.image = {
            mime: "image/jpg",
            type: { id: TagConstants.AttachedPicture.PictureType.FRONT_COVER },
            description: "Cover Image",
            imageBuffer: cover,
        }

        return tags
    }

    private async loadSpotifyDataCache<T extends z.Schema>(options: LoadSpotifyDataCache<T>) {
        try {
            const cachedData = await loadCache(options.type, options.identifier)
            const data = options.schema.parse(cachedData)
            if (cachedData) return data as z.infer<T>
        } catch (error) {
            this.print(error, true)
        }
    }

    async getTrack(URI: string) {
        const cachedTrack = await this.loadSpotifyDataCache({
            type: "track",
            identifier: URI,
            schema: SpotifyTrackSchema,
        })

        if (cachedTrack) return cachedTrack

        if (!this.clientCredentials) {
            const authorized = await this.authorizeClient()
            if (!authorized) throw "Client Credentials not found. Client authorization failed."
        }

        const url = new URL(`v1/tracks/${URI}`, this.baseApiURI)
        const headers = { Authorization: `Bearer ${this.clientCredentials!.access_token}` }

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

        if (cachedPlaylist) return cachedPlaylist

        if (!this.clientCredentials) {
            const authorized = await this.authorizeClient()
            if (!authorized) throw "Client Credentials not found. Client authorization failed."
        }

        const url = new URL(`v1/playlists/${URI}`, this.baseApiURI)
        const headers = { Authorization: `Bearer ${this.clientCredentials!.access_token}` }

        const response = await axios.get(url.toString(), { headers })

        const playlist = SpotifyPlaylistSchema.parse(response.data)

        await saveCache(playlist, "playlist", URI)

        return playlist
    }

    async getAlbum(URI: string) {
        const cachedAlbum = await this.loadSpotifyDataCache({
            type: "album",
            identifier: URI,
            schema: SpotifyAlbumSchema,
        })

        if (cachedAlbum) return cachedAlbum

        if (!this.clientCredentials) {
            const authorized = await this.authorizeClient()
            if (!authorized) throw "Client Credentials not found. Client authorization failed."
        }

        const url = new URL(`v1/albums/${URI}`, this.baseApiURI)
        const headers = { Authorization: `Bearer ${this.clientCredentials!.access_token}` }

        const response = await axios.get(url.toString(), { headers })

        const album = SpotifyAlbumSchema.parse(response.data)

        await saveCache(album, "album", URI)

        return album
    }
}
