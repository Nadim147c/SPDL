import { mkdir, stat } from "fs/promises"
import { z } from "zod"

export async function makeDirs(path: string) {
    const directories = path.split(/(\\|\/)/g)

    if (directories.at(-1)?.match(/.*\..+/)) directories.pop()

    let currentPath = ""

    for await (const directory of directories) {
        currentPath = currentPath ? `${currentPath}/${directory}` : directory
        if (!currentPath) continue
        try {
            await stat(currentPath)
        } catch (error) {
            const validateError = z.object({ code: z.enum(["ENOENT"]) })
            if (validateError.safeParse(error).success) {
                // eslint-disable-next-line no-console
                await mkdir(currentPath).catch(console.error)
            }
        }
    }
}
