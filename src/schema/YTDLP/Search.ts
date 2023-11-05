import z from "zod"

export const youtubeMusicSongSchema = z.object({
    title: z.string(),
    duration: z.number(),
    webpage_url: z.string().url(),
})

export const youtubeMusicSearchSchema = z.array(youtubeMusicSongSchema).nonempty()

export type YouTubeMusicSearch = z.infer<typeof youtubeMusicSongSchema>[]
export type YouTubeMusicSearchNonEmptey = z.infer<typeof youtubeMusicSearchSchema>
