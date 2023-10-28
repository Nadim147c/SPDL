import { mkdir, stat } from "fs/promises"

export async function makeDirs(path: string) {
    const directories = path.split(/(\\|\/)/g)
    let currentPath = ""

    for await (const directory of directories) {
        currentPath = currentPath ? `${currentPath}/${directory}` : directory
        try {
            await stat(currentPath)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error?.code === "ENOENT") await mkdir(currentPath)
        }
    }
}
