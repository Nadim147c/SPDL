import { execSync, spawn } from "child_process"
import { watch } from "chokidar"
import { CommanderError } from "commander"
import { readFile, unlink } from "fs/promises"
import ora from "ora"
import {
    YouTubeMusicSearch,
    YouTubeMusicSearchNonEmptey,
    youtubeMusicSearchSchema,
    youtubeMusicSongSchema,
} from "../schema/YTDLP/Search.js"
import { getCachePath } from "../util/homePaths.js"
import { LoggerType, getLogger } from "../util/logger.js"
import { SimpleTrack } from "../util/simpleTracks.js"

interface ConstructorOptions {
    track: SimpleTrack
    verbose: boolean
    downloadLocation: string
    songSearchLimit: number
    libCheck: boolean
}

export default class Downloader {
    track: SimpleTrack
    outputPath: string
    private trackName: string
    private trackArtists: string
    private print: LoggerType
    private rootLocation: string
    private verbose: boolean
    private songSearchLimit: number

    constructor(options: ConstructorOptions) {
        const { track, verbose, downloadLocation } = options

        this.print = getLogger("Downloader", verbose)

        this.track = track
        this.trackName = this.sanitizeString(track.name)
        this.trackArtists = track.artists.join(", ")
        this.rootLocation = downloadLocation
        this.verbose = verbose
        this.songSearchLimit = options.songSearchLimit

        const senitizePlaylist = this.sanitizeString(this.track.playlist ?? "")
        const senitizeAlbum = this.sanitizeString(this.track.album)

        switch (track.originType) {
            case "album":
                this.outputPath = `${this.rootLocation}/${senitizeAlbum}/${this.trackName}.mp3`
                break

            case "playlist":
                this.outputPath = `${this.rootLocation}/${senitizePlaylist}/${this.trackName}.mp3`
                break

            default:
                this.outputPath = `${this.rootLocation}/${this.trackName}.mp3`
                break
        }

        if (options.libCheck) {
            try {
                execSync("yt-dlp --version")
                execSync("ffmpeg -version")
            } catch (error) {
                const errMsg = "yt-dlp and ffmpeg are missing."
                throw new CommanderError(1, "missing tools", errMsg)
            }
        }
    }

    private createSearchUrl() {
        const searchQuery = `${this.trackName} - ${this.trackArtists}`

        const url = new URL("search", "https://music.youtube.com")
        url.searchParams.set("q", searchQuery)
        url.hash = "Songs"

        return url
    }

    async searchSong(songSearchLimit: number) {
        const url = this.createSearchUrl()

        const cacheDir = await getCachePath("yt-dlp")

        const json = "--write-info-json"
        const noDownload = "--skip-download"
        const limit = ["--playlist-end", songSearchLimit.toString()]
        const colors = ["--color", "always"]
        const outputTemplate = ["--output", `${cacheDir}\\%(playlist_index)s.%(ext)s`]

        const title = "Searching song"

        const spinner = ora({ text: title, color: "cyan", spinner: "arc" })

        let consoleText = `${title}:\n`

        const showText = (input: unknown) => {
            if (this.verbose) {
                consoleText += `\n${input}`
                spinner.text = consoleText
            } else {
                spinner.text = `${title}:\n${input}`
            }
        }

        spinner.start()

        const urlStr = url.toString()

        const songSearchArgs: string[] = [
            urlStr,
            json,
            noDownload,
            ...limit,
            ...colors,
            ...outputTemplate,
        ]

        const results: YouTubeMusicSearch = []

        const jsonWatcher = watch(cacheDir)

        jsonWatcher.on("add", async (path) => {
            if (!path.endsWith(".json")) return

            const dataStr = await readFile(path, "utf8")

            try {
                const data = JSON.parse(dataStr)
                const song = youtubeMusicSongSchema.safeParse(data)
                song.success ? results.push(song.data) : showText("Failed to load json data")
                await unlink(path)
            } catch (error) {
                this.print(error, true)
            }
        })

        const ytDlpProcess = spawn("yt-dlp", songSearchArgs)

        return new Promise<YouTubeMusicSearchNonEmptey>((resolve, reject) => {
            ytDlpProcess.stdout.on("data", showText)
            ytDlpProcess.stderr.on("data", showText)

            ytDlpProcess.on("close", (code) => {
                if (code !== 0) return reject("Failed to search song")

                const data = youtubeMusicSearchSchema.safeParse(results)
                if (!data.success) return reject("Song search results is 0")

                jsonWatcher.close()

                this.verbose ? spinner.succeed() : spinner.stop()

                resolve(data.data)
            })

            ytDlpProcess.on("error", reject)
        })
    }

    async downloadAudio() {
        this.print(`Download path: ${this.outputPath}`)

        const trackName = this.trackName
        let outputTemplate: string

        const senitizePlaylist = this.sanitizeString(this.track.playlist ?? "")
        const senitizeAlbum = this.sanitizeString(this.track.album)

        switch (this.track.originType) {
            case "album":
                outputTemplate = `${this.rootLocation}/${senitizeAlbum}/${trackName}.%(ext)s`
                break
            case "playlist":
                outputTemplate = `${this.rootLocation}/${senitizePlaylist}/${trackName}.%(ext)s`
                break
            default:
                outputTemplate = `${this.rootLocation}/${trackName}.%(ext)s`
                break
        }

        const songFindingOptions: string[] = []

        if (this.songSearchLimit > 1) {
            const searchEntries = await this.searchSong(1)

            if (!searchEntries?.length) {
                return this.print("Failed to get search entry from youtube music")
            }

            const duration = this.track.duration_ms / 1000

            const sortedEntries = searchEntries.sort((a, b) => {
                const durationDiffA = Math.abs(duration - a.duration)
                const durationDiffB = Math.abs(duration - b.duration)
                return durationDiffA - durationDiffB
            })
            songFindingOptions.push(sortedEntries[0].webpage_url)
        } else {
            const url = this.createSearchUrl().toString()
            songFindingOptions.push(url, "--playlist-end", "1")
        }

        const colors = ["--color", "always"]
        const switches = ["--extract-audio", "--no-playlist"]
        const format = ["--format", "ba/best", "--audio-format", "mp3"]
        const sponsorBlock = ["--sponsorblock-remove", "all"]
        const output = ["--output", outputTemplate]

        const ytDlpArgs = [
            ...songFindingOptions,
            ...colors,
            ...switches,
            ...format,
            ...sponsorBlock,
            ...output,
        ]

        const title = "Downloading audio"

        const spinner = ora({ text: title, color: "cyan", spinner: "arc" })

        let consoleText = `${title}:\n`

        const showText = (input: unknown) => {
            if (this.verbose) {
                consoleText += `\n${input}`
                spinner.text = consoleText
            } else {
                spinner.text = `${title}:\n${input}`
            }
        }

        spinner.start()

        const ytDlpProcess = spawn("yt-dlp", ytDlpArgs)

        return new Promise((resolve, reject) => {
            ytDlpProcess.stdout.on("data", showText)
            ytDlpProcess.stderr.on("data", showText)
            ytDlpProcess.on("close", (code) => {
                if (code !== 0) return reject("failed to download the audio")

                this.verbose ? spinner.succeed() : spinner.stop()

                resolve(code)
            })
            ytDlpProcess.on("error", reject)
        })
    }

    private sanitizeString(input: string): string {
        const invalidCharsRegex = /[?*<>|":/\\]+/g
        const sanitizedString = input.replace(invalidCharsRegex, "")
        return sanitizedString.trim()
    }
}
