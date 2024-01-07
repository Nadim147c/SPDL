/* eslint-disable no-console */
import { ClearCacheAction } from "../index.js"
import { getCachePath } from "../util/homePaths.js"
import { rm } from "fs/promises"

export const clearCacheAction: ClearCacheAction = async (options) => {
    const { all, images, tracks, albums, playlists, tokens, verbose } = options

    const del = async (name: string) => {
        const path = await getCachePath(name)
        try {
            await rm(path, { recursive: true })
            console.log("[SPDL]", `Removed path: ${path}`)
        } catch (error) {
            if (verbose) console.error("[SPDL]", `Failed to remove path: ${path}`)
        }
    }

    if (all) return del("")

    if (images) await del("image")
    if (tracks) await del("track")
    if (albums) await del("album")
    if (playlists) await del("playlist")
    if (tokens) await del("token")
}
