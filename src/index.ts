import dotenv from "dotenv"
import { envVariables } from "./schema/ProcessEnv"
import { makeDirs } from "./util/Util"

dotenv.config()

envVariables.parse(process.env)

makeDirs("cache/playlist")
makeDirs("cache/track")
makeDirs("cache/token")
makeDirs("cache/image")
makeDirs("cache/lyrics")
makeDirs("downloads")
