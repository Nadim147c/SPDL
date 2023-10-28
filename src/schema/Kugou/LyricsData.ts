import z from "zod"

export const LyricsDataSchema = z.object({
    status: z.number(),
    info: z.string(),
    error_code: z.number(),
    fmt: z.string(),
    contenttype: z.number(),
    _source: z.string(),
    charset: z.string(),
    content: z.string(),
    id: z.string(),
})

export type LyricsData = z.infer<typeof LyricsDataSchema>
