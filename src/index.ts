#!/usr/bin/env node

import { Command } from "commander"
import { mkdir, readFile, stat } from "fs/promises"
import process from "node:process"
import playlistAction from "./actions/playlistAction.js"
import setupAction from "./actions/setupAction.js"
import trackAction from "./actions/trackAction.js"
import { projectPath } from "./dirname.cjs"

process.chdir(projectPath)

async function makeDirs(path: string) {
    const directories = path.split(/(\\|\/)/g)
    let currentPath = ""

    for await (const directory of directories) {
        currentPath = currentPath ? `${currentPath}/${directory}` : directory
        try {
            const stats = await stat(currentPath)
        } catch (error: any) {
            if (error.code === "ENOENT") await mkdir(currentPath)
        }
    }
}

await makeDirs(`cache/playlist`)
await makeDirs(`cache/track`)
await makeDirs(`cache/image`)
await makeDirs(`cache/lyrics`)

const program = new Command()

try {
    const packageJsonStr = await readFile(`package.json`, { encoding: "utf8" })
    const packageJson = JSON.parse(packageJsonStr)
    program.name(packageJson.name)
    program.version(packageJson.version, "-v, version", "Get current version")
    program.description(packageJson.description)
} catch (error) {
    console.log("Failed to get package.json data")
    console.error(error)
}

const verbosityOption = [
    "-V, --verbose",
    "Verbosity of loging when running command",
    false,
] as const

program
    .command("setup")
    .description("Setup client tokens and required dependency.")
    .option(...verbosityOption)
    .action(setupAction)

program
    .command("track")
    .description("Download a track from spotify track link.")
    .argument("url", "Url of a spotify track")
    .option(...verbosityOption)
    .action(trackAction)

program
    .command("playlist")
    .description("Download a playlist from spotify playlist link")
    .argument("url", "Url of a public spotify playlist")
    .option(...verbosityOption)
    .option(
        "-s, --sleep-time [Seconds]",
        "Amount of seconds to wait in between each track to avoid getting limited",
        parseFloat,
        30
    )
    .action(playlistAction)

program.parse(process.argv)
