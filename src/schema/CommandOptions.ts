import { z } from "zod"

export default z.object({
    verbose: z.boolean(),
    output: z.string(),
    searchLimit: z.number(),
})
