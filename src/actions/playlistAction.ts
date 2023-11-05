import c from "chalk"
import z from "zod"
import Downloader from "../structure/Downloader.js"
import Kugou from "../structure/Kugou.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/logger.js"
import printTags from "../util/printTag.js"
import { SimpleTrack, createSimpleTracksFromPlaylist } from "../util/simpleTracks.js"
import sleep from "../util/sleep.js"

const optionSchema = z.object({
    verbose: z.boolean(),
    sleepTime: z.number(),
    output: z.string(),
})

export default async function playlistAction(playlistUrl: string, commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("SPDL", options.verbose)

    const spotify = await Spotify.createClient(options.verbose)
    if (!spotify) return print("Failed to create spotify client")

    await spotify.authorizeClient()

    const url = new URL(playlistUrl)
    if (url.host !== "open.spotify.com") return print("Url must a spotify playlist url")

    const [uriType, uri] = url.pathname.split("/").slice(1)
    if (uriType !== "playlist") return print("Url must a spotify playlist url")

    if (!uri) return print("Failed to get the uri from the url")
    const playlist = await spotify.getPlaylist(uri)

    if (!playlist) return print("Failed find the track from the url")

    if (!playlist.tracks?.items?.length) return print("No track found in the playlist")

    print(`Downloading playlist : ${playlist.name}`)

    const tracks = createSimpleTracksFromPlaylist(playlist)

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
            libCheck: i === 0,
        })

        await downloader.downloadAudio()
        const filePath = downloader.outputPath

        const kugou = new Kugou({ track, filePath, verbose: options.verbose })

        await kugou.setLyrics(tags)

        await sleep(options.sleepTime * 1000)
    }
}
