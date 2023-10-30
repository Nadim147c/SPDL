import { readFile, writeFile } from "fs/promises"

type CacheType = "playlist" | "track" | "album"

export async function saveCache(inputData: unknown, fileType: CacheType, identifier: string) {
    const path = `cache/${fileType}/${identifier}.json`
    const data = JSON.stringify(inputData)
    await writeFile(path, data)
}

export async function loadCache(fileType: CacheType, identifier: string) {
    const path = `cache/${fileType}/${identifier}.json`

    try {
        const dataStr = await readFile(path, { encoding: "utf-8" })
        return JSON.parse(dataStr)
    } catch (err) {
        return
    }
}

export type LoggerType = ReturnType<typeof getLogger>

export function getLogger(prefix: string, verbose: boolean) {
    return function (message: unknown, lowPriority = false) {
        if (lowPriority && !verbose) return
        console.log(`[${prefix}]`, message)
    }
}
