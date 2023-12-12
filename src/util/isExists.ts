import { stat } from "fs/promises"

export const isExists = async (path: string) => {
    try {
        await stat(path)

        return true
    } catch (error) {
        /* empty */
    }

    return false
}
