import * as z from "zod"

export const envVariables = z.object({
    CLIENT_ID: z.string().length(32),
    CLIENT_SECRET: z.string().length(32),
})

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envVariables> {}
    }
}
