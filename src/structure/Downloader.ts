import c from "chalk"
import { exec, execSync, spawn } from "child_process"
import cliProgress from "cli-progress"
import ora from "ora"
import { promisify } from "util"
import { SpotifyPlaylistTrack } from "../schema/Spotify/Playlist.js"
import { SpotifyTrack } from "../schema/Spotify/Track.js"
import { youtubeMusicSearchSchema } from "../schema/YTDLP/Search.js"
import { LoggerType, getLogger } from "../util/Util.js"

const promiseExec = promisify(exec)

interface ConstructorOptions {
    track: SpotifyTrack
    verbose: boolean
    downloadLocation: string
    playlistName?: string
}

export default class Downloader {
    track: SpotifyTrack | SpotifyPlaylistTrack
    playlistName?: string
    outputPath: string
    private trackName: string
    private trackArtists: string
    private print: LoggerType
    private rootLocation: string
    private verbose: boolean

    constructor(options: ConstructorOptions) {
        const { track, verbose, downloadLocation } = options

        this.print = getLogger("SPDL-Downloader", verbose)

        this.track = track
        this.trackName = this.sanitizeString(track.name)
        this.trackArtists = track.artists.map((artist) => artist.name).join(", ")
        this.rootLocation = downloadLocation
        this.verbose = verbose

        this.outputPath = `${this.rootLocation}/${track.name}.mp3`

        if (options.playlistName) {
            this.playlistName = options.playlistName
            this.outputPath = `${this.rootLocation}/${this.playlistName}/${this.trackName}.mp3`
        }

        const ytdlpVersion = execSync("yt-dlp --version").toString().trim()
        const ffmpegVersionStr = execSync("ffmpeg -version").toString()
        const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

        if (ffmpegVersion && ytdlpVersion) {
            this.print(`YT-DLP Version: ${ytdlpVersion}`)
            this.print(`FFMPEG Version: ${ffmpegVersion}`)
        } else {
            throw "yt-dlp and ffmpeg are missing. Run `spdl setup` Before running any command."
        }
    }

    async searchSong(songSearchLimit: number) {
        const searchQuery = `${this.trackName} - ${this.trackArtists}`

        const url = new URL("search", "https://music.youtube.com")
        url.searchParams.set("q", searchQuery)
        url.hash = "Songs"

        const json = "--dump-single-json"
        const noDownload = "--skip-download"
        const limit = `--playlist-end ${songSearchLimit}`

        const cmd = `yt-dlp ${url} ${json} ${noDownload} ${limit}`

        this.print(`URL: ${url}`)

        const spinner = ora({
            prefixText: "Searching song",
            color: "cyan",
            spinner: "arc",
        })

        let results

        try {
            spinner.start()
            results = await promiseExec(cmd)
            spinner.succeed()
        } catch (error) {
            spinner.fail("Error searching song")
            this.print(error, true)
            return
        }

        try {
            const dataObj = JSON.parse(results.stdout)
            const data = youtubeMusicSearchSchema.parse(dataObj)
            return data.entries
        } catch (error) {
            this.print("Error parseing youtube search json data")
            this.print(error)
        }
    }

    async downloadAudio() {
        this.print(`Downloading track: ${this.track.name}`)
        this.print(`Track will be downloaded to: ${this.outputPath}`)

        const trackName = this.trackName
        let outputTemplate = `${this.rootLocation}/${trackName}.%(ext)s`

        if (this.playlistName) {
            const playlist = this.sanitizeString(this.playlistName)
            outputTemplate = `${this.rootLocation}/${playlist}/${trackName}.%(ext)s`
        }

        const switches = ["--extract-audio", "--no-playlist"]
        const format = ["--format", "ba/best", "--audio-format", "mp3"]
        const sponsorBlock = ["--sponsorblock-remove", "all"]
        const output = ["--output", outputTemplate]

        const searchEntries = await this.searchSong(3)

        if (!searchEntries?.length) {
            return this.print("Failed to get search entry from youtube music")
        }

        const duration = this.track.duration_ms / 1000

        const sortedEntries = searchEntries.sort((a, b) => {
            const durationDiffA = Math.abs(duration - a.duration)
            const durationDiffB = Math.abs(duration - b.duration)
            return durationDiffA - durationDiffB
        })

        const url = sortedEntries[0].original_url

        const ytDlpArgs = [url, ...switches, ...format, ...sponsorBlock, ...output]

        return new Promise((resolve, reject) => {
            const progressRegex = /\[download\] *(.*) of *~? *([^ ]*) at *([^ ]*) *ETA *([^ ]*)/

            const ytDlpProcess = spawn("yt-dlp", ytDlpArgs)

            let progress = false

            const cBar = c.bgWhite(c.green("{bar}"))
            const cParcent = c.cyan("{percentage}")
            const cSize = c.yellow("{size}")
            const cSpeed = c.green("{speed}")
            const cETA = c.magenta("{eta}")

            const progressBar = new cliProgress.SingleBar({
                format: `[Download] [${cBar}] | ${cParcent}% || Size: ${cSize} || Speed: ${cSpeed} || ETA: ${cETA}`,
                barCompleteChar: "█",
                barIncompleteChar: " ",
                hideCursor: true,
            })

            ytDlpProcess.stdout.on("data", (data) => {
                const dataString = data.toString().trim()
                const match = dataString.match(progressRegex)

                if (match) {
                    const percentStr = match[1].replace("%", "")
                    const percent = parseFloat(percentStr)
                    const size = match[2]
                    const speed = match[3]
                    const eta = match[4]

                    if (!progress) {
                        progressBar.start(100, percent, { size, speed, eta })
                    } else {
                        progressBar.update(percent, { size, speed, eta })
                    }
                    progress = true
                } else if (progress) {
                    progressBar.stop()
                } else {
                    console.log(dataString)
                }
            })

            ytDlpProcess.stderr.on("data", (data) => console.error(data.toString()))

            ytDlpProcess.on("close", (code) => {
                if (code === 0) {
                    resolve(1)
                } else {
                    reject(new Error(`Command exited with code ${code}`))
                }
            })

            ytDlpProcess.on("error", (err) =>
                reject(new Error(`Error spawning the process: ${err.message}`))
            )
        })
    }

    private sanitizeString(input: string): string {
        const invalidCharsRegex = /[?*<>|":/\\]+/g
        const sanitizedString = input.replace(invalidCharsRegex, "")
        return sanitizedString.trim()
    }
}
