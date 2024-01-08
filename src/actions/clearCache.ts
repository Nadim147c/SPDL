/* eslint-disable no-console */
import c from "chalk"
import { rm } from "fs/promises"
import { ClearCacheAction } from "../index.js"
import { getCachePath } from "../util/homePaths.js"

export const clearCacheAction: ClearCacheAction = async (options, cmd) => {
    const { all, images, tracks, albums, playlists, tokens, verbose } = options

    const print = (...message: unknown[]) => console.log("[SPDL]", ...message)

    if (!images && !tracks && !albums && !playlists && !all) {
        print(c.red("Please provide a option"))
        const helpInfo = cmd.helpInformation({ error: true })
        print(helpInfo)
        return
    }

    const deleteDir = async (name: string) => {
        const path = await getCachePath(name)
        try {
            await rm(path, { recursive: true })
            print(`Removed path: ${path}`)
        } catch (error) {
            if (verbose) print(c.red(`Failed to remove path: ${path}`))
        }
    }

    if (all) return deleteDir("")

    if (images) await deleteDir("image")
    if (tracks) await deleteDir("track")
    if (albums) await deleteDir("album")
    if (playlists) await deleteDir("playlist")
    if (tokens) await deleteDir("token")
}
