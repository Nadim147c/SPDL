import { exec } from "child_process"
import { writeFile } from "fs/promises"
import inquirer from "inquirer"
import z from "zod"
import { getLogger } from "../util/Util.js"
import { promisify } from "util"

const promiseExec = promisify(exec)

const optionSchema = z.object({
    verbose: z.boolean(),
})

export default async function setupAction(commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("SPDL", options.verbose)

    const spotifyApiDashboard = "https://developer.spotify.com/dashboard/create"

    print(`Create a spotify app from: ${spotifyApiDashboard}`)

    const questions = [
        {
            type: "input",
            name: "clientId",
            message: "Enter your client ID:",
        },
        {
            type: "password",
            name: "clientSecret",
            message: "Enter your client secret:",
            mask: "*",
        },
    ]

    const answers = await inquirer.prompt(questions)
    const data = `${answers.clientId}:${answers.clientSecret}`

    await writeFile(".tokens", data, { encoding: "utf8" })
    print("Client tokens have been set")

    const ytdlpVersion = (await promiseExec("yt-dlp --version")).toString().trim()
    const ffmpegVersionStr = (await promiseExec("ffmpeg -version")).toString()
    const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

    if (ytdlpVersion && ffmpegVersion) {
        print("yt-dlp and ffmpeg are already installed")
        return
    } else {
        print("Your system doesn't have all prequired tools.")
        print("Visit: https://github.com/Nadim147c/SPDL#requirements to install these tools.")
        return
    }
}
