"use client";

import { useMemo } from "react";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { findActiveLine, isTimed } from "@/lib/lyrics/activeLine";
import type { LyricsRecord } from "@/types/lyrics";

export interface UseLyricsResult {
  record: LyricsRecord | undefined;
  activeIndex: number;
  timed: boolean;
  hasLyrics: boolean;
}

export function useLyrics(trackId: string | null | undefined, currentTime: number): UseLyricsResult {
  const { getLyrics } = useLibrary();
  const record = trackId ? getLyrics(trackId) : undefined;

  return useMemo(() => {
    if (!record) {
      return { record: undefined, activeIndex: -1, timed: false, hasLyrics: false };
    }
    const timed = isTimed(record.lines);
    return {
      record,
      timed,
      hasLyrics: record.lines.length > 0,
      activeIndex: timed ? findActiveLine(record.lines, currentTime, record.offsetMs) : -1,
    };
  }, [record, currentTime]);
}
