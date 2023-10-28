import z from "zod"
import { CandidateSchema } from "./Candidate.js"

export const HashSearchResultSchema = z.object({
    status: z.number(),
    info: z.string(),
    errcode: z.number(),
    errmsg: z.string(),
    keyword: z.string(),
    proposal: z.string(),
    has_complete_right: z.number(),
    companys: z.string(),
    ugc: z.number(),
    ugccount: z.number(),
    expire: z.number(),
    candidates: z.union([z.array(CandidateSchema), z.null()]).optional(),
    ugccandidates: z.array(z.any()),
    artists: z.array(z.any()),
    ai_candidates: z.array(z.any()),
})

export type HashSearchResult = z.infer<typeof HashSearchResultSchema>
