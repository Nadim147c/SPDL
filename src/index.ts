#!/usr/bin/env node

/* eslint-disable no-console */

import { Command } from "@commander-js/extra-typings"
import c from "chalk"
import { execSync } from "child_process"
import { readFile } from "fs/promises"
import process from "node:process"
import { albumAction } from "./actions/albumAction.js"
import { playlistAction } from "./actions/playlistAction.js"
import { setupAction } from "./actions/setupAction.js"
import { trackAction } from "./actions/trackAction.js"
import { projectPath } from "./dirname.cjs"
import {
    albumsOption,
    allOption,
    imagesOption,
    lrcOption,
    outputLocationOption,
    playlistsOption,
    searchLimitOption,
    sleepTimeOption,
    tokensOption,
    tracksOption,
    verbosityOption,
} from "./util/commandOptions.js"
import { clearCacheAction } from "./actions/clearCache.js"
import { getLogger } from "./util/logger.js"

process.chdir(projectPath)

const program = new Command()

try {
    const packageJsonStr = await readFile("package.json", "utf8")
    const packageJson = JSON.parse(packageJsonStr)

    program.name("spdl")
    program.version(packageJson.version, "-v, version", "Get current version")
    program.description(packageJson.description)

    program.action(() => {
        const ytdlpVersion = execSync("yt-dlp --version").toString().trim()
        const ffmpegVersionStr = execSync("ffmpeg -version").toString()
        const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

        console.log(`SPDL: ${c.green(packageJson.version)}`)
        console.log(`YT-DLP: ${c.green(ytdlpVersion)}`)
        console.log(`FFMPEG: ${c.green(ffmpegVersion)}`)
        console.log("\n", packageJson.description)
        console.log("\nRun `spdl --help` to get the help menu.")
    })
} catch (error) {
    console.log("Failed to get package.json data")
    console.error(error)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionType<T extends (...args: any[]) => any> = Parameters<T>[0]

const setupCommand = program
    .command("setup")
    .description("Setup client tokens and required dependency.")
    .addOption(verbosityOption)

export type SetupAction = ActionType<typeof setupCommand.action>
setupCommand.action(setupAction)

const clearCacheCommand = program
    .command("clear-cache")
    .description("Clear cached images, tracks, albums, playlists and tokens.")
    .addOption(verbosityOption)
    .addOption(allOption)
    .addOption(imagesOption)
    .addOption(tracksOption)
    .addOption(albumsOption)
    .addOption(playlistsOption)
    .addOption(tokensOption)

export type ClearCacheAction = ActionType<typeof clearCacheCommand.action>
clearCacheCommand.action((options) => {
    const { all, images, tracks, albums, playlists, verbose } = options
    const print = getLogger("SPDl", verbose)

    if (!images && !tracks && !albums && !playlists && !all) {
        print("Please provide a option")
        const helpInfo = clearCacheCommand.helpInformation({ error: true })
        print(helpInfo)
    } else {
        clearCacheAction(options, clearCacheCommand)
    }
})

const trackCommand = program
    .command("track")
    .description("Download a track from spotify track link.")
    .argument("url", "Url of a spotify track")
    .addOption(verbosityOption)
    .addOption(lrcOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)

export type TrackAction = ActionType<typeof trackCommand.action>
trackCommand.action(trackAction)

const playlistCommand = program
    .command("playlist")
    .description("Download a playlist from spotify playlist link")
    .argument("url", "Url of a public spotify playlist")
    .addOption(verbosityOption)
    .addOption(lrcOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)
    .addOption(sleepTimeOption)

export type PlaylistAction = ActionType<typeof playlistCommand.action>
playlistCommand.action(playlistAction)

const albumCommand = program
    .command("album")
    .description("Download a album from spotify album link")
    .argument("url", "Url of spotify album")
    .addOption(verbosityOption)
    .addOption(lrcOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)
    .addOption(sleepTimeOption)

export type AlbumAction = ActionType<typeof albumCommand.action>
albumCommand.action(albumAction)

program.parse(process.argv)
