import * as z from "zod"

const LinkedFromSchema = z.object({})

const ExternalUrlsSchema = z.object({
    spotify: z.string(),
})

const FollowersSchema = z.object({
    href: z.union([z.null(), z.string()]).optional(),
    total: z.number(),
})

const OwnerSchema = z.object({
    external_urls: ExternalUrlsSchema,
    followers: z.union([FollowersSchema, z.null()]).optional(),
    href: z.string(),
    id: z.string(),
    uri: z.string(),
    display_name: z.union([z.null(), z.string()]).optional(),
})

const AlbumArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    uri: z.string(),
})

const ImageSchema = z.object({
    height: z.union([z.number(), z.null()]).optional(),
    url: z.string(),
    width: z.union([z.number(), z.null()]).optional(),
})

const TrackExternalIdsSchema = z.object({
    isrc: z.union([z.string(), z.null()]).optional(),
    ean: z.union([z.string(), z.null()]).optional(),
    upc: z.union([z.string(), z.null()]).optional(),
})

const TrackArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    followers: z.union([FollowersSchema, z.null()]).optional(),
    genres: z.union([z.array(z.string()), z.null()]).optional(),
    href: z.string(),
    id: z.string(),
    images: z.union([z.array(ImageSchema), z.null()]).optional(),
    name: z.string(),
    popularity: z.union([z.number(), z.null()]).optional(),
    uri: z.string(),
})

const RestrictionsSchema = z.object({
    reason: z.string(),
})

const TrackAlbumSchema = z.object({
    total_tracks: z.number(),
    available_markets: z.array(z.string()),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    name: z.string(),
    release_date: z.string(),
    release_date_precision: z.string(),
    restrictions: z.union([RestrictionsSchema, z.null()]).optional(),
    uri: z.string(),
    artists: z.array(AlbumArtistSchema),
})

export const SpotifyPlaylistTrackSchema = z.object({
    album: TrackAlbumSchema,
    artists: z.array(TrackArtistSchema),
    available_markets: z.array(z.string()),
    disc_number: z.number(),
    duration_ms: z.number(),
    explicit: z.boolean(),
    external_ids: TrackExternalIdsSchema,
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    is_playable: z.union([z.boolean(), z.null()]).optional(),
    linked_from: z.union([LinkedFromSchema, z.null()]).optional(),
    restrictions: z.union([RestrictionsSchema, z.null()]).optional(),
    name: z.string(),
    popularity: z.number(),
    preview_url: z.union([z.string(), z.null()]).optional(),
    track_number: z.number(),
    uri: z.string(),
    is_local: z.boolean(),
})

export type SpotifyPlaylistTrack = z.infer<typeof SpotifyPlaylistTrackSchema>

const ItemSchema = z.object({
    added_at: z.string(),
    added_by: OwnerSchema,
    is_local: z.boolean(),
    track: SpotifyPlaylistTrackSchema,
})

const TracksSchema = z.object({
    href: z.string(),
    limit: z.number(),
    next: z.union([z.null(), z.string()]).optional(),
    offset: z.number(),
    previous: z.union([z.null(), z.string()]).optional(),
    total: z.number(),
    items: z.union([z.array(ItemSchema), z.null()]).optional(),
})

const SpotifyPlaylistExternalIdsSchema = z.object({
    isrc: z.string(),
})

const SpotifyPlaylistAlbumSchema = z.object({
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
})

export const SpotifyPlaylistSchema = z.object({
    album: z.union([SpotifyPlaylistAlbumSchema, z.null()]).optional(),
    artists: z.union([z.array(AlbumArtistSchema), z.null()]).optional(),
    available_markets: z.union([z.array(z.string()), z.null()]).optional(),
    disc_number: z.union([z.number(), z.null()]).optional(),
    duration_ms: z.union([z.number(), z.null()]).optional(),
    explicit: z.union([z.boolean(), z.null()]).optional(),
    external_ids: z.union([SpotifyPlaylistExternalIdsSchema, z.null()]).optional(),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    is_local: z.union([z.boolean(), z.null()]).optional(),
    name: z.string(),
    popularity: z.union([z.number(), z.null()]).optional(),
    preview_url: z.union([z.null(), z.string()]).optional(),
    track_number: z.union([z.number(), z.null()]).optional(),
    uri: z.string(),
    collaborative: z.union([z.boolean(), z.null()]).optional(),
    description: z.union([z.null(), z.string()]).optional(),
    followers: z.union([FollowersSchema, z.null()]).optional(),
    images: z.union([z.array(ImageSchema), z.null()]).optional(),
    owner: z.union([OwnerSchema, z.null()]).optional(),
    public: z.union([z.boolean(), z.null()]).optional(),
    snapshot_id: z.union([z.null(), z.string()]).optional(),
    tracks: z.union([TracksSchema, z.null()]).optional(),
})

export type SpotifyPlaylist = z.infer<typeof SpotifyPlaylistAlbumSchema>
