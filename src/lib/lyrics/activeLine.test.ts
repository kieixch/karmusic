import { describe, expect, it } from "vitest";
import type { LyricLine } from "@/types/lyrics";
import { applyOffset, findActiveLine, isTimed } from "./activeLine";

const lines: LyricLine[] = [
  { time: 0, text: "zero" },
  { time: 5, text: "five" },
  { time: 10, text: "ten" },
  { time: 15, text: "fifteen" },
];

describe("findActiveLine", () => {
  it("returns -1 before the first line", () => {
    expect(findActiveLine([{ time: 3, text: "later" }], 2)).toBe(-1);
  });

  it("finds the latest line at or before the time", () => {
    expect(findActiveLine(lines, 0)).toBe(0);
    expect(findActiveLine(lines, 4.99)).toBe(0);
    expect(findActiveLine(lines, 5)).toBe(1);
    expect(findActiveLine(lines, 14.9)).toBe(2);
    expect(findActiveLine(lines, 999)).toBe(3);
  });

  it("applies a positive offset by delaying lyric times", () => {
    expect(findActiveLine(lines, 5, 1000)).toBe(0);
    expect(findActiveLine(lines, 6, 1000)).toBe(1);
  });

  it("applies a negative offset by advancing lyric times", () => {
    expect(findActiveLine(lines, 4, -1000)).toBe(1);
  });

  it("ignores unsynchronised lines when searching", () => {
    const mixed: LyricLine[] = [
      { time: null, text: "header" },
      { time: 2, text: "two" },
    ];
    expect(findActiveLine(mixed, 1)).toBe(-1);
    expect(findActiveLine(mixed, 2)).toBe(1);
    expect(findActiveLine([...mixed, { time: null, text: "footer" }], 9)).toBe(1);
  });

  it("returns -1 for empty input or non-finite time", () => {
    expect(findActiveLine([], 5)).toBe(-1);
    expect(findActiveLine(lines, Number.NaN)).toBe(-1);
  });
});

describe("applyOffset", () => {
  it("shifts timed lines and clamps at zero", () => {
    expect(applyOffset(lines, -10_000).map((line) => line.time)).toEqual([0, 0, 0, 5]);
  });

  it("leaves unsynchronised lines untouched", () => {
    expect(applyOffset([{ time: null, text: "plain" }], 5000)).toEqual([{ time: null, text: "plain" }]);
  });
});

describe("isTimed", () => {
  it("detects any timestamped line", () => {
    expect(isTimed(lines)).toBe(true);
    expect(isTimed([{ time: null, text: "plain" }])).toBe(false);
    expect(isTimed([])).toBe(false);
  });
});
