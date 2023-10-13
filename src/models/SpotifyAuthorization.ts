import * as z from "zod"

export const ClientCredentialsSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
    expire_time: z.number(),
})

export type ClientCredentials = z.infer<typeof ClientCredentialsSchema>
export type ClientCredentialsResponse = Omit<ClientCredentials, "expire_time"> & { expire_time?: number }
