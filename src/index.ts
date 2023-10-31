#!/usr/bin/env node

import { Command, Option } from "commander"
import { readFile } from "fs/promises"
import process from "node:process"
import playlistAction from "./actions/playlistAction.js"
import setupAction from "./actions/setupAction.js"
import trackAction from "./actions/trackAction.js"
import { projectPath } from "./dirname.cjs"
import { makeDirs } from "./util/makeDirs.js"
import albumAction from "./actions/albumAction.js"

const cmdRunDir = process.cwd()

process.chdir(projectPath)

await makeDirs("cache/playlist")
await makeDirs("cache/album")
await makeDirs("cache/track")
await makeDirs("cache/image")
await makeDirs("cache/lyrics")

const program = new Command()

try {
    const packageJsonStr = await readFile("package.json", { encoding: "utf8" })
    const packageJson = JSON.parse(packageJsonStr)
    program.name(packageJson.name)
    program.version(packageJson.version, "-v, version", "Get current version")
    program.description(packageJson.description)
} catch (error) {
    console.log("Failed to get package.json data")
    console.error(error)
}

const verbosityOption = new Option(
    "-V, --verbose",
    "Verbosity of loging when running command"
).default(false)

const outputLocationOption = new Option(
    "-o, --output <Path>",
    "Directory to download the tracks/playlists"
).default(cmdRunDir, "Current Directory")

program
    .command("setup")
    .description("Setup client tokens and required dependency.")
    .addOption(verbosityOption)
    .action(setupAction)

program
    .command("track")
    .description("Download a track from spotify track link.")
    .argument("url", "Url of a spotify track")
    .addOption(verbosityOption)
    .addOption(outputLocationOption)
    .action(trackAction)

const sleepTimeOption = new Option(
    "-s, --sleep-time [Seconds]",
    "Amount of seconds to wait in between each track to avoid getting limited"
)
    .argParser(parseFloat)
    .default(30)

program
    .command("playlist")
    .description("Download a playlist from spotify playlist link")
    .argument("url", "Url of a public spotify playlist")
    .addOption(verbosityOption)
    .addOption(outputLocationOption)
    .addOption(sleepTimeOption)
    .action(playlistAction)

program
    .command("album")
    .description("Download a album from spotify album link")
    .argument("url", "Url of a public spotify playlist")
    .addOption(verbosityOption)
    .addOption(outputLocationOption)
    .addOption(sleepTimeOption)
    .action(albumAction)

program.parse(process.argv)
