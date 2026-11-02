import type { LyricLine } from "@/types/lyrics";

export interface LyricScrollGroup {
  start: number;
  end: number;
}

const SENTENCE_END = /[.!?…]["'”’)\]]*$/u;
const NEW_SENTENCE_GAP_SECONDS = 1.5;
const MAX_GROUP_LINES = 3;
const MAX_GROUP_SECONDS = 12;

export function groupLyricLinesForScroll(
  lines: readonly LyricLine[],
): LyricScrollGroup[] {
  const groups: LyricScrollGroup[] = [];
  let current: LyricScrollGroup | null = null;
  let groupStartTime: number | null = null;
  let previousTime: number | null = null;
  let previousText = "";

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineTime = line.time;
    const gap =
      lineTime !== null && previousTime !== null ? lineTime - previousTime : null;
    const groupDuration =
      lineTime !== null && groupStartTime !== null
        ? lineTime - groupStartTime
        : null;

    const startsNewGroup =
      !current ||
      lineTime === null ||
      groupStartTime === null ||
      !line.text.trim() ||
      current.end - current.start + 1 >= MAX_GROUP_LINES ||
      (gap !== null && gap >= NEW_SENTENCE_GAP_SECONDS) ||
      (groupDuration !== null && groupDuration >= MAX_GROUP_SECONDS) ||
      SENTENCE_END.test(previousText);

    if (startsNewGroup) {
      const nextGroup = { start: index, end: index };
      current = nextGroup;
      groups.push(nextGroup);
      groupStartTime = lineTime;
    } else if (current) {
      current.end = index;
    }

    previousTime = lineTime;
    previousText = line.text;
  }

  return groups;
}
