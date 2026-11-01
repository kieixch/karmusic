import { describe, expect, it } from "vitest";
import type { Track } from "@/types/track";
import type { Playlist } from "@/types/playlist";
import { filterTracks, searchPlaylists, totalDuration } from "./trackFilters";

function track(overrides: Partial<Track>): Track {
  return {
    id: "local:1",
    source: "local",
    provider: "local",
    title: "Alpha",
    artist: "Artist",
    addedAt: 1,
    duration: 60,
    ...overrides,
  };
}

const tracks: Track[] = [
  track({ id: "local:1", title: "Zebra", artist: "Aster", addedAt: 3, duration: 120 }),
  track({
    id: "freetouse:2",
    source: "online",
    provider: "freetouse",
    title: "Morning",
    artist: "Zed",
    genre: "Ambient",
    addedAt: 2,
    duration: 30,
  }),
  track({ id: "local:3", title: "Alpha", artist: "Zed", album: "First", addedAt: 1, duration: 90 }),
];

describe("filterTracks", () => {
  it("filters by source", () => {
    expect(filterTracks(tracks, { source: "local" })).toHaveLength(2);
    expect(filterTracks(tracks, { source: "online" })).toHaveLength(1);
    expect(filterTracks(tracks, { source: "all" })).toHaveLength(3);
  });

  it("searches title, artist, album and genre case-insensitively", () => {
    expect(filterTracks(tracks, { query: "zeb" }).map((item) => item.title)).toEqual(["Zebra"]);
    expect(filterTracks(tracks, { query: "zed" }).map((item) => item.title)).toEqual([
      "Morning",
      "Alpha",
    ]);
    expect(filterTracks(tracks, { query: "first" }).map((item) => item.title)).toEqual(["Alpha"]);
    expect(filterTracks(tracks, { query: "ambient" }).map((item) => item.title)).toEqual(["Morning"]);
  });

  it("sorts by recent, title, artist and duration", () => {
    expect(filterTracks(tracks, { sort: "recent" }).map((item) => item.title)).toEqual([
      "Zebra",
      "Morning",
      "Alpha",
    ]);
    expect(filterTracks(tracks, { sort: "title" }).map((item) => item.title)).toEqual([
      "Alpha",
      "Morning",
      "Zebra",
    ]);
    expect(filterTracks(tracks, { sort: "artist" }).map((item) => item.title)).toEqual([
      "Zebra",
      "Alpha",
      "Morning",
    ]);
    expect(filterTracks(tracks, { sort: "duration" }).map((item) => item.title)).toEqual([
      "Morning",
      "Alpha",
      "Zebra",
    ]);
  });

  it("combines query and source filters", () => {
    expect(filterTracks(tracks, { query: "zed", source: "online" })).toHaveLength(1);
  });
});

describe("searchPlaylists", () => {
  const playlists: Playlist[] = [
    { id: "p1", name: "Focus", trackIds: [], createdAt: 1, updatedAt: 1 },
    { id: "p2", name: "Night drive", trackIds: [], createdAt: 1, updatedAt: 1 },
  ];

  it("matches names case-insensitively", () => {
    expect(searchPlaylists(playlists, "night")).toEqual([playlists[1]]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchPlaylists(playlists, "  ")).toEqual([]);
  });
});

describe("totalDuration", () => {
  it("sums known durations", () => {
    expect(totalDuration(tracks)).toBe(240);
  });
});
