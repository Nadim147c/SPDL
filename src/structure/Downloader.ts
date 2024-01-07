import { CommanderError } from "@commander-js/extra-typings"
import { execSync, spawn } from "child_process"
import Innertube from "youtubei.js"
import { SimpleTrack } from "../util/simpleTracks.js"
import Logger from "./Logger.js"

interface ConstructorOptions {
    logger: Logger
    track: SimpleTrack
    verbose: boolean
    downloadLocation: string
    songSearchLimit: number
    libCheck: boolean
}

export default class Downloader {
    track: SimpleTrack
    log: Logger
    outputPath: string
    outputTemplate: string
    private title: string
    private trackArtists: string
    private basePath: string
    private songSearchLimit: number

    constructor(options: ConstructorOptions) {
        const { track, downloadLocation, logger } = options

        this.log = logger
        this.track = track
        this.title = this.sanitizeString(track.name)
        this.trackArtists = track.artists.join(", ")
        this.basePath = downloadLocation
        this.songSearchLimit = options.songSearchLimit

        const senitizePlaylist = this.sanitizeString(this.track.playlist ?? "")
        const senitizeAlbum = this.sanitizeString(this.track.album)

        if (this.track.originType === "album") {
            this.outputPath = `${this.basePath}/${senitizeAlbum}/${this.title} [${this.track.id}].mp3`
            this.outputTemplate = `${this.basePath}/${senitizeAlbum}/${this.title} [${this.track.id}].%(ext)s`
        } else if (this.track.originType === "playlist") {
            this.outputPath = `${this.basePath}/${senitizePlaylist}/${this.title} [${this.track.id}].mp3`
            this.outputTemplate = `${this.basePath}/${senitizePlaylist}/${this.title} [${this.track.id}].%(ext)s`
        } else {
            this.outputPath = `${this.basePath}/${this.title} [${this.track.id}].mp3`
            this.outputTemplate = `${this.basePath}/${this.title} [${this.track.id}].%(ext)s`
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
        const searchQuery = `${this.title} - ${this.trackArtists}`

        const url = new URL("search", "https://music.youtube.com")
        url.searchParams.set("q", searchQuery)
        url.hash = "Songs"

        return url
    }

    async searchSong(songSearchLimit: number) {
        const youtube = await Innertube.create()
        const searchTerm = `${this.track.artists[0]} - ${this.track.name}`

        let search
        try {
            search = await youtube.music.search(searchTerm, { type: "song" })
        } catch (_) {
            return
        }

        const allowedEntries = search?.songs?.contents?.slice(0, songSearchLimit) ?? []

        const duration = this.track.durationMs / 1000

        const sortedEntries = allowedEntries.sort((a, b) => {
            const durationDiffA = Math.abs(duration - a!.duration!.seconds ?? 0)
            const durationDiffB = Math.abs(duration - b!.duration!.seconds ?? 0)

            return durationDiffA - durationDiffB
        })

        return sortedEntries[0]?.id
    }

    async downloadAudio() {
        this.log.show(`Download path: ${this.outputPath}`)

        const songFindingOptions: string[] = []

        if (this.songSearchLimit > 1) {
            const id = await this.searchSong(this.songSearchLimit)

            if (!id) return this.log.show("Failed to get search entry from youtube music")

            songFindingOptions.push(`https://www.youtube.com/watch?v=${id}`)
        } else {
            const url = this.createSearchUrl().toString()
            songFindingOptions.push(url, "--playlist-end", "1")
        }

        const colors = ["--color", "always"]
        const switches = ["--extract-audio", "--no-playlist"]
        const format = ["--format", "ba/best", "--audio-format", "mp3"]
        const quality = ["--audio-quality", "0"]
        const sponsorBlock = ["--sponsorblock-remove", "all"]
        const output = ["--output", this.outputTemplate]

        const ytDlpArgs = [
            ...songFindingOptions,
            ...colors,
            ...switches,
            ...format,
            ...quality,
            ...sponsorBlock,
            ...output,
        ]

        const ytDlpProcess = spawn("yt-dlp", ytDlpArgs)

        return new Promise((resolve, reject) => {
            ytDlpProcess.stdout.on("data", (data) => this.log.show(data.toString()))
            ytDlpProcess.stderr.on("data", (data) => this.log.show(data.toString()))
            ytDlpProcess.on("close", (code) => {
                if (code !== 0) return reject("failed to download the audio")

                this.log.show("Completed downloading the audio file")

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
