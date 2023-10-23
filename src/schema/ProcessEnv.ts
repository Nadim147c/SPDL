import * as z from "zod"

export const envVariablesSchema = z.object({
    CLIENT_ID: z.string().length(32),
    CLIENT_SECRET: z.string().length(32),
})

export type envVariables = z.infer<typeof envVariablesSchema>
