import { existsSync, mkdirSync } from "fs"
import { readFile, writeFile } from "fs/promises"

type CacheType = "image" | "playlist" | "track" | "token" | "lyrics"

export async function saveCache(
    inputData: CacheType extends "image" ? Buffer : unknown,
    fileType: CacheType,
    identifier: string
) {
    let extention
    switch (fileType) {
        case "image":
            extention = "jpg"
            break
        case "lyrics":
            extention = "txt"
            break
        default:
            extention = "json"
            break
    }
    const path = `cache/${fileType}/${identifier}.${extention}`

    const data = fileType === "image" ? (inputData as Buffer) : JSON.stringify(inputData)

    await writeFile(path, data)
}

export async function loadCache<T extends CacheType>(
    fileType: T,
    identifier: string
): Promise<(T extends "lyrics" ? string : T extends "image" ? Buffer : object) | void> {
    let extention
    switch (fileType) {
        case "image":
            extention = "jpg"
            break
        case "lyrics":
            extention = "txt"
            break
        default:
            extention = "json"
            break
    }
    const path = `cache/${fileType}/${identifier}.${extention}`

    try {
        if (fileType === "image") {
            const data = await readFile(path)
            return
        } else {
            const dataStr = await readFile(path, { encoding: "utf-8" })
            return fileType === "lyrics" ? dataStr : JSON.parse(dataStr)
        }
    } catch (err) {}
}

export type LoggerType = ReturnType<typeof getLogger>

export function getLogger(prefix: string, verbose: boolean) {
    return function (message: unknown, lowPriority = false) {
        if (lowPriority && !verbose) return
        console.log(`[${prefix}]`, message)
    }
}
