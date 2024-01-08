import { Option } from "@commander-js/extra-typings"

export const allOption = new Option("--all", "Remove all caches").default(false)
export const tracksOption = new Option("--tracks", "Remove track caches").default(false)
export const imagesOption = new Option("--images", "Remove image caches").default(false)
export const albumsOption = new Option("--albums", "Remove album caches").default(false)
export const playlistsOption = new Option("--playlists", "Remove playlist caches").default(false)
export const tokensOption = new Option("--tokens", "Remove token caches").default(false)
