import z from "zod"

const entrySchema = z.object({
    title: z.string(),
    duration: z.number(),
    original_url: z.string().url(),
})

export const youtubeMusicSearchSchema = z.object({
    entries: z.array(entrySchema).nonempty(),
})

export type YouTubeMusicSearch = z.infer<typeof youtubeMusicSearchSchema>
