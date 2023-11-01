import { SpotifyAlbum } from "../schema/Spotify/Album.js"
import { SpotifyPlaylist } from "../schema/Spotify/Playlist.js"
import { SpotifyTrack } from "../schema/Spotify/Track.js"

export type SimpleTrack = {
    id: string
    name: string
    album: string
    artists: string[]
    releaseDate: string
    duration_ms: number
    originType: "track" | "playlist" | "album"
    playlist?: string
    coverUrl?: string
}

export function createSimpleTrackFromTrack(track: SpotifyTrack) {
    const simpleTrack: SimpleTrack = {
        id: track.id,
        name: track.name,
        album: track.album.name,
        coverUrl: track.album.images?.[0]?.url,
        artists: track.artists.map((artist) => artist.name),
        releaseDate: track.album.release_date,
        duration_ms: track.duration_ms,
        originType: "track",
    }

    return simpleTrack
}

export function createSimpleTracksFromPlaylist(playlist: SpotifyPlaylist) {
    const simpleTrackList: SimpleTrack[] = []

    const tracks = playlist.tracks?.items?.map((item) => item.track)

    if (!tracks?.length) return simpleTrackList

    for (const track of tracks) {
        const simpleTrack: SimpleTrack = {
            id: track.id,
            name: track.name,
            album: track.album.name,
            coverUrl: track.album.images?.[0]?.url,
            artists: track.artists.map((artist) => artist.name),
            releaseDate: track.album.release_date,
            duration_ms: track.duration_ms,
            playlist: playlist.name,
            originType: "playlist",
        }

        simpleTrackList.push(simpleTrack)
    }

    return simpleTrackList
}

export function createSimpleTracksFromAlbum(album: SpotifyAlbum) {
    const simpleTrackList: SimpleTrack[] = []

    const tracks = album.tracks.items

    if (!tracks?.length) return simpleTrackList

    for (const track of tracks) {
        const simpleTrack: SimpleTrack = {
            id: track.id,
            name: track.name,
            album: album.name,
            coverUrl: album.images?.[0]?.url,
            artists: track.artists.map((artist) => artist.name),
            releaseDate: album.release_date,
            duration_ms: track.duration_ms,
            originType: "album",
        }

        simpleTrackList.push(simpleTrack)
    }

    return simpleTrackList
}
