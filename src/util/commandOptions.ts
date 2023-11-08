import { Option } from "@commander-js/extra-typings"
import { customParseFloat, customParseInt, pathParser } from "./customParser.js"

export const verbosityOption = new Option(
    "-V, --verbose",
    "Verbosity of loging when running command"
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
