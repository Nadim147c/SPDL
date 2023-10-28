import { readFile, writeFile } from "fs/promises"

type CacheType = "image" | "playlist" | "track"

export async function saveCache(
    inputData: CacheType extends "image" ? Buffer : unknown,
    fileType: CacheType,
    identifier: string
) {
    const extention = fileType === "image" ? "jpg" : "json"

    const path = `cache/${fileType}/${identifier}.${extention}`

    const data = fileType === "image" ? (inputData as Buffer) : JSON.stringify(inputData)

    await writeFile(path, data)
}

export async function loadCache<T extends CacheType>(
    fileType: T,
    identifier: string
): Promise<(T extends "image" ? Buffer : object) | void> {
    const extention = fileType === "image" ? "jpg" : "json"

    const path = `cache/${fileType}/${identifier}.${extention}`

    try {
        if (fileType === "image") {
            const data = await readFile(path)
            return data
        } else {
            const dataStr = await readFile(path, { encoding: "utf-8" })
            return JSON.parse(dataStr)
        }
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
