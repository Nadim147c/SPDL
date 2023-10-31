import z from "zod"

const ExternalUrlsSchema = z.object({
    spotify: z.union([z.string(), z.null()]).optional(),
})

const ArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    type: z.string(),
    uri: z.string(),
})

export const SpotifyAlbumTrackSchema = z.object({
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

export type SpotifyAlbumTrack = z.infer<typeof SpotifyAlbumTrackSchema>

const TracksSchema = z.object({
    href: z.string(),
    items: z.array(SpotifyAlbumTrackSchema),
    limit: z.number(),
    next: z.null(),
    offset: z.number(),
    previous: z.null(),
    total: z.number(),
})

const ImageSchema = z.object({
    url: z.string(),
    height: z.union([z.number(), z.null()]).optional(),
    width: z.union([z.number(), z.null()]).optional(),
})

const ExternalIdsSchema = z.object({
    upc: z.union([z.string(), z.null()]).optional(),
})

const CopyrightSchema = z.object({
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
    genres: z.array(z.unknown()),
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema).optional(),
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
