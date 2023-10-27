import * as z from "zod"

const LinkedFromSchema = z.object({})

const ExternalIdsSchema = z.object({
    isrc: z.union([z.null(), z.string()]).optional(),
    ean: z.union([z.null(), z.string()]).optional(),
    upc: z.union([z.null(), z.string()]).optional(),
})

const FollowersSchema = z.object({
    href: z.union([z.null(), z.string()]).optional(),
    total: z.number(),
})

const ExternalUrlsSchema = z.object({
    spotify: z.string(),
})

const ImageSchema = z.object({
    url: z.string(),
    height: z.union([z.number(), z.null()]).optional(),
    width: z.union([z.number(), z.null()]).optional(),
})

const SpotifyTrackArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    uri: z.string(),
    followers: z.union([FollowersSchema, z.null()]).optional(),
    genres: z.union([z.array(z.string()), z.null()]).optional(),
    images: z.union([z.array(ImageSchema), z.null()]).optional(),
    popularity: z.union([z.number(), z.null()]).optional(),
})

const RestrictionsSchema = z.object({
    reason: z.string(),
})

const AlbumArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    uri: z.string(),
})

const AlbumSchema = z.object({
    artists: z.array(AlbumArtistSchema),
    available_markets: z.array(z.string()),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    name: z.string(),
    release_date: z.string(),
    release_date_precision: z.string(),
    total_tracks: z.number(),
    uri: z.string(),
    restrictions: z.union([RestrictionsSchema, z.null()]).optional(),
})

export const SpotifyTrackSchema = z.object({
    album: AlbumSchema,
    artists: z.array(SpotifyTrackArtistSchema),
    available_markets: z.array(z.string()),
    disc_number: z.number(),
    duration_ms: z.number(),
    explicit: z.boolean(),
    external_ids: ExternalIdsSchema,
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    is_local: z.boolean(),
    name: z.string(),
    popularity: z.number(),
    preview_url: z.union([z.null(), z.string()]).optional(),
    track_number: z.number(),
    uri: z.string(),
    is_playable: z.union([z.boolean(), z.null()]).optional(),
    linked_from: z.union([LinkedFromSchema, z.null()]).optional(),
    restrictions: z.union([RestrictionsSchema, z.null()]).optional(),
})

export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>
