#!/usr/bin/env node

import { envVariablesSchema } from "./schema/ProcessEnv"
import { buildCommand, makeDirs } from "./util/Util"
import { Command, Option } from "commander"

makeDirs("cache/playlist")
makeDirs("cache/track")
makeDirs("cache/token")
makeDirs("cache/image")
makeDirs("cache/lyrics")
makeDirs("downloads")

const program = new Command()

program.version("1.0.0")
program.description("A simple Commander example")
program.name("spdl")

const logLevelOption = [
    "-l, --log-level <VALUE>",
    "Verbose log everything",
    /^(verbose|normal|silent)$/i,
    "normal",
] as const

program
    .command("tokens")
    .description("Set spotify api client id and secret")
    .argument("<CLIENT_ID>", "Spotify api client id")
    .argument("<CLIENT_SECRET>", "Spotify api client secret")
    .option(...logLevelOption)
    .action((CLIENT_ID, CLIENT_SECRET, options) => {})

program.parse(process.argv)
