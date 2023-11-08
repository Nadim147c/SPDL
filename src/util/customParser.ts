import { InvalidArgumentError } from "@commander-js/extra-typings"
import path from "path"
import process from "process"

export function customParseInt(value: string) {
    const parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) throw new InvalidArgumentError("Argument must a integer")

    return parsedValue
}

export function customParseFloat(value: string) {
    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue)) throw new InvalidArgumentError("Argument must a number")

    return parsedValue
}

export function pathParser(inputPath: string) {
    const cmdRunDir = process.cwd()

    return path.isAbsolute(inputPath) ? inputPath : path.join(cmdRunDir, inputPath)
}
