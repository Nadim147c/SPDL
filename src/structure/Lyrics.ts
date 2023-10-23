import axios from "axios"
import { HashSearchResultSchema } from "../schema/Kugou/HashSearch"
import { KeywordSearchResultSchema } from "../schema/Kugou/KeywordSearch"
import { LyricsDataSchema } from "../schema/Kugou/LyricsData"
import { SongSearchResultSchema } from "../schema/Kugou/SongSearch"
import { SpotifyPlaylistTrack } from "../schema/Spotify/Playlist"
import { SpotifyTrack } from "../schema/Spotify/Track"
import { loadCache, saveCache } from "../util/Util"

type Track = SpotifyTrack | SpotifyPlaylistTrack

export default class Kugou {
    DURATION_TOLERANCE_MS = 8
    track: Track
    title: string
    artists: string

    constructor(track: Track) {
        this.track = track
        const artists = track.album.artists.map((artist) => artist.name).join(", ")
        this.title = this.normalizeTitle(track.name)
        this.artists = this.normalizeArtist(artists)
    }

    async getLyrics() {
        const cachedLyrics = await loadCache("lyrics", this.track.id)
        if (cachedLyrics) return this.normalizeLyrics(cachedLyrics)

        const candidate = await this.getLyricsCandidate()

        if (candidate) {
            console.log(candidate)
            const { id, accesskey } = candidate
            const lyricsData = await this.downloadLyrics(id, accesskey)
            const rawLyrics = Buffer.from(lyricsData.content, "base64").toString("utf8")

            await saveCache(rawLyrics, "lyrics", this.track.id)

            const lyrics = this.normalizeLyrics(rawLyrics)
            return lyrics
        }

        return null
    }

    async getLyricsCandidate() {
        const durationSec = this.track.duration_ms / 1000
        const songs = await this.searchSongs()

        if (!songs.data.info) return null

        for await (const song of songs.data.info) {
            if (
                durationSec === -1 ||
                Math.abs(song.duration - durationSec) <= this.DURATION_TOLERANCE_MS
            ) {
                const hashSearchData = await this.searchLyricsByHash(song.hash)
                const candidates = hashSearchData.candidates

                if (candidates?.length) return candidates[0]
            }
        }

        const lyricsByKeyword = await this.searchLyricsByKeyword()
        return lyricsByKeyword.candidates?.length ? lyricsByKeyword.candidates[0] : null
    }

    async searchLyricsByKeyword() {
        const url = new URL("https://lyrics.kugou.com/search")
        url.searchParams.set("ver", "1")
        url.searchParams.set("man", "yes")
        url.searchParams.set("client", "pc")

        const keyword = `${this.artists} - ${this.title}`.replace(" ", "%20")
        const urlStr = `${url}&keyword=${keyword}`

        try {
            console.log(`[Lyrics] Searching lyrics with keyword`)
            console.log(urlStr)
            const response = await axios.get(urlStr)
            const data = KeywordSearchResultSchema.parse(response.data)
            return data
        } catch (error) {
            console.error(`Error searching lyrics: ${error}`)
            throw error
        }
    }

    async searchSongs() {
        const url = new URL("api/v3/search/song", "https://mobileservice.kugou.com")
        url.searchParams.set("version", "9108")
        url.searchParams.set("plat", "0")
        url.searchParams.set("pagesize", "8")
        url.searchParams.set("showtype", "0")

        const keyword = `${this.artists} - ${this.title}`.replace(" ", "%20")
        const urlStr = `${url}&keyword=${keyword}`

        try {
            console.log(`[Lyrics] Searching songs`)
            console.log(urlStr)
            const response = await axios.get(urlStr)
            const data = SongSearchResultSchema.parse(response.data)
            return data
        } catch (error) {
            console.error(`Error searching songs: ${error}`)
            throw error
        }
    }

    async searchLyricsByHash(songHash: string) {
        const url = new URL("search", "https://lyrics.kugou.com")
        url.searchParams.set("ver", "1")
        url.searchParams.set("man", "yes")
        url.searchParams.set("client", "pc")
        url.searchParams.set("hash", songHash)

        try {
            console.log(`[Lyrics] Searching lyrics by hash`)
            console.log(url.toString())
            const response = await axios.get(url.toString())
            const data = HashSearchResultSchema.parse(response.data)
            return data
        } catch (error) {
            console.error(`Error searching lyrics by hash: ${error}`)
            throw error
        }
    }

    async downloadLyrics(id: string, accessKey: string) {
        const url = new URL("download", "https://lyrics.kugou.com")

        url.searchParams.set("fmt", "lrc")
        url.searchParams.set("charset", "utf8")
        url.searchParams.set("client", "pc")
        url.searchParams.set("ver", "1")
        url.searchParams.set("id", id)
        url.searchParams.set("accesskey", accessKey)

        try {
            console.log(`[Lyrics] Downloading lyrics: ID: ${id} | AccessKey: ${accessKey}`)
            console.log(url.toString())
            const response = await axios.get(url.toString())
            const data = LyricsDataSchema.parse(response.data)
            return data
        } catch (error) {
            console.error(`Error downloading lyrics: ${error}`)
            throw error
        }
    }

    private normalizeTitle(title: string): string {
        const regex = /\(.*\)|（.*）|「.*」|『.*』|<.*>|《.*》|〈.*〉|＜.*＞/g
        const normalizedTitle = title.replace(regex, "")
        return normalizedTitle.trim()
    }

    private normalizeArtist(artist: string): string {
        let normalizedArtist = artist
            .replace(/, /g, "、")
            .replace(" & ", "、")
            .replace(/\./g, "")
            .replace("和", "、")
        normalizedArtist = normalizedArtist.replace(/\(.*\)|（.*）/g, "")
        return normalizedArtist.trim()
    }

    private normalizeLyrics(inputStr: string) {
        const ACCEPTED_REGEX = /\[(\d\d):(\d\d)\.(\d{2,3})\].*/
        const BANNED_REGEX = /.+].+[:：].+/
        const MAX_CUT_LENGTH = 20

        let lines = inputStr.replace(/&apos;/g, "'").split("\n")

        lines = lines.filter((line) => ACCEPTED_REGEX.test(line))

        function removeSongDetails(inputList: string[]) {
            let headCutLine = 0
            const headCutStart = Math.min(MAX_CUT_LENGTH, inputList.length - 1)
            for (let i = headCutStart; i >= 0; i--) {
                if (BANNED_REGEX.test(inputList[i] ?? "")) {
                    headCutLine = i + 1
                    break
                }
            }

            let trimmedLines = inputList.slice(headCutLine)

            let tailCutLine = 0
            const tailCutStart = Math.min(trimmedLines.length - 30, inputList.length - 1)
            for (let i = tailCutStart; i >= 0; i--) {
                if (BANNED_REGEX.test(inputList[inputList.length - i] ?? "")) {
                    tailCutLine = i + 1
                    break
                }
            }

            return tailCutLine !== 0 ? trimmedLines.slice(0, -tailCutLine) : trimmedLines
        }

        lines = removeSongDetails(lines)

        return lines.join("\n").trim()
    }
}
