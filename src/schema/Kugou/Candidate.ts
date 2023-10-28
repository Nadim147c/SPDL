import z from "zod"

const ParinfoExtSchema = z.object({
    entry: z.string(),
})

export const CandidateSchema = z.object({
    id: z.string(),
    product_from: z.string(),
    accesskey: z.string(),
    can_score: z.boolean(),
    singer: z.string(),
    song: z.string(),
    duration: z.number(),
    uid: z.string(),
    nickname: z.string(),
    origiuid: z.string(),
    transuid: z.string(),
    sounduid: z.string(),
    originame: z.string(),
    transname: z.string(),
    soundname: z.string(),
    parinfo: z.array(z.array(z.union([z.number(), z.string()]))),
    parinfoExt: z.array(ParinfoExtSchema),
    language: z.string(),
    krctype: z.number(),
    hitlayer: z.number(),
    hitcasemask: z.number(),
    adjust: z.number(),
    score: z.number(),
    contenttype: z.number(),
    content_format: z.number(),
})
export type Candidate = z.infer<typeof CandidateSchema>
