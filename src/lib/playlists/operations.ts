import type { Playlist } from "@/types/playlist";
import { makeId } from "@/lib/utils/id";

export function createPlaylist(name: string, now = Date.now()): Playlist {
  const trimmed = name.trim();
  return {
    id: makeId("playlist"),
    name: trimmed || "Untitled playlist",
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addTrackToPlaylist(playlist: Playlist, trackId: string, now = Date.now()): Playlist {
  if (playlist.trackIds.includes(trackId)) return playlist;
  return { ...playlist, trackIds: [...playlist.trackIds, trackId], updatedAt: now };
}

export function removeTrackFromPlaylist(playlist: Playlist, trackId: string, now = Date.now()): Playlist {
  if (!playlist.trackIds.includes(trackId)) return playlist;
  return {
    ...playlist,
    trackIds: playlist.trackIds.filter((id) => id !== trackId),
    updatedAt: now,
  };
}

export function moveTrack(playlist: Playlist, from: number, to: number, now = Date.now()): Playlist {
  if (from === to) return playlist;
  if (from < 0 || from >= playlist.trackIds.length) return playlist;
  if (to < 0 || to >= playlist.trackIds.length) return playlist;
  const ids = [...playlist.trackIds];
  const [item] = ids.splice(from, 1);
  ids.splice(to, 0, item);
  return { ...playlist, trackIds: ids, updatedAt: now };
}

export function renamePlaylist(playlist: Playlist, name: string, now = Date.now()): Playlist {
  const trimmed = name.trim();
  if (!trimmed) return playlist;
  return { ...playlist, name: trimmed, updatedAt: now };
}

/** Remove orphaned track references after a track is deleted. */
export function prunePlaylists(playlists: Playlist[], validTrackIds: Set<string>, now = Date.now()): Playlist[] {
  let changed = false;
  const next = playlists.map((playlist) => {
    const ids = playlist.trackIds.filter((id) => validTrackIds.has(id));
    if (ids.length === playlist.trackIds.length) return playlist;
    changed = true;
    return { ...playlist, trackIds: ids, updatedAt: now };
  });
  return changed ? next : playlists;
}

export function dedupeTrackIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
}
