import type { LyricLine } from "@/types/lyrics";

/**
 * Return the index of the latest timestamped line at or before `time`.
 * Returns -1 when playback is before the first line or no timed lines exist.
 * Uses binary search so long lyric files stay cheap to render at 4–10 Hz.
 */
export function findActiveLine(
  lines: readonly LyricLine[],
  time: number,
  offsetMs = 0,
): number {
  if (!lines.length || !Number.isFinite(time)) return -1;
  const target = time - offsetMs / 1000;

  if (lines.some((line) => line.time === null)) {
    let result = -1;
    let best = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < lines.length; index++) {
      const lineTime = lines[index].time;
      if (lineTime !== null && lineTime <= target && lineTime >= best) {
        best = lineTime;
        result = index;
      }
    }
    return result;
  }

  let low = 0;
  let high = lines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const lineTime = lines[mid].time;
    if (lineTime !== null && lineTime <= target) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result;
}

export function applyOffset(lines: readonly LyricLine[], offsetMs: number): LyricLine[] {
  if (!offsetMs) return [...lines];
  return lines.map((line) => ({
    ...line,
    time: line.time === null ? null : Math.max(0, line.time + offsetMs / 1000),
  }));
}

export function isTimed(lines: readonly LyricLine[]): boolean {
  return lines.some((line) => line.time !== null);
}
