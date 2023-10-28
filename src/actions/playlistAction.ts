import z from "zod"
import Downloader from "../structure/Downloader.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/Util.js"
import Kugou from "../structure/Kugou.js"

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

    const tracks = playlist.tracks.items.map((item) => item.track)

    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

    for await (const track of tracks) {
        const downloader = new Downloader({
            track,
            verbose: options.verbose,
            downloadLocation: options.output,
            playlistName: playlist.name,
        })

        await downloader.downloadAudio()
        const filePath = downloader.outputPath

        const kugou = new Kugou(track, filePath, options.verbose)

        const tags = await spotify.getTags(track)

        await kugou.setLyrics(tags)

        await sleep(options.sleepTime * 1000)
    }
}
