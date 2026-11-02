"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, FileMusic, Plus, ScrollText } from "lucide-react";
import type { Track } from "@/types/track";
import { usePlayer, usePlaybackClock } from "@/components/providers/PlayerProvider";
import { useLyrics } from "@/hooks/useLyrics";
import { useSettings } from "@/components/providers/SettingsProvider";
import { LyricsEditorDialog } from "./LyricsEditorDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { clamp, formatTime } from "@/lib/utils/format";
import { groupLyricLinesForScroll } from "@/lib/lyrics/scrollGroups";
import { cn } from "@/lib/utils/cn";

interface LyricsPanelProps {
  track: Track;
  variant?: "overlay" | "embedded";
  className?: string;
  hideMeta?: boolean;
  onRequestCloseEditor?: () => void;
}

export function LyricsPanel({
  track,
  variant = "embedded",
  className,
  hideMeta = false,
}: LyricsPanelProps) {
  const { settings, updateSettings } = useSettings();
  const { currentTrack, seek, isPlaying } = usePlayer();
  const { currentTime } = usePlaybackClock();
  const [editorOpen, setEditorOpen] = useState(false);
  const [following, setFollowing] = useState(true);
  const [userBrowsing, setUserBrowsing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const doesMatchCurrent = currentTrack?.id === track.id;
  const time = doesMatchCurrent ? currentTime : 0;
  const lyrics = useLyrics(track.id, time);
  const displayRecord = lyrics.record;
  const displayActive = lyrics.activeIndex;
  const timed = lyrics.timed;
  const autoScroll = settings.lyricsAutoScroll && !settings.reduceMotion;
  const isOverlay = variant === "overlay";
  const lines = useMemo(() => displayRecord?.lines ?? [], [displayRecord]);
  const scrollGroups = useMemo(() => groupLyricLinesForScroll(lines), [lines]);
  const activeScrollGroup =
    displayActive >= 0
      ? scrollGroups.find(
          (group) => displayActive >= group.start && displayActive <= group.end,
        )
      : undefined;

  useEffect(() => {
    setFollowing(true);
    setUserBrowsing(false);
  }, [track.id]);

  const commitContentTransform = useCallback(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const transform = getComputedStyle(content).transform;
    const offset = transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m42 : 0;
    if (Math.abs(offset) >= 0.5) {
      container.scrollTop = Math.max(0, container.scrollTop - offset);
    }
    content.style.transition = "none";
    content.style.transform = "";
    content.style.willChange = "";
  }, []);

  useEffect(() => {
    if (!autoScroll || !following || !activeScrollGroup) return;
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const firstLine = container.querySelector<HTMLElement>(
      `[data-line-index="${activeScrollGroup.start}"]`,
    );
    if (!firstLine) return;
    const lastLine =
      container.querySelector<HTMLElement>(
        `[data-line-index="${activeScrollGroup.end}"]`,
      ) ?? firstLine;

    const groupCenter =
      (firstLine.offsetTop + lastLine.offsetTop + lastLine.offsetHeight) / 2;
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const target = Math.min(
      maxScroll,
      Math.max(0, groupCenter - container.clientHeight / 2),
    );
    const start = container.scrollTop;
    const distance = target - start;

    if (settings.reduceMotion || Math.abs(distance) < 1) {
      commitContentTransform();
      container.scrollTop = target;
      return;
    }

    const duration = Math.min(1000, Math.max(560, 450 + Math.abs(distance) * 0.75));
    let frame = 0;
    let finished = false;
    content.style.transition = "none";
    content.style.transform = `translate3d(0, ${distance}px, 0)`;
    content.style.willChange = "transform";
    container.scrollTop = target;

    const finish = () => {
      if (finished) return;
      finished = true;
      content.style.transition = "none";
      content.style.transform = "";
      content.style.willChange = "";
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === content && event.propertyName === "transform") {
        finish();
      }
    };

    content.addEventListener("transitionend", onTransitionEnd);
    frame = requestAnimationFrame(() => {
      content.style.transition = `transform ${duration}ms cubic-bezier(0.65, 0, 0.35, 1)`;
      content.style.transform = "translate3d(0, 0, 0)";
    });

    return () => {
      cancelAnimationFrame(frame);
      content.removeEventListener("transitionend", onTransitionEnd);
      if (finished) {
        content.style.transform = "";
        content.style.willChange = "";
      } else {
        commitContentTransform();
      }
    };
  }, [
    activeScrollGroup,
    autoScroll,
    following,
    settings.lyricsFontSize,
    settings.lyricsLineSpacing,
    settings.reduceMotion,
    track.id,
    commitContentTransform,
  ]);

  const stopFollowing = useCallback(() => {
    setUserBrowsing(true);
    setFollowing(false);
  }, []);

  const resumeFollowing = useCallback(() => {
    setFollowing(true);
    setUserBrowsing(false);
  }, []);

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

  const beforeFirst = timed && displayActive < 0 && lines[0]?.time != null;
  const activeFontSize = `clamp(${Math.round(settings.lyricsFontSize * 0.8)}px, ${settings.lyricsFontSize / 12}vw, ${settings.lyricsFontSize}px)`;
  const baseLineHeight = Math.max(1.15, settings.lyricsLineSpacing * 0.72);

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
          ref={contentRef}
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
                  "focus-ring group relative rounded-lg px-2 text-left transition-[color,opacity,text-shadow] duration-500 ease-out",
                  timed ? "cursor-pointer" : "cursor-default",
                  line.time == null && "py-1",
                  isActive ? "text-white" : isNear ? "text-white/45 hover:text-white/70" : "text-white/25 hover:text-white/50",
                  isOverlay ? "lyrics-text-shadow" : "",
                )}
                style={{
                  fontSize: activeFontSize,
                  lineHeight: baseLineHeight,
                  fontWeight: 600,
                  opacity: isActive ? 1 : undefined,
                }}
                aria-current={isActive ? "true" : undefined}
              >
                {isActive ? (
                  <span className="absolute -left-1 top-1/2 hidden h-[1.1em] w-0.5 -translate-y-1/2 rounded-full bg-accent sm:block" aria-hidden />
                ) : null}
                <span
                  className="inline-block origin-left transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `scale(${isActive ? 1 : 0.75})` }}
                >
                  {line.text || "♪"}
                  {line.time != null && isOverlay ? (
                    <span className="ml-2 align-middle font-mono text-[10px] font-normal text-white/20 opacity-0 transition group-hover:opacity-100">
                      {formatTime(line.time + (displayRecord.offsetMs ?? 0) / 1000)}
                    </span>
                  ) : null}
                </span>
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

      {!hideMeta ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/30">
        <span className="inline-flex items-center gap-1">
          <ScrollText className="size-3" aria-hidden />
          {displayRecord.format === "lrc" ? "Synced LRC" : "Plain lyrics"}
          {displayRecord.offsetMs ? ` · ${(displayRecord.offsetMs / 1000).toFixed(1)}s offset` : ""}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-1.5 py-0.5">
          <button
            type="button"
            onClick={() =>
              updateSettings({ lyricsFontSize: clamp(settings.lyricsFontSize - 2, 16, 72) })
            }
            aria-label="Decrease lyric font size"
            className="focus-ring rounded px-1 leading-none hover:text-white/70"
          >
            A−
          </button>
          <span className="font-mono tabular-nums">{settings.lyricsFontSize}px</span>
          <button
            type="button"
            onClick={() =>
              updateSettings({ lyricsFontSize: clamp(settings.lyricsFontSize + 2, 16, 72) })
            }
            aria-label="Increase lyric font size"
            className="focus-ring rounded px-1 leading-none hover:text-white/70"
          >
            A+
          </button>
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
      ) : null}

      <LyricsEditorDialog track={track} open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
