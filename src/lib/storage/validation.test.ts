import { describe, expect, it } from "vitest";
import type { Playlist } from "@/types/playlist";
import { createPlaylistExport, isPlaylist, parsePlaylistExport } from "./validation";

const playlist: Playlist = {
  id: "playlist:test",
  name: "Test",
  trackIds: ["a", "a", "b"],
  createdAt: 1,
  updatedAt: 2,
};

describe("playlist validation", () => {
  it("accepts a well-formed playlist", () => {
    expect(isPlaylist(playlist)).toBe(true);
    expect(isPlaylist({ ...playlist, trackIds: [1] })).toBe(false);
    expect(isPlaylist({ ...playlist, name: "  " })).toBe(false);
    expect(isPlaylist(null)).toBe(false);
  });

  it("round-trips an export", () => {
    const exported = JSON.stringify(createPlaylistExport([playlist], new Date("2026-01-02T03:04:05Z")));
    const parsed = parsePlaylistExport(exported);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.playlists[0]).toMatchObject({ id: "playlist:test", name: "Test" });
    expect(parsed.playlists[0].trackIds).toEqual(["a", "b"]);
  });

  it("accepts a bare array export", () => {
    const parsed = parsePlaylistExport(JSON.stringify([playlist]));
    expect(parsed.playlists).toHaveLength(1);
  });

  it("collects warnings for invalid entries", () => {
    const parsed = parsePlaylistExport(JSON.stringify([playlist, { nope: true }]));
    expect(parsed.playlists).toHaveLength(1);
    expect(parsed.warnings[0]).toContain("Skipped entry 2");
  });

  it("throws for invalid JSON and non-playlist shapes", () => {
    expect(() => parsePlaylistExport("{")).toThrow(/valid JSON/);
    expect(() => parsePlaylistExport(JSON.stringify({ playlists: [] }))).toThrow(/valid playlists/);
    expect(() => parsePlaylistExport(JSON.stringify({ hello: "world" }))).toThrow(/No playlists/);
  });

  it("truncates overly long names and ids", () => {
    const parsed = parsePlaylistExport(
      JSON.stringify([{ ...playlist, id: "x".repeat(300), name: "n".repeat(300) }]),
    );
    expect(parsed.playlists[0].id).toHaveLength(200);
    expect(parsed.playlists[0].name).toHaveLength(120);
  });
});
