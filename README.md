# SPDL

SPDL is a YouTube-DL (yt-dlp) based tool that allows you to download music while adding metadata from Spotify. It enhances your music library by pulling track information from Spotify and applying it to your downloaded music files. It also allows you to save you spotify playlist in folder/directory.

-   [Requirements](#requirements)
-   [Installation](#installation)
    -   [Auto Installation](#auto-installation)
    -   [Manual Installation](#manual-installation)
    -   [Post installation](#post-installation)
-   [Usage](#usage)
-   [Issues and Contribution](#issues-and-contribution)
-   [License And Credits](#license-and-credits)

## Requirements

Before using this tool, ensure you have the following prerequisites installed on your system:

-   **Node**: v21.0.0 or Higher. You can find it from [here](https://nodejs.org/).
-   **Yt-dlp**: Ensure you have the latest version of Yt-dlp. You can find it on [GitHub](https://github.com/yt-dlp/yt-dlp/wiki/Installation).
-   **ffmpeg**: Lastest or the minimum version required by `yt-dlp`. You can find it from [here](https://www.ffmpeg.org/download.html).

You can use various package managers to install these prerequisites. Here are some examples:

**Windows**:

> **Note**: Winget isn't installed by default on windows 10. Run `winget` to check if it's installed or not.
> You can install it from [Microsoft Store](https://apps.microsoft.com/detail/9NBLGGH4NNS1) or [GitHub](https://github.com/microsoft/winget-cli/releases/latest).

```bash
# Using winget package manager
winget install -s winget nodejs ffmpeg yt-dlp
```

**Linux**:

> _Python3 (pip3) is already installed in most linux distros._

```bash
# Using APT package manager (Debian/Ubuntu)
sudo apt update
sudo apt install nodejs ffmpeg
# For Yt-dlp, consider using pip
# run `sudo apt install python3 pip3` if python3 isn't installed already
pip3 install yt-dlp
```

**Make sure to choose the appropriate package manager for your system to install these requirements.**

## Installation

#### Auto Installation:

To install spdl from npm run this following command.

> **You can also use `yarn` or `pnpm` if you preper.**

```
npm install -g @nadim147/spdl
```

#### Manual Installation:

To install manually, follow these steps:

1.  Clone the repository:
    ```bash
    git clone https://github.com/Nadim147c/SPDL.git
    cd spdl
    ```

> **You can also use `yarn` or `pnpm` for step 2-4.**

2.  Install all node with your favorite package manager.

    ```
    npm install
    ```

3.  Linking globally:

    ```bash
    npm link -g
    ```

4.  Build:

    ```bash
    npm run dev
    ```

#### Post installation

Now, `spdl` command will be availble in your termnial. Run `spdl --version` to check the current version.

Create Spotify app from [Spotify API Deshboard](https://developer.spotify.com/dashboard).
After that, Run `spdl setup` and it will prompt you to setup your Spotify API tokens.

## Usage

Run `spdl` or `spdl --help` to get the help menu.

To download a track, run:

```
spdl track [spotify_track_url]
```

To download a playlist, run: `Only for public playlist`

```
spdl playlist [spotify_playlist_url]
```

The most up-to-date and accurate information about parameters can be found in the built-in help menu (`spdl -h`). Any changes in command and their usage will be available there.

## Issues and Contributions

If you encounter any problems, have questions, or need assistance with spdl, please feel free to [create an issue](https://github.com/Nadim147c/spdl/issues). I'll try to help you with any issues or inquiries you might have.

While I aim to maintain this repository by myself, contributions are welcomed.

> Note: I'm not a experienced js developer and coding style might be confusing.

To contribute, [create an issue](https://github.com/Nadim147c/spdl/issues) detailing the problem you'd like to address or the feature you'd like to add. This way, we can discuss and plan the changes.
And also I'm using changesets and run `pnpm changeset` before you commit your changes.

For any questions or additional information, don't hesitate to reach out through the [issues section](https://github.com/Nadim147c/spdl/issues).

## License And Credits

> This project isn't affilated with Spotify, Youtube and Kugou.

This project is licensed under [GNU GPL-3](./LICENSE).

Downloading lyrics from [Kugou](./src/structure/Kugou.ts) is copied from [z-huang/InnerTune](https://github.com/z-huang/InnerTune).
