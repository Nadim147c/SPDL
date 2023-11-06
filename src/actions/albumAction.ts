import c from "chalk"
import { stat } from "fs/promises"
import z from "zod"
import Downloader from "../structure/Downloader.js"
import Kugou from "../structure/Kugou.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/logger.js"
import printTags from "../util/printTag.js"
import { SimpleTrack, createSimpleTracksFromAlbum } from "../util/simpleTracks.js"
import sleep from "../util/sleep.js"
import CommandOptions from "../schema/CommandOptions.js"

const optionSchema = CommandOptions.extend({
    sleepTime: z.number(),
})

export default async function albumAction(albumUrl: string, commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("SPDL", options.verbose)

    const spotify = await Spotify.createClient(options.verbose)
    if (!spotify) return print("Failed to create spotify client")

    await spotify.authorizeClient()

    const url = new URL(albumUrl)
    if (url.host !== "open.spotify.com") return print("Url must a spotify album url")

    const [uriType, uri] = url.pathname.split("/").slice(1)
    if (uriType !== "album") return print("Url must a spotify playlist url")

    if (!uri) return print("Failed to get the uri from the url")
    const album = await spotify.getAlbum(uri)

    if (!album) return print("Failed find the track from the url")

    if (!album.tracks?.items?.length) return print("No track found in the album")

    print(`Downloading album : ${album.name}`)

    const tracks = createSimpleTracksFromAlbum(album)

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as SimpleTrack

        print(`${c.green(i + 1)}/${c.yellow(tracks.length)}`)

        print(c.blue(`Downloading "${track.name}"`))

        const tags = await spotify.getTags(track)
        printTags(tags)

        const downloader = new Downloader({
            track,
            verbose: options.verbose,
            downloadLocation: options.output,
            songSearchLimit: options.searchLimit,
            libCheck: i === 0,
        })

        const filePath = downloader.outputPath

        let exists = false

        try {
            const fileStat = await stat(filePath)
            exists = fileStat.isFile()
        } catch (error) {
            // action isn't required
        }

        if (exists) {
            print("Track already exists in that location")
            continue
        }

        await downloader.downloadAudio()

        const kugou = new Kugou({ track, filePath, verbose: options.verbose })

        await kugou.setLyrics(tags)

        if (i !== tracks.length - 1) await sleep(options.sleepTime * 1000)
    }
}
