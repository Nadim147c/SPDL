import { mkdirSync, existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"

type CacheType = "image" | "playlist" | "track" | "token"

export function makeDirs(path: string) {
    const directories = path.split(/(\\|\/)/g)
    directories.reduce((a, v) => {
        const path = a ? `${a}/${v}` : v
        if (!existsSync(path)) mkdirSync(path)
        return path
    })
}

export async function saveCache(
    inputData: CacheType extends "image" ? Buffer : object,
    fileType: CacheType,
    identifier: string,
) {
    const path = `cache/${fileType}/${identifier}.${fileType === "image" ? "jpg" : "json"}`

    const data = fileType === "image" ? (inputData as Buffer) : JSON.stringify(inputData)

    await writeFile(path, data)
}

export async function loadCache(
    fileType: CacheType,
    identifier: string,
): Promise<(CacheType extends "image" ? Buffer : object) | void> {
    const basePath = `cache/${fileType}/${identifier}`
    try {
        if (fileType === "image") {
            const path = basePath + ".jpg"
            const data = await readFile(path)
            return data
        } else {
            const path = basePath + ".json"
            const strData = await readFile(path, { encoding: "utf-8" })
            return JSON.parse(strData)
        }
    } catch (err) {}
}
