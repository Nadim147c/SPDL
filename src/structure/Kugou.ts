import axios from "axios"
import { readFile, writeFile } from "fs/promises"
import nodeId3, { Tags } from "node-id3"
import { HashSearchResultSchema } from "../schema/Kugou/HashSearch.js"
import { KeywordSearchResultSchema } from "../schema/Kugou/KeywordSearch.js"
import { LyricsDataSchema } from "../schema/Kugou/LyricsData.js"
import { SongSearchResultSchema } from "../schema/Kugou/SongSearch.js"
import { getCachePath } from "../util/homePaths.js"
import { SimpleTrack } from "../util/simpleTracks.js"
import Logger from "./Logger.js"

const NodeId3 = nodeId3.Promise

type ConstructorOptions = {
    track: SimpleTrack
    filePath: string
    logger: Logger
}
export default class Kugou {
    track: SimpleTrack
    log: Logger
    private DURATION_TOLERANCE = 8
    private title: string
    private artists: string
    private filePath: string

    constructor(options: ConstructorOptions) {
        this.log = options.logger

        this.filePath = options.filePath
        this.track = options.track
        this.title = this.normalizeTitle(options.track.name)
        this.artists = this.normalizeArtist(options.track.artists.join(", "))
    }

    private async loadCachedLyrics() {
        this.log.show("Trying to load cached lyrics")
        const lyricsPath = await getCachePath(`lyrics/${this.track.id}.txt`)
        try {
            const dataStr = await readFile(lyricsPath, "utf8")

            return dataStr
        } catch (error) {
            this.log.show("failed to load cached lyrics")
            this.log.show(error, true)
        }
    }

    private async saveLyricsToCache(lyrics: string) {
        const lyricsPath = await getCachePath(`lyrics/${this.track.id}.txt`)
        try {
            await writeFile(lyricsPath, lyrics, "utf8")
        } catch (error) {
            this.log.show("Failed to save lyrics to the cache")
            this.log.show(error, true)
        }
    }

    async getLyrics() {
        this.log.show("Getting lyrics")
        const cachedLyrics = await this.loadCachedLyrics()

        if (cachedLyrics) return cachedLyrics

        const candidate = await this.getLyricsCandidate()

        if (candidate) {
            const { id, accesskey } = candidate
            const lyricsData = await this.downloadLyrics(id, accesskey)

            if (!lyricsData) return

            const rawLyrics = Buffer.from(lyricsData.content, "base64").toString("utf8")
            const lyrics = this.normalizeLyrics(rawLyrics)

            await this.saveLyricsToCache(lyrics)

            return lyrics
        }
    }

    async setLyrics(tags: Tags) {
        const lyrics = await this.getLyrics()
        if (!lyrics) {
            await NodeId3.write(tags, this.filePath)
            return
        }

        tags.unsynchronisedLyrics = { language: "en", text: lyrics }

        await NodeId3.write(tags, this.filePath)

        return lyrics
    }

    async getLyricsCandidate() {
        const durationSec = this.track.durationMs / 1000
        const songs = await this.searchSongs()

        if (!songs?.data?.info) return

        for await (const song of songs.data.info) {
            if (Math.abs(song.duration - durationSec) <= this.DURATION_TOLERANCE) {
                const hashSearchData = await this.searchLyricsByHash(song.hash)
                const candidates = hashSearchData?.candidates

                if (candidates?.length) return candidates[0]
            }
        }

        this.log.show("Failed to get lyrics by song search")

        try {
            const lyricsByKeyword = await this.searchLyricsByKeyword()
            if (lyricsByKeyword?.candidates?.length) return lyricsByKeyword.candidates[0]
        } catch (error) {
            this.log.show("Failed to load lyrics candidates")
            this.log.show(error, true)
        }
    }

    async searchLyricsByKeyword() {
        const url = new URL("https://lyrics.kugou.com/search")
        url.searchParams.set("ver", "1")
        url.searchParams.set("man", "yes")
        url.searchParams.set("client", "pc")
        url.searchParams.set("keyword", `${this.artists} - ${this.title}`)
        url.search = url.search.replace(/\+/g, "%20")

        const urlStr = url.toString()

        try {
            this.log.show(`Searching lyrics with keyword\n${urlStr}`)
            const response = await axios.get(urlStr)
            const data = KeywordSearchResultSchema.parse(response.data)

            return data
        } catch (error) {
            this.log.show("Error searching lyrics")
            this.log.show(error, true)
        }
    }

    async searchSongs() {
        const url = new URL("api/v3/search/song", "https://mobileservice.kugou.com")
        url.searchParams.set("version", "9108")
        url.searchParams.set("plat", "0")
        url.searchParams.set("pagesize", "8")
        url.searchParams.set("showtype", "0")
        url.searchParams.set("keyword", `${this.artists} - ${this.title}`)
        url.search = url.search.replace(/\+/g, "%20")

        const urlStr = url.toString()

        try {
            this.log.show(`Searching songs\n${urlStr}`)
            const response = await axios.get(urlStr)
            const data = SongSearchResultSchema.parse(response.data)

            return data
        } catch (error) {
            this.log.show("Error searching songs")
            this.log.show(error, true)
        }
    }

    async searchLyricsByHash(songHash: string) {
        const url = new URL("search", "https://lyrics.kugou.com")
        url.searchParams.set("ver", "1")
        url.searchParams.set("man", "yes")
        url.searchParams.set("client", "pc")
        url.searchParams.set("hash", songHash)

        const urlStr = url.toString()

        try {
            this.log.show(`Searching lyrics by hash\n${urlStr}`)
            const response = await axios.get(urlStr)
            const data = HashSearchResultSchema.parse(response.data)

            return data
        } catch (error) {
            this.log.show("Error searching lyrics by hash")
            this.log.show(error, true)
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

        const urlStr = url.toString()

        try {
            this.log.show(`Downloading lyrics\nID: ${id} | AccessKey: ${accessKey}\n${urlStr}`)
            const response = await axios.get(urlStr)
            const data = LyricsDataSchema.parse(response.data)

            return data
        } catch (error) {
            this.log.show("Failed to download lyrics")
            this.log.show(error, true)
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

        let headCutLine = 0
        const headCutStartIndex = Math.min(MAX_CUT_LENGTH, lines.length - 1)
        for (let i = headCutStartIndex; i >= 0; i--) {
            if (BANNED_REGEX.test(lines[i] ?? "")) {
                headCutLine = i + 1
                break
            }
        }

        const headTrimmedLines = lines.slice(headCutLine)

        let tailCutLine = 0
        const tailCutStartIndex = Math.min(
            headTrimmedLines.length - MAX_CUT_LENGTH,
            lines.length - 1
        )
        for (let i = tailCutStartIndex; i >= 0; i--) {
            if (BANNED_REGEX.test(lines.at(-i) ?? "")) {
                tailCutLine = i + 1
                break
            }
        }

        lines = tailCutLine ? headTrimmedLines.slice(0, -tailCutLine) : headTrimmedLines

        return lines.join("\n").trim()
    }
}
