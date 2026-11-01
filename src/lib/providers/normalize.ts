import type { Track } from "@/types/track";
import { makeOnlineTrackId } from "@/lib/utils/id";
import { FREE_TO_USE, JAMENDO } from "./types";

export interface FreeToUseRawArtist {
  id?: string;
  name?: string;
}

export interface FreeToUseRawTrack {
  id?: string;
  title?: string;
  duration?: number;
  genre?: string | null;
  artists?: Array<[number, FreeToUseRawArtist] | FreeToUseRawArtist>;
  thumbnails?: { sm?: string; md?: string; lg?: string; xl?: string } | null;
  files?: { mp3?: string } | null;
  release_date?: string;
}

export interface FreeToUseRawCategory {
  id?: string;
  name?: string;
  type?: string;
  thumbnails?: { sm?: string; md?: string; lg?: string } | null;
}

export interface NormalizedCategory {
  id: string;
  name: string;
  type: string;
  artworkUrl?: string;
}

function artistNameFrom(artists: FreeToUseRawTrack["artists"]): string {
  if (!Array.isArray(artists) || artists.length === 0) return "Unknown artist";
  const names = artists
    .map((entry) => {
      if (Array.isArray(entry)) return entry[1]?.name?.trim();
      return entry?.name?.trim();
    })
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : "Unknown artist";
}

function absoluteHttps(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeFreeToUseTrack(raw: FreeToUseRawTrack, now = Date.now()): Track | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!id || !title) return null;

  const artworkUrl =
    absoluteHttps(raw.thumbnails?.md) ??
    absoluteHttps(raw.thumbnails?.lg) ??
    absoluteHttps(raw.thumbnails?.sm);
  const playbackUrl = absoluteHttps(raw.files?.mp3);
  const duration =
    typeof raw.duration === "number" && Number.isFinite(raw.duration) && raw.duration > 0
      ? raw.duration
      : undefined;

  return {
    id: makeOnlineTrackId("freetouse", id),
    source: "online",
    provider: "freetouse",
    providerTrackId: id,
    title,
    artist: artistNameFrom(raw.artists),
    album: FREE_TO_USE.name,
    genre: raw.genre ?? undefined,
    duration,
    artworkUrl,
    playbackUrl,
    licenseName: FREE_TO_USE.licenseName,
    licenseUrl: FREE_TO_USE.licenseUrl,
    attribution: `${artistNameFrom(raw.artists)} — via Free To Use`,
    sourceUrl: FREE_TO_USE.website,
    addedAt: now,
  };
}

export function normalizeFreeToUseCategory(raw: FreeToUseRawCategory): NormalizedCategory | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type ?? "Category",
    artworkUrl: absoluteHttps(raw.thumbnails?.sm),
  };
}

export interface JamendoRawTrack {
  id?: string;
  name?: string;
  artist_name?: string;
  album_name?: string;
  duration?: number;
  image?: string;
  audio?: string;
  license_ccurl?: string;
  shareurl?: string;
  musicinfo?: { tags?: { genres?: string[] | string } };
}

export function normalizeJamendoTrack(raw: JamendoRawTrack, now = Date.now()): Track | null {
  const id = raw.id != null ? String(raw.id).trim() : "";
  const title = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !title) return null;

  const artist = typeof raw.artist_name === "string" && raw.artist_name.trim() ? raw.artist_name.trim() : "Unknown artist";
  const rawGenres = raw.musicinfo?.tags?.genres;
  const genre = Array.isArray(rawGenres) ? rawGenres[0] : rawGenres;
  const duration =
    typeof raw.duration === "number" && Number.isFinite(raw.duration) && raw.duration > 0
      ? raw.duration
      : undefined;

  return {
    id: makeOnlineTrackId("jamendo", id),
    source: "online",
    provider: "jamendo",
    providerTrackId: id,
    title,
    artist,
    album: raw.album_name || undefined,
    genre: genre || undefined,
    duration,
    artworkUrl: absoluteHttps(raw.image),
    playbackUrl: absoluteHttps(raw.audio),
    licenseName: raw.license_ccurl ? "Creative Commons" : JAMENDO.licenseName,
    licenseUrl: absoluteHttps(raw.license_ccurl) ?? JAMENDO.licenseUrl,
    attribution: `"${title}" by ${artist} — via Jamendo`,
    sourceUrl: absoluteHttps(raw.shareurl),
    addedAt: now,
  };
}
