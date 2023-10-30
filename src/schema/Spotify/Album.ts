import z from "zod"

export const ExternalUrlsSchema = z.object({
    spotify: z.string(),
})

export const ArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    type: z.string(),
    uri: z.string(),
})

export const ItemSchema = z.object({
    artists: z.array(ArtistSchema),
    available_markets: z.array(z.string()),
    disc_number: z.number(),
    duration_ms: z.number(),
    explicit: z.boolean(),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    is_local: z.boolean(),
    name: z.string(),
    preview_url: z.null(),
    track_number: z.number(),
    type: z.string(),
    uri: z.string(),
})

export const TracksSchema = z.object({
    href: z.string(),
    items: z.array(ItemSchema),
    limit: z.number(),
    next: z.null(),
    offset: z.number(),
    previous: z.null(),
    total: z.number(),
})

export const ImageSchema = z.object({
    height: z.number(),
    url: z.string(),
    width: z.number(),
})

export const ExternalIdsSchema = z.object({
    upc: z.union([z.string(), z.null()]).optional(),
})

export const CopyrightSchema = z.object({
    text: z.string(),
    type: z.string(),
})

export const SpotifyAlbumSchema = z.object({
    album_type: z.string(),
    artists: z.array(ArtistSchema),
    available_markets: z.array(z.string()),
    copyrights: z.array(CopyrightSchema),
    external_ids: ExternalIdsSchema,
    external_urls: ExternalUrlsSchema,
    genres: z.array(z.any()),
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    label: z.string(),
    name: z.string(),
    popularity: z.number(),
    release_date: z.string(),
    release_date_precision: z.string(),
    total_tracks: z.number(),
    tracks: TracksSchema,
    type: z.string(),
    uri: z.string(),
})

export type SpotifyAlbum = z.infer<typeof SpotifyAlbumSchema>
