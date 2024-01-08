# @nadim147/spdl

## 1.2.1

### Patch Changes

-   519e2cf: refector code style

## 1.2.0

### Minor Changes

-   ccf8db3: update logging system

## 1.1.0

### Minor Changes

-   4c0bf1e: add faster song search using youtubei.js

## 1.0.2

### Patch Changes

-   497ab80: fix clear-cache wrong names

## 1.0.1

### Patch Changes

-   9006105: fix wrong cache directory name

## 1.0.0

### Major Changes

-   d0d3970: Downloading now the default command. So, you don't have to use `spdl track url`. Instead use `spdl url`.

## 0.6.1

### Patch Changes

-   77139b6: fix adding metadate even if lyrics is missing

## 0.6.0

### Minor Changes

-   1ad2976: add clear-cache command
-   628c613: add id after name

## 0.5.0

### Minor Changes

-   ac128ac: Add --lrc option to track, playlist and album command

## 0.4.3

### Patch Changes

-   bd2d2d3: fix song limit fixed to 1

## 0.4.2

### Patch Changes

-   efbd777: fix path error for unix based os

## 0.4.1

### Patch Changes

-   cfdba05: avoid fetching spotify access token if data is already cached
-   66176f8: add quality to 0 (best) in yt-dlp command
-   b35fd63: use types instead of zod parsing in action functions
-   be1591a: add more rules in `eslintrc`

## 0.4.0

### Minor Changes

-   5454fdd: add option to set custom search limit

### Patch Changes

-   af5a192: use regex `.replace` statement in Kugou

## 0.3.0

### Minor Changes

-   ff53c44: add timer to sleep function
-   4c8615f: check if the track already exists

### Patch Changes

-   c0e0574: save cache and config to home directory
-   65ca1db: improve printing/logging
-   3ab8cf6: increase `maxEventListener` to avoid error

## 0.2.1

### Patch Changes

-   6bcc011: remove uneccessary version check for yt-dlp and ffmpeg
-   9ab3a77: fix relative path parsing with '-o' option
-   188a670: add playlist name in simple track creator

## 0.2.0

### Minor Changes

-   59126fe: add getAlbum to Spotify class
-   db4cc7f: add option to download album

### Patch Changes

-   db4cc7f: Replace throw with return to avoid crash

## 0.1.3

### Patch Changes

-   a1c0f3e: Add error handling when client tokens are missing
-   a1c0f3e: Remove .vscode directory

## 0.1.2

### Patch Changes

-   4987dbc: add publishConfig to package.json

## 0.1.1

### Patch Changes

-   bffafd0: Add ci for publishing to npm
-   bffafd0: CI: Setup publish action
