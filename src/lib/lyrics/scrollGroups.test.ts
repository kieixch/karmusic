import { describe, expect, it } from "vitest";
import type { LyricLine } from "@/types/lyrics";
import { groupLyricLinesForScroll } from "./scrollGroups";

function lines(...items: Array<[number | null, string]>): LyricLine[] {
  return items.map(([time, text]) => ({ time, text }));
}

describe("groupLyricLinesForScroll", () => {
  it("groups rapid lines into one sentence block", () => {
    expect(
      groupLyricLinesForScroll(
        lines([0, "Hold on"], [0.8, "to the"], [1.6, "light"]),
      ),
    ).toEqual([{ start: 0, end: 2 }]);
  });

  it("starts a new block after sentence punctuation", () => {
    expect(
      groupLyricLinesForScroll(
        lines([0, "Hold on."], [0.8, "To the light"], [1.6, "Again"]),
      ),
    ).toEqual([
      { start: 0, end: 0 },
      { start: 1, end: 2 },
    ]);
  });

  it("starts a new block after a timed pause", () => {
    expect(
      groupLyricLinesForScroll(lines([0, "First"], [2.5, "Second"])),
    ).toEqual([
      { start: 0, end: 0 },
      { start: 1, end: 1 },
    ]);
  });

  it("caps long runs so the active line stays visible", () => {
    expect(
      groupLyricLinesForScroll(
        lines([0, "One"], [0.4, "Two"], [0.8, "Three"], [1.2, "Four"]),
      ),
    ).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 3 },
    ]);
  });

  it("keeps unrelated plain lines separate", () => {
    expect(
      groupLyricLinesForScroll(lines([null, "One"], [null, "Two"])),
    ).toEqual([
      { start: 0, end: 0 },
      { start: 1, end: 1 },
    ]);
  });
});
