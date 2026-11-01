import { describe, expect, it } from "vitest";
import type { Playlist } from "@/types/playlist";
import {
  addTrackToPlaylist,
  createPlaylist,
  dedupeTrackIds,
  moveTrack,
  prunePlaylists,
  removeTrackFromPlaylist,
  renamePlaylist,
} from "./operations";

const base: Playlist = {
  id: "playlist:one",
  name: "Night drive",
  trackIds: ["a", "b", "c"],
  createdAt: 1,
  updatedAt: 1,
};

describe("playlist operations", () => {
  it("creates a playlist with a trimmed name and fallback", () => {
    const playlist = createPlaylist("  Focus  ", 100);
    expect(playlist.name).toBe("Focus");
    expect(playlist.trackIds).toEqual([]);
    expect(playlist.createdAt).toBe(100);
    expect(createPlaylist("   ", 100).name).toBe("Untitled playlist");
  });

  it("adds a track once", () => {
    const added = addTrackToPlaylist(base, "d", 50);
    expect(added.trackIds).toEqual(["a", "b", "c", "d"]);
    expect(added.updatedAt).toBe(50);
    expect(addTrackToPlaylist(base, "b", 60)).toBe(base);
  });

  it("removes an existing track without mutating the original", () => {
    const removed = removeTrackFromPlaylist(base, "b", 70);
    expect(removed.trackIds).toEqual(["a", "c"]);
    expect(base.trackIds).toEqual(["a", "b", "c"]);
    expect(removeTrackFromPlaylist(base, "missing")).toBe(base);
  });

  it("moves tracks in both directions and rejects out-of-bounds indexes", () => {
    expect(moveTrack(base, 0, 2, 10).trackIds).toEqual(["b", "c", "a"]);
    expect(moveTrack(base, 2, 1, 10).trackIds).toEqual(["a", "c", "b"]);
    expect(moveTrack(base, -1, 0)).toBe(base);
    expect(moveTrack(base, 0, 5)).toBe(base);
    expect(moveTrack(base, 1, 1)).toBe(base);
  });

  it("renames only with a non-empty value", () => {
    expect(renamePlaylist(base, "  New name ", 20).name).toBe("New name");
    expect(renamePlaylist(base, "   ")).toBe(base);
  });

  it("prunes orphaned track references", () => {
    const other = { ...base, id: "playlist:two", trackIds: ["b", "x"] };
    const pruned = prunePlaylists([base, other], new Set(["a", "b", "c"]), 30);
    expect(pruned[0]).toBe(base);
    expect(pruned[1].trackIds).toEqual(["b"]);
    expect(prunePlaylists([base], new Set(["a", "b", "c"]))[0]).toBe(base);
  });

  it("deduplicates and filters empty ids", () => {
    expect(dedupeTrackIds(["a", "a", "", "b", "b"])).toEqual(["a", "b"]);
  });
});
