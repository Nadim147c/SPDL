import z from "zod"
import Downloader from "../structure/Downloader.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/Util.js"

const optionSchema = z.object({
    verbose: z.boolean(),
})

export default async function trackAction(trackUrl: string, commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("CLI", options.verbose)

    const spotify = await Spotify.createClient(options.verbose)
    if (!spotify) throw "Failed to create spotify client"

    await spotify.authorizeClient()

    const url = new URL(trackUrl)
    if (url.host !== "open.spotify.com") return print("Url must a spotify track url")

    const [uriType, uri] = url.pathname.split("/").slice(1)
    if (uriType !== "track") return print("Url must a spotify track url")

    if (!uri) return print("Failed to get the uri from the url")
    const track = await spotify.getTrack(uri)

    if (!track) return print("Failed find the track from the url")

    const downloader = new Downloader(track, options.verbose)

    // TODO: Add lyrics to metadata

    await downloader.downloadAudio()
    await downloader.editMetadata()
}
