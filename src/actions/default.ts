import c from "chalk"
import { DefaultAction } from "../index.js"
import { getLogger } from "../util/logger.js"
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
import printTags from "../util/printTag.js"

export const defaultAction: DefaultAction = async (inputUrl, options) => {
    const missingUrlText = [
        `Missing argument '${c.green("url")}'`,
        `Use: '${c.yellow("spdl")} [${c.cyan("options")}] [${c.green("url")}]'`,
        `Use: '${c.yellow("spdl")} ${c.cyan("--help")}' for more information.`,
    ].join("\n")

    // eslint-disable-next-line no-console
    if (!inputUrl) return console.log(missingUrlText)

    const { verbose, output, searchLimit } = options
    const print = getLogger("SPDL", verbose)

    const spotify = await Spotify.createClient(verbose)
    if (!spotify) return print("Failed to create spotify client")

    const url = new URL(inputUrl)
    if (url.host !== "open.spotify.com") return print("Url must a spotify track url")

    const [uriType, uri] = url.pathname.split("/").slice(1)

    if (!uri) return print("Failed to get the uri from the url")

    if (uriType === "track") {
        const track = await spotify.getTrack(uri)

        if (!track) return print("Failed find the track from the url")

        const simpleTrack = createSimpleTrackFromTrack(track)

        print(c.blue(`Downloading "${simpleTrack.name}"`))

        const tags = await spotify.getTags(simpleTrack)
        printTags(tags)

        const downloader = new Downloader({
            track: simpleTrack,
            verbose: verbose,
            downloadLocation: output,
            songSearchLimit: searchLimit,
            libCheck: true,
        })

        const filePath = downloader.outputPath

        const exists = await isExists(filePath)

        if (exists) return print("Track already exists in that location")

        await downloader.downloadAudio()

        const kugou = new Kugou({ track: simpleTrack, filePath, verbose })

        const lyrics = await kugou.setLyrics(tags)

        if (options.lrc) {
            const lrcFilePath = filePath.replace(/(.mp3)(?![\s\S]*\.mp3)/, ".lrc")
            if (lyrics) writeFile(lrcFilePath, lyrics, "utf8")
        }
    } else if (uriType !== "playlist" && uriType !== "album") {
        return print("Invalid url. Please provide a spotify track, playlist or album url.")
    }

    let tracks: SimpleTrack[] = []

    if (uriType === "playlist") {
        const playlist = await spotify.getPlaylist(uri)

        if (!playlist) return print("Failed find the track from the url")

        if (!playlist.tracks?.items?.length) return print("No track found in the playlist")

        print(`Downloading playlist : ${playlist.name}`)

        tracks = createSimpleTracksFromPlaylist(playlist)
    } else if (uriType === "album") {
        const album = await spotify.getAlbum(uri)

        if (!album) return print("Failed find the track from the url")

        if (!album.tracks?.items?.length) return print("No track found in the album")

        print(`Downloading album : ${album.name}`)

        tracks = createSimpleTracksFromAlbum(album)
    }

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as SimpleTrack

        print(`${c.green(i + 1)}/${c.yellow(tracks.length)}`)

        print(c.blue(`Downloading "${track.name}"`))

        const tags = await spotify.getTags(track)
        printTags(tags)

        const downloader = new Downloader({
            track,
            verbose,
            downloadLocation: output,
            songSearchLimit: searchLimit,
            libCheck: i === 0,
        })

        const filePath = downloader.outputPath

        const exists = await isExists(filePath)

        if (exists) {
            print("Track already exists in that location")
            continue
        }

        await downloader.downloadAudio()

        const kugou = new Kugou({ track, filePath, verbose })

        const lyrics = await kugou.setLyrics(tags)

        if (options.lrc) {
            const lrcFilePath = filePath.replace(/(.mp3)(?![\s\S]*\.mp3)/, ".lrc")
            if (lyrics) writeFile(lrcFilePath, lyrics, "utf8")
        }

        if (i !== tracks.length - 1) await sleep(options.sleepTime * 1000)
    }
}
