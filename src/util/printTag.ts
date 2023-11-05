import c from "chalk"
import { Tags } from "node-id3"

export default function printTags(tags: Tags) {
    console.log("\n")
    for (const [key, value] of Object.entries(tags)) {
        if (typeof value === "string") console.log(c.grey("[Info]"), `${key}: ${c.cyan(value)}`)
    }
    console.log("\n")
}
