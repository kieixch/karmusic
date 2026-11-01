"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, FileMusic, Plus, ScrollText } from "lucide-react";
import type { Track } from "@/types/track";
import { usePlayer, usePlaybackClock } from "@/components/providers/PlayerProvider";
import { useLyrics } from "@/hooks/useLyrics";
import { useSettings } from "@/components/providers/SettingsProvider";
import { LyricsEditorDialog } from "./LyricsEditorDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface LyricsPanelProps {
  track: Track;
  variant?: "overlay" | "embedded";
  className?: string;
  onRequestCloseEditor?: () => void;
}

export function LyricsPanel({ track, variant = "embedded", className }: LyricsPanelProps) {
  const { settings } = useSettings();
  const { currentTrack, seek, isPlaying } = usePlayer();
  const { currentTime } = usePlaybackClock();
  const [editorOpen, setEditorOpen] = useState(false);
  const [following, setFollowing] = useState(true);
  const [userBrowsing, setUserBrowsing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const doesMatchCurrent = currentTrack?.id === track.id;
  const time = doesMatchCurrent ? currentTime : 0;
  const lyrics = useLyrics(track.id, time);
  const displayRecord = lyrics.record;
  const displayActive = lyrics.activeIndex;
  const timed = lyrics.timed;
  const autoScroll = settings.lyricsAutoScroll && !settings.reduceMotion;
  const isOverlay = variant === "overlay";

  useEffect(() => {
    setFollowing(true);
    setUserBrowsing(false);
  }, [track.id]);

  useEffect(() => {
    if (!autoScroll || !following || displayActive < 0) return;
    const container = scrollRef.current;
    if (!container) return;
    const line = container.querySelector<HTMLElement>(`[data-line-index="${displayActive}"]`);
    if (!line) return;
    const target = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
    programmatic.current = true;
    container.scrollTo({ top: Math.max(0, target), behavior: settings.reduceMotion ? "auto" : "smooth" });
    const timer = window.setTimeout(() => {
      programmatic.current = false;
    }, 550);
    return () => window.clearTimeout(timer);
  }, [displayActive, autoScroll, following, settings.reduceMotion, track.id]);

  const stopFollowing = useCallback(() => {
    if (programmatic.current) return;
    setUserBrowsing(true);
    setFollowing(false);
  }, []);

  const resumeFollowing = useCallback(() => {
    setFollowing(true);
    setUserBrowsing(false);
    const container = scrollRef.current;
    if (!container || displayActive < 0) return;
    const line = container.querySelector<HTMLElement>(`[data-line-index="${displayActive}"]`);
    if (!line) return;
    container.scrollTo({
      top: Math.max(0, line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2),
      behavior: settings.reduceMotion ? "auto" : "smooth",
    });
  }, [displayActive, settings.reduceMotion]);

  if (!displayRecord || !displayRecord.lines.length) {
    return (
      <div className={cn("flex min-h-0 flex-1 items-center justify-center", className)}>
        <EmptyState
          icon={<FileMusic className="size-5" aria-hidden />}
          title="No lyrics yet"
          description="Add an LRC file you have the rights to use, or paste lyrics manually. Lyrics stay on this device."
          action={
            <Button size="sm" onClick={() => setEditorOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Add lyrics
            </Button>
          }
          className="w-full max-w-md border-white/10 bg-white/[0.02]"
        />
        <LyricsEditorDialog track={track} open={editorOpen} onClose={() => setEditorOpen(false)} />
      </div>
    );
  }

  const lines = displayRecord.lines;
  const beforeFirst = timed && displayActive < 0 && lines[0]?.time != null;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "lyrics-scroll relative flex-1 overflow-y-auto overscroll-contain",
          isOverlay ? "px-3 sm:px-6" : "max-h-[52vh] px-1",
        )}
        onWheel={stopFollowing}
        onTouchMove={stopFollowing}
        onPointerDown={stopFollowing}
        aria-label={`Lyrics for ${track.title}`}
        tabIndex={0}
        role="region"
      >
        <div
          className={cn("mx-auto flex max-w-3xl flex-col", isOverlay ? "py-[38vh]" : "py-10")}
          style={{ gap: `${settings.lyricsLineSpacing * 0.5}rem` }}
        >
          {lines.map((line, index) => {
            const isActive = index === displayActive;
            const distance = displayActive < 0 ? 99 : Math.abs(index - displayActive);
            const isNear = distance <= 2;
            return (
              <button
                key={`${line.time ?? "plain"}-${index}`}
                type="button"
                data-line-index={index}
                onClick={() => {
                  setFollowing(true);
                  setUserBrowsing(false);
                  if (line.time != null) seek(Math.max(0, line.time + (displayRecord.offsetMs ?? 0) / 1000));
                }}
                className={cn(
                  "focus-ring group relative rounded-lg px-2 text-left transition-all duration-300",
                  timed ? "cursor-pointer" : "cursor-default",
                  line.time == null && "py-1",
                  isActive ? "text-white" : isNear ? "text-white/45 hover:text-white/70" : "text-white/25 hover:text-white/50",
                  isOverlay ? "lyrics-text-shadow" : "",
                )}
                style={{
                  fontSize: isActive
                    ? `clamp(${Math.round(settings.lyricsFontSize * 0.8)}px, ${settings.lyricsFontSize / 12}vw, ${settings.lyricsFontSize}px)`
                    : `clamp(${Math.round(settings.lyricsFontSize * 0.62)}px, ${(settings.lyricsFontSize * 0.075) / 1}vw, ${Math.round(settings.lyricsFontSize * 0.72)}px)`,
                  lineHeight: settings.lyricsLineSpacing,
                  fontWeight: isActive ? 700 : 500,
                  opacity: isActive ? 1 : undefined,
                }}
                aria-current={isActive ? "true" : undefined}
              >
                {isActive ? (
                  <span className="absolute -left-1 top-1/2 hidden h-[1.1em] w-0.5 -translate-y-1/2 rounded-full bg-accent sm:block" aria-hidden />
                ) : null}
                {line.text || "♪"}
                {line.time != null && isOverlay ? (
                  <span className="ml-2 align-middle font-mono text-[10px] font-normal text-white/20 opacity-0 transition group-hover:opacity-100">
                    {formatTime(line.time + (displayRecord.offsetMs ?? 0) / 1000)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {timed ? (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent",
              isOverlay ? "h-24" : "h-10",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent",
              isOverlay ? "h-24" : "h-10",
            )}
          />
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex justify-center">
        {beforeFirst && following && isPlaying ? (
          <span className="pointer-events-none rounded-full bg-black/60 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
            Lyrics start in {formatTime((lines[0].time ?? 0) - (time - (displayRecord.offsetMs ?? 0) / 1000))}
          </span>
        ) : !following ? (
          <button
            type="button"
            onClick={resumeFollowing}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-soft backdrop-blur transition hover:bg-black/85 focus-ring"
          >
            <ChevronUp className="size-3.5" aria-hidden />
            Follow lyrics
          </button>
        ) : null}
      </div>

      {userBrowsing && !following ? (
        <p className="sr-only" aria-live="polite">
          Automatic lyric scrolling paused.
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/30">
        <span className="inline-flex items-center gap-1">
          <ScrollText className="size-3" aria-hidden />
          {displayRecord.format === "lrc" ? "Synced LRC" : "Plain lyrics"}
          {displayRecord.offsetMs ? ` · ${(displayRecord.offsetMs / 1000).toFixed(1)}s offset` : ""}
        </span>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="focus-ring rounded underline decoration-white/20 underline-offset-2 hover:text-white/70"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="focus-ring rounded underline decoration-white/20 underline-offset-2 hover:text-white/70"
        >
          Replace
        </button>
      </div>

      <LyricsEditorDialog track={track} open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
