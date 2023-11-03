import { homedir } from "os"
import { join } from "path"
import { makeDirs } from "./makeDirs.js"

export async function getCachePath(path = "", makeDir = true) {
    const homeDir = homedir()
    const cachePath = join(homeDir, `.cache/spdl/${path}`)
    if (!makeDir) return cachePath
    await makeDirs(cachePath)
    return cachePath
}

export async function getConfigPath(path = "", makeDir = true) {
    const homeDir = homedir()
    const configPath = join(homeDir, `.config/spdl/${path}`)
    if (!makeDir) return configPath
    await makeDirs(configPath)
    return configPath
}
