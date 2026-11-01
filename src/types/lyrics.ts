export type LyricsFormat = "lrc" | "plain";

export interface LyricLine {
  /** Absolute timestamp in seconds, or null for unsynchronised lyrics. */
  time: number | null;
  text: string;
}

export interface LyricsMeta {
  title?: string;
  artist?: string;
  album?: string;
  by?: string;
  offsetMs?: number;
}

export interface LyricsRecord {
  trackId: string;
  format: LyricsFormat;
  raw: string;
  lines: LyricLine[];
  meta: LyricsMeta;
  /** User timing adjustment in milliseconds, added to every timestamp. */
  offsetMs: number;
  updatedAt: number;
}

export interface ParsedLyrics {
  format: LyricsFormat;
  lines: LyricLine[];
  meta: LyricsMeta;
}
