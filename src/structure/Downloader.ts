import axios from "axios"
import { execSync, spawn } from "child_process"
import cliProgress from "cli-progress"
import { SpotifyPlaylistTrack } from "../schema/Spotify/Playlist.js"
import { SpotifyTrack } from "../schema/Spotify/Track.js"
import { LoggerType, getLogger, loadCache, saveCache } from "../util/Util.js"

import nodeId3, { Tags } from "node-id3"

const { Promise: NodeId3, TagConstants } = nodeId3

interface EditMetadataOptions {
    path: string
    title: string
    artists: string[]
    album: string
    cover: string
}

export default class Downloader {
    track: SpotifyTrack | SpotifyPlaylistTrack
    playlistName?: string
    private trackName: string
    private outputPath: string
    private print: LoggerType

    constructor(track: SpotifyTrack, verbose: boolean, playlistName?: string) {
        this.print = getLogger("Downloader", verbose)
        this.track = track
        this.trackName = this.sanitizeString(track.name)
        this.outputPath = `downloads/${track.name}.mp3`
        if (playlistName) {
            this.playlistName = playlistName
            this.outputPath = `downloads/${playlistName}/${this.trackName}.mp3`
        }

        const ytdlpVersion = execSync("yt-dlp --version").toString().trim()
        const ffmpegVersionStr = execSync("ffmpeg -version").toString()
        const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

        if (ffmpegVersion && ytdlpVersion) {
            this.print(`YT-DLP Version: ${ytdlpVersion}`)
            this.print(`FFMPEG Version: ${ffmpegVersion}`)
        } else {
            throw "yt-dlp and ffmpeg are missing"
        }
    }

    async downloadAudio() {
        const track = this.track
        const trackName = this.trackName
        let outputTemplate = `downloads/${track.name}.%(ext)s`

        if (this.playlistName) {
            const playlist = this.sanitizeString(this.playlistName)
            outputTemplate = `downloads/${playlist}/${trackName}.%(ext)s`
        }

        const switches = ["--extract-audio", "--no-playlist"]
        const format = ["--format", "ba/best", "--audio-format", "mp3"]
        const sponsorBlock = ["--sponsorblock-remove", "all"]
        const output = ["--output", outputTemplate]

        const ytDlpArgs = [
            `ytsearch:${track.name}`,
            ...switches,
            ...format,
            ...sponsorBlock,
            ...output,
        ]

        return new Promise((resolve, reject) => {
            const progressRegex = /\[download\] *(.*) of *\~? *([^ ]*) at *([^ ]*) *ETA *([^ ]*)/

            const ytDlpProcess = spawn("yt-dlp", ytDlpArgs)

            let progress = false

            let progressBar = new cliProgress.SingleBar({
                format: `[Download] {bar} | {percentage}% || Size: {size} || Speed: {speed} || ETA: {eta}`,
                barCompleteChar: "\u2588",
                barIncompleteChar: "\u2591",
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

    async editMetadata() {
        let coverBuf: Buffer
        const tags: Tags = {
            title: this.track.name,
            artist: this.track.artists.map((artist) => artist.name).join(", "),
            album: this.track.album.name,
            releaseTime: this.track.album.release_date,
        }

        const coverUrl = this.track.album.images?.[0]?.url
        if (coverUrl) {
            const coverPathSplit = coverUrl.split("/")
            const coverFileName = coverPathSplit[coverPathSplit.length - 1]

            if (!coverFileName) throw "Failed to file name from the cover url"

            coverBuf = (await loadCache("image", coverFileName)) as Buffer

            if (!coverBuf) {
                const imageRes = await axios.get(coverUrl, { responseType: "arraybuffer" })
                coverBuf = Buffer.from(imageRes.data)
                await saveCache(coverBuf, "image", coverFileName)
            }
            const image = {
                mime: "image/jpg",
                type: { id: TagConstants.AttachedPicture.PictureType.FRONT_COVER },
                description: "Cover Image",
                imageBuffer: coverBuf,
            }

            tags.image = image
        }

        await NodeId3.write(tags, this.outputPath)

        return tags
    }
}
