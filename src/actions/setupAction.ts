/* eslint-disable no-console */
import { exec } from "child_process"
import { writeFile } from "fs/promises"
import inquirer from "inquirer"
import { promisify } from "util"
import type { SetupAction } from "../index.js"
import { getConfigPath } from "../util/homePaths.js"

const promiseExec = promisify(exec)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setupAction: SetupAction = async (_) => {
    const spotifyApiDashboard = "https://developer.spotify.com/dashboard/create"

    console.log("[SPDL]", `Create a spotify app from: ${spotifyApiDashboard}`)

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

    console.log("[SPDL]", "Client tokens have been set")

    const ytdlpVersion = (await promiseExec("yt-dlp --version")).stdout.toString().trim()
    const ffmpegVersionStr = (await promiseExec("ffmpeg -version")).stdout.toString() ?? ""
    const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)?.[0]?.trim()

    if (ytdlpVersion && ffmpegVersion) {
        return console.log("[SPDL]", "yt-dlp and ffmpeg are already installed")
    } else {
        console.log("[SPDL]", "Your system doesn't have all prequired tools.")
        console.log(
            "[SPDL]",
            "Visit: https://github.com/Nadim147c/SPDL#requirements to install these tools."
        )
    }
}
