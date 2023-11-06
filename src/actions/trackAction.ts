import c from "chalk"
import { stat } from "fs/promises"
import CommandOptions from "../schema/CommandOptions.js"
import Downloader from "../structure/Downloader.js"
import Kugou from "../structure/Kugou.js"
import Spotify from "../structure/Spotify.js"
import { getLogger } from "../util/logger.js"
import printTags from "../util/printTag.js"
import { createSimpleTrackFromTrack } from "../util/simpleTracks.js"

const optionSchema = CommandOptions

export default async function trackAction(trackUrl: string, commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("SPDL", options.verbose)

    const spotify = await Spotify.createClient(options.verbose)
    if (!spotify) return print("Failed to create spotify client")

    await spotify.authorizeClient()

    const url = new URL(trackUrl)
    if (url.host !== "open.spotify.com") return print("Url must a spotify track url")

    const [uriType, uri] = url.pathname.split("/").slice(1)
    if (uriType !== "track") return print("Url must a spotify track url")

    if (!uri) return print("Failed to get the uri from the url")
    const track = await spotify.getTrack(uri)

    if (!track) return print("Failed find the track from the url")

    const simpleTrack = createSimpleTrackFromTrack(track)

    print(c.blue(`Downloading "${simpleTrack.name}"`))

    const tags = await spotify.getTags(simpleTrack)
    printTags(tags)

    const downloader = new Downloader({
        track: simpleTrack,
        verbose: options.verbose,
        downloadLocation: options.output,
        songSearchLimit: options.searchLimit,
        libCheck: true,
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
        return
    }

    await downloader.downloadAudio()

    const kugou = new Kugou({ track: simpleTrack, filePath, verbose: options.verbose })

    await kugou.setLyrics(tags)
}
