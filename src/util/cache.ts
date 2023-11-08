import { readFile, writeFile } from "fs/promises"
import { getCachePath } from "./homePaths.js"

type CacheType = "playlist" | "track" | "album"

export async function saveCache(inputData: unknown, fileType: CacheType, identifier: string) {
    const path = await getCachePath(`${fileType}/${identifier}.json`)
    const data = JSON.stringify(inputData)
    try {
        await writeFile(path, data)
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
    }
}

export async function loadCache(fileType: CacheType, identifier: string) {
    const path = await getCachePath(`${fileType}/${identifier}.json`)
    const dataStr = await readFile(path, { encoding: "utf-8" }).catch()

    if (dataStr) return JSON.parse(dataStr)
}
