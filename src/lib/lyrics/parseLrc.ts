import type { LyricLine, LyricsMeta, ParsedLyrics } from "@/types/lyrics";

const TIMESTAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const META_TAG = /^\[([a-zA-Z]+):(.*)\]$/;
const META_KEYS: Record<string, keyof LyricsMeta> = {
  ti: "title",
  ar: "artist",
  al: "album",
  by: "by",
  offset: "offsetMs",
};

/** Parse an LRC timestamp into seconds. Returns null for malformed values. */
export function parseLrcTimestamp(minutes: string | number, seconds: string | number, fraction?: string): number | null {
  const m = Number(minutes);
  const s = Number(seconds);
  const f = fraction ? Number(fraction.padEnd(3, "0").slice(0, 3)) / 1000 : 0;
  if (!Number.isFinite(m) || !Number.isFinite(s) || !Number.isFinite(f)) return null;
  if (m < 0 || s < 0 || s >= 60) return null;
  return m * 60 + s + f;
}

/**
 * Parse LRC or plain text. Handles multiple timestamps per line, metadata
 * tags, malformed lines and unsynchronised lyrics.
 */
export function parseLyrics(raw: string): ParsedLyrics {
  const text = (raw ?? "").replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const meta: LyricsMeta = {};
  const timed: LyricLine[] = [];
  const plain: LyricLine[] = [];
  let sawTimestamp = false;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const metaMatch = line.match(META_TAG);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const mapped = META_KEYS[key];
      if (mapped === "offsetMs") {
        const parsed = Number(metaMatch[2].trim());
        if (Number.isFinite(parsed)) meta.offsetMs = parsed;
      } else if (mapped) {
        meta[mapped] = metaMatch[2].trim();
      }
      continue;
    }

    const timestamps: number[] = [];
    TIMESTAMP.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TIMESTAMP.exec(line)) !== null) {
      const seconds = parseLrcTimestamp(match[1], match[2], match[3]);
      if (seconds !== null) timestamps.push(seconds);
    }

    if (timestamps.length === 0) {
      if (line.startsWith("[") && line.endsWith("]")) continue;
      plain.push({ time: null, text: line });
      continue;
    }

    sawTimestamp = true;
    const content = line.replace(TIMESTAMP, "").trim();
    for (const time of timestamps) {
      timed.push({ time, text: content });
    }
  }

  if (!sawTimestamp) {
    return { format: "plain", lines: mergePlain(plain), meta };
  }

  timed.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  return { format: "lrc", lines: timed, meta };
}

function mergePlain(lines: LyricLine[]): LyricLine[] {
  return lines.filter((line) => line.text.trim().length > 0);
}

export function parseLrc(raw: string): ParsedLyrics {
  return parseLyrics(raw);
}

export function serializePlainLyrics(lines: LyricLine[]): string {
  return lines.map((line) => line.text).join("\n");
}
