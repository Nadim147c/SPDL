import c from "chalk"
import { DefaultAction } from "../index.js"
import Spotify from "../structure/Spotify.js"
import {
    SimpleTrack,
    createSimpleTrackFromTrack,
    createSimpleTracksFromAlbum,
    createSimpleTracksFromPlaylist,
} from "../util/simpleTracks.js"
import Downloader from "../structure/Downloader.js"
import { isExists } from "../util/isExists.js"
import Kugou from "../structure/Kugou.js"
import { writeFile } from "fs/promises"
import sleep from "../util/sleep.js"
import Logger from "../structure/Logger.js"

export const defaultAction: DefaultAction = async (inputUrl, options) => {
    const missingUrlText = [
        `Missing argument '${c.green("url")}'`,
        `Use: '${c.yellow("spdl")} [${c.cyan("options")}] [${c.green("url")}]'`,
        `Use: '${c.yellow("spdl")} ${c.cyan("--help")}' for more information.`,
    ].join("\n")

    // eslint-disable-next-line no-console
    if (!inputUrl) return console.log(missingUrlText)

    const { verbose, output, searchLimit } = options

    const logger = new Logger("Getting title Data", verbose)
    logger.start()

    const spotify = await Spotify.createClient(logger)
    if (!spotify) return logger.exit("Failed to create spotify client")

    const url = new URL(inputUrl)
    if (url.host !== "open.spotify.com") return logger.exit("Url must a spotify track url")

    const [uriType, uri] = url.pathname.split("/").slice(1)

    if (!uri) return logger.exit("Failed to get the uri from the url")

    if (uriType === "track") {
        const track = await spotify.getTrack(uri)

        if (!track) return logger.exit("Failed find the track from the url")

        const simpleTrack = createSimpleTrackFromTrack(track)

        logger.setTitle(`${simpleTrack.name} - ${simpleTrack.artists.join(", ")}`)

        const tags = await spotify.getTags(simpleTrack)

        const downloader = new Downloader({
            logger,
            track: simpleTrack,
            verbose: verbose,
            downloadLocation: output,
            songSearchLimit: searchLimit,
            libCheck: true,
        })

        const filePath = downloader.outputPath

        const exists = await isExists(filePath)

        if (exists) logger.warn()

        try {
            await downloader.downloadAudio()
        } catch (error) {
            return logger.exit("Failed to download the song")
        }

        const kugou = new Kugou({ track: simpleTrack, filePath, logger })

        const lyrics = await kugou.setLyrics(tags)

        if (options.writeLrc) {
            const lrcFilePath = filePath.replace(/(.mp3)(?![\s\S]*\.mp3)/, ".lrc")
            if (lyrics) writeFile(lrcFilePath, lyrics, "utf8")
        }
        logger.succeed()
        return
    } else if (uriType !== "playlist" && uriType !== "album") {
        return logger.exit("Invalid url. Please provide a spotify track, playlist or album url.")
    }

    let tracks: SimpleTrack[] = []

    if (uriType === "playlist") {
        const playlist = await spotify.getPlaylist(uri)

        if (!playlist) return logger.exit("Failed find the track from the url")

        if (!playlist.tracks?.items?.length) return logger.exit("No track found in the playlist")

        logger.show(`Downloading playlist : ${playlist.name}`)

        tracks = createSimpleTracksFromPlaylist(playlist)
    } else if (uriType === "album") {
        const album = await spotify.getAlbum(uri)

        if (!album) return logger.exit("Failed find the track from the url")

        if (!album.tracks?.items?.length) return logger.exit("No track found in the album")

        logger.show(`Downloading album : ${album.name}`)

        tracks = createSimpleTracksFromAlbum(album)
    }

    logger.succeed()

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as SimpleTrack

        const loggerTitle = `${track.name} - ${track.artists.join(", ")}`
        const logger = new Logger(loggerTitle, verbose, [i + 1, tracks.length])
        logger.start()

        const tags = await spotify.getTags(track)

        const downloader = new Downloader({
            logger,
            track,
            verbose,
            downloadLocation: output,
            songSearchLimit: searchLimit,
            libCheck: i === 0,
        })

        const filePath = downloader.outputPath

        const exists = await isExists(filePath)

        if (exists) {
            logger.exit("Track already exists in that location")
            continue
        }

        try {
            await downloader.downloadAudio()
        } catch (error) {
            logger.exit(`Failed Downloading Song: ${error instanceof Error ? error?.message : ""}`)
            continue
        }

        const kugou = new Kugou({ track, filePath, logger })

        const lyrics = await kugou.setLyrics(tags)

        if (options.writeLrc) {
            const lrcFilePath = filePath.replace(/(.mp3)(?![\s\S]*\.mp3)/, ".lrc")
            if (lyrics) writeFile(lrcFilePath, lyrics, "utf8")
        }

        logger.succeed()
        if (i === tracks.length - 1) return
        else await sleep(options.sleepTime * 1000)
    }
}
