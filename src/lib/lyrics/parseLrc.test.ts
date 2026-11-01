import { describe, expect, it } from "vitest";
import { parseLyrics, parseLrcTimestamp } from "./parseLrc";

describe("parseLrcTimestamp", () => {
  it("parses minutes, seconds and fractions", () => {
    expect(parseLrcTimestamp("1", "05", "50")).toBe(65.5);
    expect(parseLrcTimestamp("01", "05")).toBe(65);
    expect(parseLrcTimestamp(2, 3, "25")).toBe(123.25);
  });

  it("rejects malformed seconds and non-numeric input", () => {
    expect(parseLrcTimestamp("1", "60")).toBeNull();
    expect(parseLrcTimestamp("x", "12")).toBeNull();
    expect(parseLrcTimestamp("-1", "12")).toBeNull();
  });
});

describe("parseLyrics", () => {
  it("parses metadata and sorts timestamped lines", () => {
    const parsed = parseLyrics(
      ["[ar:Artist]", "[ti:Song]", "[offset:250]", "[00:10.50]Second", "[00:02.00]First"].join("\n"),
    );
    expect(parsed.format).toBe("lrc");
    expect(parsed.meta).toMatchObject({ artist: "Artist", title: "Song", offsetMs: 250 });
    expect(parsed.lines).toEqual([
      { time: 2, text: "First" },
      { time: 10.5, text: "Second" },
    ]);
  });

  it("expands multiple timestamps on one line", () => {
    const parsed = parseLyrics("[00:01.00][00:03.50]Chorus\n[00:05.00]Verse");
    expect(parsed.lines).toEqual([
      { time: 1, text: "Chorus" },
      { time: 3.5, text: "Chorus" },
      { time: 5, text: "Verse" },
    ]);
  });

  it("skips malformed timestamps when synced lines exist", () => {
    const parsed = parseLyrics("[99:99.99]Not a timestamp\n[00:01.00]Real line");
    expect(parsed.format).toBe("lrc");
    expect(parsed.lines).toEqual([{ time: 1, text: "Real line" }]);
  });

  it("returns plain lyrics when no timestamps exist", () => {
    const parsed = parseLyrics("First line\n\nSecond line");
    expect(parsed.format).toBe("plain");
    expect(parsed.lines).toEqual([
      { time: null, text: "First line" },
      { time: null, text: "Second line" },
    ]);
  });

  it("strips a BOM and normalises CRLF", () => {
    const parsed = parseLyrics("\uFEFF[00:01.00]One\r\n[00:02.00]Two");
    expect(parsed.lines).toHaveLength(2);
  });

  it("returns an empty result for blank input", () => {
    const parsed = parseLyrics("   \n\n");
    expect(parsed.lines).toEqual([]);
    expect(parsed.format).toBe("plain");
  });
});
