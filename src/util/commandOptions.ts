import { Option } from "@commander-js/extra-typings"
import { customParseFloat, customParseInt, pathParser } from "./customParser.js"

export const verbosityOption = new Option(
    "-V, --verbose",
    "Verbosity of loging when running command"
).default(false)

export const lrcOption = new Option(
    "--lrc",
    "Generate .lrc file for track if lyrics exists"
).default(false)

const cmdRunDir = process.cwd()
export const outputLocationOption = new Option(
    "-o, --output <Path>",
    "Directory to download the tracks/playlists"
)
    .argParser(pathParser)
    .default(cmdRunDir, "Current Directory")

export const searchLimitOption = new Option(
    "-l, --search-limit <Amount>",
    "Number of search to make before downloading a track. More than 3 isn't recommanded."
)
    .argParser(customParseInt)
    .default(1, "first track")

export const sleepTimeOption = new Option(
    "-s, --sleep-time <Seconds>",
    "Amount of seconds to wait in between each track to avoid getting limited. Changing it isn't recommanded."
)
    .argParser(customParseFloat)
    .default(30)

// Clear Cache Options
export const allOption = new Option("--all", "Remove all caches.").default(false)
export const tracksOption = new Option("--tracks", "Remove track caches.").default(false)
export const imagesOption = new Option("--images", "Remove image caches.").default(false)
export const albumsOption = new Option("--albums", "Remove album caches.").default(false)
export const playlistsOption = new Option("--playlists", "Remove playlist caches.").default(false)
export const tokensOption = new Option("--tokens", "Remove token caches.").default(false)
