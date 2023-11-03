import z from "zod"
import Downloader from "../structure/Downloader.js"
import Spotify from "../structure/Spotify.js"
import Kugou from "../structure/Kugou.js"
import { SimpleTrack, createSimpleTracksFromAlbum } from "../util/simpleTracks.js"
import { getLogger } from "../util/logger.js"

const optionSchema = z.object({
    verbose: z.boolean(),
    sleepTime: z.number(),
    output: z.string(),
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

    const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as SimpleTrack

        const downloader = new Downloader({
            track,
            verbose: options.verbose,
            downloadLocation: options.output,
            libCheck: i === 0,
        })

        await downloader.downloadAudio()
        const filePath = downloader.outputPath

        const kugou = new Kugou({ track, filePath, verbose: options.verbose })

        const tags = await spotify.getTags(track)

        await kugou.setLyrics(tags)

        await sleep(options.sleepTime * 1000)
    }
}
