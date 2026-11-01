# KarMusic

KarMusic is a mobile-first web music player for royalty-free online tracks and the audio files already on your device. It is built around a lyrics-first experience: import or stream a song, open **Lyrics Mode**, rotate your phone, and the lyrics take over the screen while playback controls stay within reach.

KarMusic has no account system, no analytics and no built-in copyrighted catalog. Local files are stored in the browser and are never uploaded.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkieixch%2Fkarmusic)

## Features

### Music sources

- **Free To Use** online catalog. Public, keyless API; full-length streams. Attribution and license details are shown with every track.
- **Local imports** through a file picker or drag and drop. Metadata and embedded artwork are read locally with `music-metadata`; unsupported or missing tags fall back to the filename.
- **Optional Jamendo** catalog for Creative Commons tracks. Configured with a server-only client ID.
- Mixed playlists and queues can contain online and local tracks together.

### Player

- Persistent mini player on every page and a full Now Playing screen.
- Seek, volume, mute, skip, previous, shuffle, repeat off/all/one, playback speed.
- Queue management: play next, add to queue, jump, remove, clear.
- Media Session integration where supported, including lock-screen metadata and controls.
- Online stream URLs are refreshed through the provider when they expire.
- Favorites, recently played, playlists and settings persist across reloads.

### Lyrics

- Synced LRC and plain lyrics.
- Automatic line highlighting, click-to-seek, auto-scroll, manual browse with a "Follow lyrics" affordance.
- Per-track timing offset.
- Fullscreen Lyrics Mode with safe-area-aware controls; landscape layout is optimized for phones and tablets.
- Readable typography controls: font size, line spacing, background dim, minimal/full view.
- Orientation lock is requested only when the browser supports it. When fullscreen or orientation lock is unavailable, Lyrics Mode still works in the browser window and explains the limitation.

### Library and data

- Search across local tracks, saved online tracks and playlist names; online search starts after two characters.
- Filter and sort local music by title, artist, duration or recently added.
- Playlist create, rename, delete, reorder, export and import. Exports contain metadata only, never audio.
- Import duplicate detection using a stable local file hash.
- Storage estimate and a warning when browser persistence is at risk.
- Settings for default volume, playback rate, reduced motion and lyrics display.
- Navigation recovery for stalled App Router transitions: if a URL changes but the new page does not commit, the app performs a full navigation after three seconds.
- PWA manifest and app-shell service worker. Audio streams and provider API responses are never cached by the service worker; Next.js assets use network-first caching so deployments do not serve stale route code.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript strict mode
- Tailwind CSS 3
- IndexedDB through `idb`
- `music-metadata` for local tag parsing
- Lucide icons
- Vitest + Testing Library for unit and component tests
- Playwright for end-to-end tests

## Getting started

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Optional configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `JAMENDO_CLIENT_ID` | Enables the optional Jamendo provider. Read only by server route handlers. |
| `NEXT_PUBLIC_ENABLE_FREETOUSE` | Set to `false` to hide the built-in Free To Use provider in the UI. |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for production metadata. |

No key is required for Free To Use. Never expose `JAMENDO_CLIENT_ID` with a `NEXT_PUBLIC_` prefix.

### Production

```bash
npm run build
npm start
```

## Deploy to Vercel

KarMusic is a standard Next.js App Router project. No custom Vercel configuration or server is
required.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import `kieixch/karmusic`.
3. Keep the detected framework as **Next.js**. Leave the build command, output directory and
   install command at their defaults.
4. Optionally add environment variables:
   - `JAMENDO_CLIENT_ID`: enables the Jamendo catalog.
   - `NEXT_PUBLIC_SITE_URL`: set to the final production URL, for example
     `https://karmusic.vercel.app`. If omitted, KarMusic uses Vercel's
     `VERCEL_PROJECT_PRODUCTION_URL` automatically.
   - `NEXT_PUBLIC_ENABLE_FREETOUSE=false`: hides the built-in Free To Use provider.
5. Deploy. Provider requests run in Vercel Functions through the `/api/*` route handlers; no
   extra runtime configuration is needed.

The `engines` field requires Node.js 20.9 or newer. Vercel's current Node.js 22 runtime satisfies
this. After changing environment variables, redeploy so the server route handlers receive them.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:e2e` | Run Playwright. Builds and starts a production server on port `3100`. |
| `npm run icons` | Regenerate the PNG icons from the SVG logo. |
| `npm run fixtures` | Regenerate the original demo WAV and LRC files. |

Install the Playwright browser once if needed:

```bash
npx playwright install chromium
```

## Project structure

```
src/
  app/                     routes, layout, manifest, API proxies
  components/
    layout/                sidebar, mobile navigation, shell
    library/               track lists, import UI, online catalog sections
    lyrics/                sync panel, editor, fullscreen Lyrics Mode
    player/                mini player, seek bar, controls, queue menu
    playlist/              playlist cards
    providers/             player, library, settings, lyrics mode, toasts
    ui/                    buttons, dialogs, inputs, artwork, feedback
  hooks/                   online catalog, lyrics, orientation, storage, debounce
  lib/
    audio/                 audio engine and format helpers
    library/               local import pipeline
    lyrics/                LRC parser, active-line lookup
    playlists/             pure playlist operations
    providers/             provider clients, normalization, server fetches
    storage/               IndexedDB stores, schema, export validation
    utils/                 formatting, ids, errors, filters, class names
  types/                   track, lyrics, playlist and settings models
e2e/                       Playwright specs and mocked catalog fixtures
public/
  demo/                    original synthesized demo audio + LRC
  icons/                   app icons
  manifest.webmanifest     PWA manifest
  sw.js                    app-shell-only service worker
scripts/                   icon and demo fixture generators
```

## API proxy routes

The browser only talks to KarMusic's own routes. This keeps provider credentials server-side and works around providers that do not send browser CORS headers.

| Route | Purpose |
| --- | --- |
| `/api/providers/status` | Provider availability and license metadata. |
| `/api/freetouse/tracks` | Featured/catalog tracks with ordering and pagination. |
| `/api/freetouse/search` | Free To Use search. |
| `/api/freetouse/track/[id]` | Track detail and playback-URL refresh. |
| `/api/freetouse/categories` | Catalog categories. |
| `/api/freetouse/categories/[id]/tracks` | Tracks in a category. |
| `/api/jamendo/tracks` | Jamendo featured tracks; returns `503` when unconfigured. |
| `/api/jamendo/search` | Jamendo search. |
| `/api/jamendo/track/[id]` | Jamendo track detail. |

Stable track IDs use the form `local:<hash>`, `freetouse:<id>` and `jamendo:<id>`. Local tracks never persist an object URL; audio blobs are resolved from IndexedDB at playback time.

## Data and storage

- IndexedDB database `karmusic` with stores `tracks`, `blobs`, `lyrics`, `playlists` and `meta`.
- Local files are limited to 300 MB each and are stored per browser profile.
- Removing a local track also removes its blob and lyrics; playlist references are pruned.
- Browser storage quotas, eviction and private-browsing behavior are controlled by the browser.
- Clearing site data removes the library permanently.

## Music, licensing and attribution

KarMusic does not host or bundle a music catalog.

- **Free To Use** tracks remain subject to the provider's license. Free use conditions and attribution requirements apply; commercial use may require a paid license. The app links to the provider's license and stores attribution with each track.
- **Jamendo** tracks use licenses chosen by their creators. Always verify the license URL and attribution shown for a track before reuse.
- **Your own files** remain yours. Importing a file does not upload it.
- The included demo track is an original 24-second synthesized WAV generated by `scripts/generate-demo-audio.mjs`. It contains no third-party samples. Its LRC is original placeholder text.

KarMusic does not bypass DRM, scrape commercial services or download from providers that prohibit it. Online playback uses provider-authorized stream URLs.

## Testing

Unit and component tests cover the LRC parser, active-line lookup with timing offsets, playlist operations, playlist export validation, track filtering/sorting, provider normalization and the shared track list.

```bash
npm test
npm run typecheck
npm run lint
```

End-to-end specs cover:

- importing the demo track, playback and synced Lyrics Mode;
- streaming a mocked online track and searching;
- creating a playlist, mixing local and online tracks, reordering and persistence after reload.

The Playwright catalog is mocked so the suite does not depend on external provider uptime. The server is built and started automatically on port `3100`; override with `PLAYWRIGHT_PORT`.

## Known limitations

- Playback depends on codecs supported by the browser, not only on file extensions. WAV files usually have no embedded tags.
- Fullscreen and orientation lock are progressive enhancements and vary by browser. The UI explains when a request is declined.
- Online playback requires an internet connection. Saved online tracks keep metadata, not audio, and their stream URLs may expire.
- The queue and current playback position are session-only. The library, playlists, favorites, lyrics and settings persist.
- There is no account, cloud sync, waveform view, equalizer or offline download feature.
- The service worker caches only the app shell; it does not make the player fully offline.
- Provider APIs may change or rate-limit requests. A provider outage affects only that online source.

## Troubleshooting

### The online catalog is empty or errors

Confirm the Next.js server can reach `https://api.freetouse.com`. The API is contacted server-side, so browser extensions or client-side network rules do not apply. Provider outages and rate limits are reported in the UI with a retry action.

### Jamendo is not configured

Set `JAMENDO_CLIENT_ID` in `.env.local`, restart the server and reload. The status card on `/online` shows whether the server sees the key.

### A local file will not import

Check the file extension, size (under 300 MB) and whether the browser can decode it. Duplicate files are skipped based on name, size and modification time.

### Lyrics Mode does not rotate the screen

Browsers generally require fullscreen before locking orientation, and some platforms do not allow it at all. Rotate the device manually; Lyrics Mode still renders in the current window.

### Storage data disappeared

Private browsing, browser cleanup and site-data clearing can remove IndexedDB. The app shows a storage warning when quota or persistence problems are detected.
