import z from "zod"

const MapSchema = z.object({
    attr0: z.number(),
})

const TransParamSchema = z.object({
    pay_block_tpl: z.number(),
    classmap: MapSchema,
    cid: z.number(),
    cpy_attr0: z.number(),
    qualitymap: MapSchema,
    language: z.union([z.null(), z.string()]).optional(),
    musicpack_advance: z.number(),
    display: z.number(),
    display_rate: z.number(),
})

const InfoSchema = z.object({
    hash: z.string(),
    sqfilesize: z.number(),
    sourceid: z.number(),
    pay_type_sq: z.number(),
    bitrate: z.number(),
    ownercount: z.number(),
    pkg_price_sq: z.number(),
    songname: z.string(),
    album_name: z.string(),
    songname_original: z.string(),
    Accompany: z.number(),
    sqhash: z.string(),
    fail_process: z.number(),
    pay_type: z.number(),
    rp_type: z.string(),
    album_id: z.string(),
    othername_original: z.string(),
    mvhash: z.string(),
    extname: z.string(),
    group: z.array(z.any()),
    price_320: z.number(),
    "320hash": z.string(),
    topic: z.string(),
    othername: z.string(),
    isnew: z.number(),
    fold_type: z.number(),
    old_cpy: z.number(),
    srctype: z.number(),
    singername: z.string(),
    album_audio_id: z.number(),
    duration: z.number(),
    "320filesize": z.number(),
    pkg_price_320: z.number(),
    audio_id: z.number(),
    feetype: z.number(),
    price: z.number(),
    filename: z.string(),
    source: z.string(),
    price_sq: z.number(),
    fail_process_320: z.number(),
    trans_param: TransParamSchema,
    pkg_price: z.number(),
    pay_type_320: z.number(),
    topic_url: z.string(),
    m4afilesize: z.number(),
    rp_publish: z.number(),
    privilege: z.number(),
    filesize: z.number(),
    isoriginal: z.number(),
    "320privilege": z.number(),
    sqprivilege: z.number(),
    fail_process_sq: z.number(),
})

const DataSchema = z.object({
    timestamp: z.number(),
    tab: z.string(),
    forcecorrection: z.number(),
    correctiontype: z.number(),
    total: z.number(),
    istag: z.number(),
    allowerr: z.number(),
    info: z.union([z.array(InfoSchema), z.null()]).optional(),
    aggregation: z.array(z.any()),
    correctiontip: z.string(),
    istagresult: z.number(),
})

export const SongSearchResultSchema = z.object({
    status: z.number(),
    errcode: z.number(),
    data: DataSchema,
    error: z.string(),
})

export type SongSearchResult = z.infer<typeof SongSearchResultSchema>
