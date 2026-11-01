import type { Playlist } from "@/types/playlist";
import { dedupeTrackIds } from "@/lib/playlists/operations";

const MAX_PLAYLISTS = 500;
const MAX_TRACKS_PER_PLAYLIST = 5000;
const MAX_NAME_LENGTH = 120;

export interface PlaylistExport {
  format: "karmusic.playlists";
  version: 1;
  exportedAt: string;
  playlists: Playlist[];
}

export function isPlaylist(value: unknown): value is Playlist {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    Array.isArray(candidate.trackIds) &&
    candidate.trackIds.every((id) => typeof id === "string") &&
    typeof candidate.createdAt === "number" &&
    Number.isFinite(candidate.createdAt) &&
    typeof candidate.updatedAt === "number" &&
    Number.isFinite(candidate.updatedAt)
  );
}

function sanitizePlaylist(value: Playlist): Playlist {
  return {
    id: value.id.slice(0, 200),
    name: value.name.trim().slice(0, MAX_NAME_LENGTH),
    trackIds: dedupeTrackIds(value.trackIds.slice(0, MAX_TRACKS_PER_PLAYLIST)).map((id) =>
      id.slice(0, 300),
    ),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function createPlaylistExport(playlists: Playlist[], now = new Date()): PlaylistExport {
  return {
    format: "karmusic.playlists",
    version: 1,
    exportedAt: now.toISOString(),
    playlists,
  };
}

export function parsePlaylistExport(json: string): { playlists: Playlist[]; warnings: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("The file is not valid JSON.");
  }

  let candidates: unknown[];
  if (Array.isArray(data)) {
    candidates = data;
  } else if (data && typeof data === "object" && Array.isArray((data as { playlists?: unknown }).playlists)) {
    candidates = (data as { playlists: unknown[] }).playlists;
  } else {
    throw new Error("No playlists array found in the imported file.");
  }

  if (candidates.length > MAX_PLAYLISTS) {
    throw new Error(`Too many playlists (maximum ${MAX_PLAYLISTS}).`);
  }

  const warnings: string[] = [];
  const playlists: Playlist[] = [];
  candidates.forEach((candidate, index) => {
    if (!isPlaylist(candidate)) {
      warnings.push(`Skipped entry ${index + 1}: invalid playlist shape.`);
      return;
    }
    playlists.push(sanitizePlaylist(candidate));
  });

  if (!playlists.length) {
    throw new Error("The file does not contain any valid playlists.");
  }

  return { playlists, warnings };
}
