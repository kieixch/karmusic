"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { usePlayer, usePlaybackClock } from "@/components/providers/PlayerProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { LyricsPanel } from "./LyricsPanel";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { SeekBar } from "@/components/player/SeekBar";
import { PlaybackControls } from "@/components/player/PlaybackControls";
import { VolumeControl } from "@/components/player/VolumeControl";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils/cn";

export function LyricsModeOverlay() {
  const {
    open,
    closeLyricsMode,
    orientation,
    isPortrait,
    isFullscreen,
    orientationNote,
    orientationLocked,
    toggleFullscreen,
  } = useLyricsMode();
  const { currentTrack, isPlaying } = usePlayer();
  const { duration } = usePlaybackClock();
  const { settings, updateSettings } = useSettings();
  const { getLyrics, setLyricsOffset } = useLibrary();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setChromeHidden(false);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLyricsMode();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 100);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, closeLyricsMode]);

  if (!open) return null;

  const record = currentTrack ? getLyrics(currentTrack.id) : undefined;
  const minimal = settings.lyricsMode === "minimal";
  const landscape = orientation === "landscape";
  const dim = Math.min(0.92, Math.max(0, settings.lyricsDim));
  const artworkUrl = currentTrack?.artworkUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lyrics Mode"
      data-orientation={orientation}
      className="fixed inset-0 z-[75] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#050607] text-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt=""
            className="size-full scale-110 transform-gpu object-cover opacity-40 blur-3xl"
          />
        ) : (
          <div className="size-full bg-[radial-gradient(ellipse_at_top,rgba(200,255,77,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(120,90,255,0.10),transparent_55%)]" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${0.45 + dim * 0.5})` }} />
      </div>

      {!chromeHidden ? (
        <header className="safe-top relative z-20 flex shrink-0 items-center gap-2 px-2 py-2 sm:px-4">
          <IconButton ref={closeRef} label="Exit Lyrics Mode" size="md" onClick={closeLyricsMode}>
            <ChevronDown aria-hidden />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack?.title ?? "Lyrics Mode"}
            </p>
            <p className="truncate text-xs text-white/50">
              {currentTrack?.artist ?? "Play a track to see lyrics"}
              {record?.format === "lrc" ? " · synced" : ""}
            </p>
          </div>
          {currentTrack && !isPortrait ? (
            <Badge tone={currentTrack.source === "local" ? "local" : "online"} className="hidden sm:inline-flex">
              {currentTrack.source === "local" ? "Local" : currentTrack.provider === "freetouse" ? "Free To Use" : "Jamendo"}
            </Badge>
          ) : null}
          <IconButton
            label="Hide lyrics controls"
            size="md"
            onClick={() => setChromeHidden(true)}
          >
            <EyeOff aria-hidden />
          </IconButton>
          <IconButton
            label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            size="md"
            onClick={toggleFullscreen}
            active={isFullscreen}
          >
            {isFullscreen ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
          </IconButton>
          <IconButton
            label="Lyrics display settings"
            size="md"
            onClick={() => setSettingsOpen(true)}
          >
            <SlidersHorizontal aria-hidden />
          </IconButton>
        </header>
      ) : null}

      {!chromeHidden && isPortrait && !minimal && !hintDismissed ? (
        <div className="relative z-20 mx-3 mb-1 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.08] px-3 py-2 text-xs text-accent-soft sm:mx-4">
          <RotateCcw className="size-4 shrink-0 animate-[spin_5s_linear_infinite]" aria-hidden />
          <span className="flex-1">
            Rotate your phone to landscape for a full-screen lyric experience. Playback keeps
            working while you rotate.
          </span>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            aria-label="Dismiss rotate hint"
            className="focus-ring rounded-full p-1 text-accent/60 hover:text-accent"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {!chromeHidden && orientationNote && !orientationLocked && !isPortrait ? (
        <p className="relative z-20 px-4 pb-1 text-center text-[11px] text-white/35">{orientationNote}</p>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 gap-2 px-2 sm:gap-6 sm:px-5",
          landscape ? "flex-row" : "flex-col",
        )}
      >
        {currentTrack ? (
          <>
            {!chromeHidden && !minimal && landscape ? (
              <aside className="hidden w-[clamp(110px,19vw,250px)] shrink-0 flex-col items-center justify-center sm:flex">
                <AlbumArt
                  id={currentTrack.id}
                  title={currentTrack.title}
                  artworkUrl={currentTrack.artworkUrl}
                  className="aspect-square w-full shadow-soft"
                  rounded="rounded-2xl"
                  iconSize="size-10"
                />
                <div className="mt-4 w-full text-center">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{currentTrack.title}</p>
                  <p className="mt-0.5 truncate text-xs text-white/50">{currentTrack.artist}</p>
                  {currentTrack.album ? (
                    <p className="mt-0.5 truncate text-[11px] text-white/30">{currentTrack.album}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    <Badge tone={currentTrack.source === "local" ? "local" : "online"}>
                      {currentTrack.source === "local" ? "Local file" : currentTrack.provider === "freetouse" ? "Free To Use" : "Jamendo"}
                    </Badge>
                    {currentTrack.licenseName ? (
                      <span className="text-[10px] text-white/30">{currentTrack.licenseName}</span>
                    ) : null}
                  </div>
                  {currentTrack.licenseUrl ? (
                    <a
                      href={currentTrack.licenseUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring mt-2 inline-block rounded text-[10px] text-white/35 underline decoration-white/15 underline-offset-2 hover:text-white/70"
                    >
                      License details
                    </a>
                  ) : null}
                </div>
              </aside>
            ) : null}
            <div className={cn("flex min-h-0 flex-1 flex-col", !landscape && "justify-center")}>
              <LyricsPanel track={currentTrack} variant="overlay" hideMeta={chromeHidden} />
              {!record ? null : null}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold">Nothing is playing</p>
            <p className="max-w-sm text-sm text-white/45">
              Choose a track from the online catalog or import your own audio, then open Lyrics
              Mode again.
            </p>
            <Button variant="secondary" onClick={closeLyricsMode}>
              Back to music
            </Button>
          </div>
        )}
      </div>

      {chromeHidden ? (
        <IconButton
          label="Show lyrics controls"
          size="sm"
          onClick={() => setChromeHidden(false)}
          className="absolute right-3 top-3 z-30 border border-white/10 bg-black/50 text-white/50 opacity-50 backdrop-blur transition hover:bg-black/75 hover:text-white hover:opacity-100 focus-visible:opacity-100"
        >
          <Eye aria-hidden />
        </IconButton>
      ) : null}

      {!chromeHidden ? (
        <footer className="safe-bottom relative z-20 shrink-0 border-t border-white/[0.06] bg-black/30 px-3 pb-2 pt-2 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-1.5">
            <SeekBar compact={isPortrait} showTimes={!isPortrait} />
            <div className="flex items-center justify-between gap-2">
              <div className="hidden w-28 sm:block">
                {!minimal ? <VolumeControl /> : null}
              </div>
              <PlaybackControls compact={minimal || isPortrait} />
              <div className="hidden w-28 justify-end text-right sm:flex">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] text-white/35 transition hover:text-white/70"
                >
                  <Settings2 className="size-3.5" aria-hidden />
                  Display
                </button>
              </div>
            </div>
            {isPlaying && duration > 0 ? (
              <p className="text-center text-[10px] tabular-nums text-white/25">
                {Math.round((duration || 0) / 60)} min track
              </p>
            ) : null}
          </div>
        </footer>
      ) : null}

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Lyrics display"
        description="These preferences are saved on this device."
        size="sm"
        footer={
          <>
            {!isFullscreen ? (
              <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="size-4" aria-hidden />
                Enter fullscreen
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setSettingsOpen(false)}>
              Done
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Segmented
            label="View"
            options={[
              { value: "full", label: "Full" },
              { value: "minimal", label: "Minimal" },
            ]}
            value={settings.lyricsMode}
            onChange={(value) => updateSettings({ lyricsMode: value as "full" | "minimal" })}
          />
          <SliderRow
            label="Font size"
            value={settings.lyricsFontSize}
            min={16}
            max={72}
            step={1}
            suffix="px"
            onChange={(value) => updateSettings({ lyricsFontSize: value })}
          />
          <SliderRow
            label="Line spacing"
            value={settings.lyricsLineSpacing}
            min={1}
            max={3}
            step={0.05}
            suffix="×"
            onChange={(value) => updateSettings({ lyricsLineSpacing: value })}
          />
          <SliderRow
            label="Background dim"
            value={Math.round(settings.lyricsDim * 100)}
            min={0}
            max={92}
            step={1}
            suffix="%"
            onChange={(value) => updateSettings({ lyricsDim: value / 100 })}
          />
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Automatic scrolling
              <span className="mt-0.5 block text-xs text-white/40">
                Pauses when you browse lyrics manually.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.lyricsAutoScroll}
              onClick={() => updateSettings({ lyricsAutoScroll: !settings.lyricsAutoScroll })}
              className={cn(
                "focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors",
                settings.lyricsAutoScroll ? "bg-accent" : "bg-white/20",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute left-0 top-0.5 size-5 rounded-full bg-white transition-transform",
                  settings.lyricsAutoScroll ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </label>

          {record && record.format === "lrc" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span>
                  Lyric timing offset
                  <span className="mt-0.5 block text-xs text-white/40">Positive values delay lyrics.</span>
                </span>
                <span className="font-mono text-xs text-accent">
                  {(record.offsetMs / 1000 >= 0 ? "+" : "") + (record.offsetMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setLyricsOffset(record.trackId, record.offsetMs - 500)}
                >
                  −0.5s
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setLyricsOffset(record.trackId, 0)}
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setLyricsOffset(record.trackId, record.offsetMs + 500)}
                >
                  +0.5s
                </Button>
              </div>
            </div>
          ) : null}

          {orientationNote ? (
            <p className="rounded-lg bg-white/[0.04] p-2.5 text-xs leading-relaxed text-white/45">
              {orientationNote}
            </p>
          ) : null}
          <p className="text-[11px] leading-relaxed text-white/30">
            Fullscreen and orientation requests are progressive enhancements. If they are blocked,
            rotate your device manually and use the browser&apos;s own fullscreen control.
          </p>
        </div>
      </Dialog>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm">
        {label}
        <span className="font-mono text-xs text-white/45">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-accent"
      />
    </label>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm">{label}</span>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              "focus-ring flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
              value === option.value
                ? "bg-white/10 text-white"
                : "text-white/45 hover:text-white/75",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
