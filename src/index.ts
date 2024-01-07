#!/usr/bin/env node

/* eslint-disable no-console */

import { Argument, Command } from "@commander-js/extra-typings"
import c from "chalk"
import { readFile } from "fs/promises"
import process from "node:process"
import { clearCacheAction } from "./actions/clearCache.js"
import { defaultAction } from "./actions/default.js"
import { setupAction } from "./actions/setupAction.js"
import { projectPath } from "./dirname.cjs"
import {
    albumsOption,
    allOption,
    imagesOption,
    playlistsOption,
    tokensOption,
    tracksOption,
} from "./options/clearCache.js"
import {
    lrcOption,
    outputLocationOption,
    searchLimitOption,
    sleepTimeOption,
    verbosityOption,
} from "./options/default.js"

process.chdir(projectPath)

const program = new Command()

try {
    const packageJsonStr = await readFile("package.json", "utf8")
    const packageJson = JSON.parse(packageJsonStr)

    program.name("spdl")
    program.version(packageJson.version, "-v, version", "Get current version")
    program.description(packageJson.description)
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
    const { all, images, tracks, albums, playlists } = options

    if (!images && !tracks && !albums && !playlists && !all) {
        console.log("[SPDL]", c.red("Please provide a option"))
        const helpInfo = clearCacheCommand.helpInformation({ error: true })
        console.log("[SPDL]", helpInfo)
    } else {
        clearCacheAction(options, clearCacheCommand)
    }
})

const urlArgument = new Argument("[url]", "URL of the track, playlist or album.")

const defaultCommand = program
    .addArgument(urlArgument)
    .addOption(verbosityOption)
    .addOption(lrcOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)
    .addOption(sleepTimeOption)

export type DefaultAction = ActionType<typeof defaultCommand.action>
defaultCommand.action(defaultAction)

program.parse(process.argv)
