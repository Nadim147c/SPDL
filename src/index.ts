import dotenv from "dotenv"
import Spotify from "./structure/Spotify"
import { envVariables } from "./models/ProcessEnv"
import { makeDirs } from "./util/Util"

dotenv.config()

envVariables.parse(process.env)

makeDirs("cache/playlist")
makeDirs("cache/track")
makeDirs("cache/token")
makeDirs("cache/image")

const spotify = new Spotify()
