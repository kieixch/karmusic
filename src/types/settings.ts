export type ThemePreference = "dark" | "oled";
export type LyricsViewMode = "full" | "minimal";

export interface UserSettings {
  theme: ThemePreference;
  lyricsFontSize: number;
  lyricsLineSpacing: number;
  lyricsDim: number;
  lyricsAutoScroll: boolean;
  lyricsMode: LyricsViewMode;
  reduceMotion: boolean;
  defaultVolume: number;
  playbackRate: number;
  ambientMode: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  lyricsFontSize: 34,
  lyricsLineSpacing: 1.55,
  lyricsDim: 0.55,
  lyricsAutoScroll: true,
  lyricsMode: "full",
  reduceMotion: false,
  defaultVolume: 0.85,
  playbackRate: 1,
  ambientMode: true,
};

export function sanitizeSettings(input: unknown): UserSettings {
  if (!input || typeof input !== "object") return { ...DEFAULT_SETTINGS };
  const value = input as Partial<Record<keyof UserSettings, unknown>>;
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.min(max, Math.max(min, n))
      : fallback;

  return {
    theme: value.theme === "oled" ? "oled" : "dark",
    lyricsFontSize: Math.round(clamp(value.lyricsFontSize, 16, 72, DEFAULT_SETTINGS.lyricsFontSize)),
    lyricsLineSpacing: Number(clamp(value.lyricsLineSpacing, 1, 3, DEFAULT_SETTINGS.lyricsLineSpacing).toFixed(2)),
    lyricsDim: clamp(value.lyricsDim, 0, 0.92, DEFAULT_SETTINGS.lyricsDim),
    lyricsAutoScroll:
      typeof value.lyricsAutoScroll === "boolean"
        ? value.lyricsAutoScroll
        : DEFAULT_SETTINGS.lyricsAutoScroll,
    lyricsMode: value.lyricsMode === "minimal" ? "minimal" : "full",
    reduceMotion: value.reduceMotion === true,
    defaultVolume: clamp(value.defaultVolume, 0, 1, DEFAULT_SETTINGS.defaultVolume),
    playbackRate: [0.75, 1, 1.25, 1.5, 2].includes(value.playbackRate as number)
      ? (value.playbackRate as number)
      : 1,
    ambientMode:
      typeof value.ambientMode === "boolean"
        ? value.ambientMode
        : DEFAULT_SETTINGS.ambientMode,
  };
}
