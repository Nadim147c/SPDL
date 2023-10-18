import axios from "axios"
import { execSync, spawn } from "child_process"
import cliProgress from "cli-progress"
import { Promise as NodeId3, TagConstants, Tags } from "node-id3"
import { SpotifyPlaylistTrack } from "../models/SpotifyPlaylists"
import { SpotifyTrack } from "../models/SpotifyTrack"
import { loadCache, saveCache } from "../util/Util"

interface DownloadAudioOptions {
    track: SpotifyTrack | SpotifyPlaylistTrack
    playlist?: string
}

interface EditMetadataOptions {
    path: string
    title: string
    artists: string[]
    album: string
    cover: string
}

export default class Downloader {
    constructor() {
        const ytdlpVersion = execSync("yt-dlp --version").toString().trim()
        const ffmpegVersionStr = execSync("ffmpeg -version").toString()
        const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

        if (ffmpegVersion && ytdlpVersion) {
            console.log(`YT-DLP Version: ${ytdlpVersion}`)
            console.log(`FFMPEG Version: ${ffmpegVersion}`)
        } else {
            console.error("Required external dependency not found")
        }
    }

    async downloadAudio(options: DownloadAudioOptions) {
        const track = options.track
        const trackName = this.sanitizeString(track.name)
        let outputTemplate = `downloads/${track.name}.%(ext)s`
        let outputPath = `downloads/${track.name}.mp3`

        if (options.playlist) {
            const playlist = this.sanitizeString(options.playlist)
            outputTemplate = `downloads/${playlist}/${trackName}.%(ext)s`
            outputPath = `downloads/${playlist}/${trackName}.mp3`
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
                    resolve(outputPath)
                } else {
                    reject(new Error(`Command exited with code ${code}`))
                }
            })

            ytDlpProcess.on("error", (err) =>
                reject(new Error(`Error spawning the process: ${err.message}`))
            )
        })
    }

    sanitizeString(input: string): string {
        const invalidCharsRegex = /[?*<>|":/\\]+/g
        const sanitizedString = input.replace(invalidCharsRegex, "")
        return sanitizedString.trim()
    }

    async editMetadata(options: EditMetadataOptions) {
        const coverPathSplit = options.cover.split("/")
        const coverFileName = coverPathSplit[coverPathSplit.length - 1]

        let coverBuf = (await loadCache("image", coverFileName)) as Buffer

        if (!coverBuf) {
            const imageRes = await axios.get(options.cover, { responseType: "arraybuffer" })
            coverBuf = Buffer.from(imageRes.data)
            await saveCache(coverBuf, "image", coverFileName)
        }

        const tags: Tags = {
            title: options.title,
            artist: options.artists.join(", "),
            album: options.album,
            image: {
                mime: "image/jpg",
                type: { id: TagConstants.AttachedPicture.PictureType.FRONT_COVER },
                description: "Cover Image",
                imageBuffer: coverBuf,
            },
        }

        await NodeId3.write(tags, options.path)

        return tags
    }
}
