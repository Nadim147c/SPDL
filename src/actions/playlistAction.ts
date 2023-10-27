import z, { number } from "zod"
import Downloader from "../structure/Downloader.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/Util.js"

const optionSchema = z.object({
    verbose: z.boolean(),
    sleepTime: z.number(),
})

export default async function playlistAction(playlistUrl: string, commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("CLI", options.verbose)

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

    const sleep = (time: number) => new Promise((resolve, reject) => setTimeout(resolve, time))

    for await (const track of tracks) {
        const downloader = new Downloader(track, options.verbose, playlist.name)

        // TODO: Add lyrics to metadata
        await downloader.downloadAudio()
        await downloader.editMetadata()

        await sleep(options.sleepTime * 1000)
    }
}
