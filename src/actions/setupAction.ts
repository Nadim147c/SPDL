import { exec } from "child_process"
import { writeFile } from "fs/promises"
import inquirer from "inquirer"
import { promisify } from "util"
import type { SetupAction } from "../index.js"
import { getConfigPath } from "../util/homePaths.js"
import { getLogger } from "../util/logger.js"

const promiseExec = promisify(exec)

export const setupAction: SetupAction = async (options) => {
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

    const tokensPath = await getConfigPath(".tokens")

    await writeFile(tokensPath, data, { encoding: "utf8" })

    print("Client tokens have been set")

    const ytdlpVersion = (await promiseExec("yt-dlp --version")).stdout.toString().trim()
    const ffmpegVersionStr = (await promiseExec("ffmpeg -version")).stdout.toString()
    const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

    if (ytdlpVersion && ffmpegVersion) {
        return print("yt-dlp and ffmpeg are already installed")
    } else {
        print("Your system doesn't have all prequired tools.")
        print("Visit: https://github.com/Nadim147c/SPDL#requirements to install these tools.")

        return
    }
}
