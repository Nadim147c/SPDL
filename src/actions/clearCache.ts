import { rmdir } from "fs/promises"
import { ClearCacheAction } from "../index.js"
import { getLogger } from "../util/logger.js"
import { getCachePath } from "../util/homePaths.js"

export const clearCacheAction: ClearCacheAction = async (options) => {
    const { all, images, tracks, albums, playlists, tokens, verbose } = options
    const print = getLogger("SPDL", verbose)

    const del = async (name: string) => {
        const path = await getCachePath(name)
        try {
            await rmdir(path, { recursive: true })
            print(`Removed path: ${path}`)
        } catch (error) {
            print(`Failed to remove path: ${path}`)
        }
    }

    if (all) return del("")

    if (images) await del("images")
    if (tracks) await del("tracks")
    if (albums) await del("albums")
    if (playlists) await del("playlists")
    if (tokens) await del("tokens")
}
