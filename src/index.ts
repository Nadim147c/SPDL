#!/usr/bin/env node

/* eslint-disable no-console */

import { InvalidArgumentError as CmdError, Command, Option } from "@commander-js/extra-typings"
import c from "chalk"
import { execSync } from "child_process"
import { readFile } from "fs/promises"
import process from "node:process"
import * as path from "path"
import albumAction from "./actions/albumAction.js"
import playlistAction from "./actions/playlistAction.js"
import setupAction from "./actions/setupAction.js"
import trackAction from "./actions/trackAction.js"
import { projectPath } from "./dirname.cjs"

const cmdRunDir = process.cwd()

process.chdir(projectPath)

const program = new Command()

try {
    const packageJsonStr = await readFile("package.json", { encoding: "utf8" })
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

const verbosityOption = new Option(
    "-V, --verbose",
    "Verbosity of loging when running command"
).default(false)

const pathParser = (inputPath: string) =>
    path.isAbsolute(inputPath) ? inputPath : path.join(cmdRunDir, inputPath)

const outputLocationOption = new Option(
    "-o, --output <Path>",
    "Directory to download the tracks/playlists"
)
    .argParser(pathParser)
    .default(cmdRunDir, "Current Directory")

function customParseInt(value: string) {
    const parsedValue = parseInt(value, 10)

    if (isNaN(parsedValue)) throw new CmdError("Argument must a integer")

    return parsedValue
}

const searchLimitOption = new Option(
    "-l, --search-limit <Amount>",
    "Number of search to make before downloading a track. More than 3 isn't recommanded."
)
    .argParser(customParseInt)
    .default(1, "first track")

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
    .addOption(searchLimitOption)
    .action(trackAction)

function customParseFloat(value: string) {
    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue)) throw new CmdError("Argument must a number")

    return parsedValue
}

const sleepTimeOption = new Option(
    "-s, --sleep-time <Seconds>",
    "Amount of seconds to wait in between each track to avoid getting limited. Changing it isn't recommanded."
)
    .argParser(customParseFloat)
    .default(30)

program
    .command("playlist")
    .description("Download a playlist from spotify playlist link")
    .argument("url", "Url of a public spotify playlist")
    .addOption(verbosityOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)
    .addOption(sleepTimeOption)
    .action(playlistAction)

program
    .command("album")
    .description("Download a album from spotify album link")
    .argument("url", "Url of spotify album")
    .addOption(verbosityOption)
    .addOption(outputLocationOption)
    .addOption(searchLimitOption)
    .addOption(sleepTimeOption)
    .action(albumAction)

program.parse(process.argv)
