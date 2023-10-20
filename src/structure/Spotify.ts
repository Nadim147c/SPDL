import axios from "axios"
import { Buffer } from "node:buffer"
import {
    ClientCredentials,
    ClientCredentialsResponse,
    ClientCredentialsSchema,
} from "../schema/Spotify/Authorization"
import { SpotifyPlaylistSchema } from "../schema/Spotify/Playlist"
import { SpotifyTrackSchema } from "../schema/Spotify/Track"
import { loadCache, saveCache } from "../util/Util"

export default class Spotify {
    baseApiURI = "https://api.spotify.com/"
    port = 1110

    private ClientCredentials: ClientCredentials | undefined

    constructor() {}

    async authorizeClient(refetch = false) {
        const url = "https://accounts.spotify.com/api/token"

        let data
        if (!refetch) {
            try {
                data = await loadCache("token", process.env.CLIENT_ID)
                this.ClientCredentials = ClientCredentialsSchema.parse(data)
            } catch (err) {
                console.log("Client credentials aren't cached.")
                console.log(err)
            }
        }

        const currentTime = new Date().getTime() / 1000

        if (
            refetch ||
            !this.ClientCredentials ||
            this.ClientCredentials.expire_time < currentTime
        ) {
            console.log("Fetching access token.")

            const client_credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`

            const headers = {
                Authorization: `Basic ${Buffer.from(client_credentials).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            }

            const data = new URLSearchParams()
            data.append("grant_type", "client_credentials")

            let response
            try {
                response = await axios.post<ClientCredentialsResponse>(url, data, { headers })
            } catch (err) {
                console.error(err)
            }

            if (response) {
                const clientCredentials = response.data
                clientCredentials.expire_time =
                    new Date().getTime() / 1000 + clientCredentials.expires_in

                this.ClientCredentials = ClientCredentialsSchema.parse(clientCredentials)

                await saveCache(this.ClientCredentials, "token", process.env.CLIENT_ID)
            }
        }
    }

    async getTrack(URI: string) {
        try {
            const cachedTrack = await loadCache("track", URI)
            const track = SpotifyTrackSchema.parse(cachedTrack)
            if (cachedTrack) return track
        } catch (err) {
            console.error(err)
        }

        if (!this.ClientCredentials)
            throw "Client Credentials not found. Please authorize the client."

        const url = new URL(`v1/tracks/${URI}`, this.baseApiURI)
        const headers = {
            Authorization: `Bearer ${this.ClientCredentials.access_token}`,
        }

        const response = await axios.get(url.toString(), { headers })

        const track = SpotifyTrackSchema.parse(response.data)

        await saveCache(track, "track", URI)

        return track
    }

    async getPlaylist(URI: string) {
        try {
            const cachedPlaylist = await loadCache("playlist", URI)
            const playlist = SpotifyPlaylistSchema.parse(cachedPlaylist)
            if (cachedPlaylist) return playlist
        } catch (err) {
            console.log(err)
        }

        if (!this.ClientCredentials)
            throw "Client Credentials not found. Please authorize the client."

        const url = new URL(`v1/playlists/${URI}`, this.baseApiURI)
        const headers = {
            Authorization: `Bearer ${this.ClientCredentials.access_token}`,
        }

        const response = await axios.get(url.toString(), { headers })

        const playlist = SpotifyPlaylistSchema.parse(response.data)

        await saveCache(playlist, "playlist", URI)

        return playlist
    }
}
