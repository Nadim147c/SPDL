import { writeFile } from "fs/promises"
import inquirer from "inquirer"
import z from "zod"
import { getLogger } from "../util/Util.js"
import { exec } from "child_process"
import { platform } from "os"

const optionSchema = z.object({
    verbose: z.boolean(),
})

export default async function setupAction(commandOptions: unknown) {
    const options = optionSchema.parse(commandOptions)
    const print = getLogger("CLI", options.verbose)

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

    const ytdlpVersion = await exec("yt-dlp --version").toString().trim()
    const ffmpegVersionStr = await exec("ffmpeg -version").toString()
    const ffmpegVersion = ffmpegVersionStr.match(/\d+\.\d+/)

    const platformName = platform()

    if (platformName === "win32") {
        const winget = await exec("winget -v")
        const agreement = "--accept-package-agreements"
        console.log("Run these following command to finish setup")
        console.log(`winget install yt-dlp.yt-dlp ${agreement}`)
        console.log(`winget install Gyan.FFmpeg ${agreement}`)
    } else {
        console.log("Install these packages from your preperd package manager")
        console.log("yt-dlp: https://github.com/yt-dlp/yt-dlp")
        console.log("ffmpeg: https://github.com/FFmpeg/FFmpeg")
    }
}
