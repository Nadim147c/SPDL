import { ClearCacheAction } from "../index.js"
import { getLogger } from "../util/logger.js"
import { getCachePath } from "../util/homePaths.js"
import { rm } from "fs/promises"

export const clearCacheAction: ClearCacheAction = async (options) => {
    const { all, images, tracks, albums, playlists, tokens, verbose } = options
    const print = getLogger("SPDL", verbose)

    const del = async (name: string) => {
        const path = await getCachePath(name)
        try {
            await rm(path, { recursive: true })
            print(`Removed path: ${path}`)
        } catch (error) {
            print(`Failed to remove path: ${path}`)
        }
    }

    if (all) return del("")

    if (images) await del("image")
    if (tracks) await del("track")
    if (albums) await del("album")
    if (playlists) await del("playlist")
    if (tokens) await del("token")
}
