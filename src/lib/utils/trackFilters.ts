import type { Track } from "@/types/track";
import type { Playlist } from "@/types/playlist";

export type TrackSort = "recent" | "title" | "artist" | "duration";
export type SourceFilter = "all" | "online" | "local";

export function filterTracks(
  tracks: Track[],
  options: { query?: string; source?: SourceFilter; sort?: TrackSort } = {},
): Track[] {
  const query = (options.query ?? "").trim().toLowerCase();
  const source = options.source ?? "all";
  const sort = options.sort ?? "recent";

  const filtered = tracks.filter((track) => {
    if (source === "local" && track.source !== "local") return false;
    if (source === "online" && track.source !== "online") return false;
    if (!query) return true;
    return [track.title, track.artist, track.album, track.genre]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  return filtered.sort((a, b) => {
    switch (sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "artist":
        return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
      case "duration":
        return (a.duration ?? 0) - (b.duration ?? 0);
      case "recent":
      default:
        return b.addedAt - a.addedAt;
    }
  });
}

export function searchPlaylists(playlists: Playlist[], query: string): Playlist[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return playlists.filter((playlist) => playlist.name.toLowerCase().includes(needle));
}

export function totalDuration(tracks: Track[]): number {
  return tracks.reduce((sum, track) => sum + (track.duration ?? 0), 0);
}
