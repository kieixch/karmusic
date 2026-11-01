import { describe, expect, it } from "vitest";
import { normalizeFreeToUseTrack, normalizeJamendoTrack } from "./normalize";

describe("normalizeFreeToUseTrack", () => {
  it("maps provider fields into a stable track", () => {
    const track = normalizeFreeToUseTrack(
      {
        id: "abc-123",
        title: "  Enlivening ",
        duration: 152.8,
        genre: "Electronic",
        artists: [[1, { name: "Pufino" }], { name: "Guest" }],
        thumbnails: { md: "https://cdn.example/cover.webp" },
        files: { mp3: "https://cdn.example/file.mp3" },
      },
      42,
    );

    expect(track).toMatchObject({
      id: "freetouse:abc-123",
      source: "online",
      provider: "freetouse",
      providerTrackId: "abc-123",
      title: "Enlivening",
      artist: "Pufino, Guest",
      genre: "Electronic",
      duration: 152.8,
      artworkUrl: "https://cdn.example/cover.webp",
      playbackUrl: "https://cdn.example/file.mp3",
      addedAt: 42,
    });
    expect(track?.licenseUrl).toBe("https://freetouse.com/license");
    expect(track?.attribution).toContain("Pufino");
  });

  it("rejects missing id or title and insecure URLs", () => {
    expect(normalizeFreeToUseTrack({ title: "No id" })).toBeNull();
    expect(normalizeFreeToUseTrack({ id: "x" })).toBeNull();
    const insecure = normalizeFreeToUseTrack({
      id: "x",
      title: "Title",
      files: { mp3: "http://insecure.example/file.mp3" },
    });
    expect(insecure?.playbackUrl).toBeUndefined();
  });

  it("falls back to unknown artist and no artwork", () => {
    const track = normalizeFreeToUseTrack({ id: "x", title: "Title" });
    expect(track?.artist).toBe("Unknown artist");
    expect(track?.artworkUrl).toBeUndefined();
  });
});

describe("normalizeJamendoTrack", () => {
  it("maps Creative Commons metadata", () => {
    const track = normalizeJamendoTrack({
      id: "991",
      name: "Open Sky",
      artist_name: "Composer",
      album_name: "Album",
      duration: 200,
      image: "https://img.example/cover.jpg",
      audio: "https://audio.example/track.mp3",
      license_ccurl: "https://creativecommons.org/licenses/by/4.0/",
      shareurl: "https://jamendo.com/track/991",
      musicinfo: { tags: { genres: ["Jazz", "Blues"] } },
    });

    expect(track).toMatchObject({
      id: "jamendo:991",
      provider: "jamendo",
      title: "Open Sky",
      artist: "Composer",
      album: "Album",
      genre: "Jazz",
      licenseName: "Creative Commons",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    });
  });

  it("handles string genres and missing optional fields", () => {
    const track = normalizeJamendoTrack({
      id: "1",
      name: "Track",
      musicinfo: { tags: { genres: "Rock" } },
    });
    expect(track?.genre).toBe("Rock");
    expect(track?.artworkUrl).toBeUndefined();
    expect(track?.playbackUrl).toBeUndefined();
  });

  it("rejects missing id or name", () => {
    expect(normalizeJamendoTrack({ name: "No id" })).toBeNull();
    expect(normalizeJamendoTrack({ id: "1" })).toBeNull();
  });
});
