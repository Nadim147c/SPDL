/* eslint-disable no-console */
import c from "chalk"
import { Tags } from "node-id3"

export default function printTags(tags: Tags) {
    console.log("\n")

    // Yes, It's readable. I can read it.
    for (const [key, value] of Object.entries(tags))
        typeof value === "string" && console.log(c.grey("[Info]"), `${key}: ${c.cyan(value)}`)

    console.log("\n")
}
