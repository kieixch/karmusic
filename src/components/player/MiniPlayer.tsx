"use client";

import Link from "next/link";
import { Pause, Play, ScrollText, SkipForward } from "lucide-react";
import { usePlayer, usePlaybackClock } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { IconButton } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    togglePlay,
    next,
    queueIndex,
    queue,
  } = usePlayer();
  const { currentTime, duration } = usePlaybackClock();
  const { openLyricsMode } = useLyricsMode();

  if (!currentTrack) return null;
  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(56px+var(--safe-bottom))] z-40 px-2 pb-1.5 lg:bottom-0 lg:left-[260px] lg:px-3 lg:pb-3">
      <div className="pointer-events-auto relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 shadow-soft backdrop-blur-xl">
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-white/10"
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex items-center gap-2 p-2 pr-2.5 sm:gap-3 sm:p-2.5">
          <Link
            href="/now-playing"
            className="focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-0.5"
            aria-label="Open Now Playing"
          >
            <AlbumArt
              id={currentTrack.id}
              title={currentTrack.title}
              artworkUrl={currentTrack.artworkUrl}
              className="size-11"
              rounded="rounded-lg"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
              <p className="truncate text-xs text-white/50">{currentTrack.artist}</p>
            </div>
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <IconButton
              label={isPlaying ? "Pause" : "Play"}
              size="md"
              onClick={togglePlay}
              className="bg-white/[0.06]"
            >
              {isLoading || isBuffering ? (
                <Spinner label="Loading" />
              ) : isPlaying ? (
                <Pause className="fill-current" aria-hidden />
              ) : (
                <Play className="fill-current" aria-hidden />
              )}
            </IconButton>
            <IconButton label="Next track" size="md" onClick={next} disabled={queue.length < 2}>
              <SkipForward className="fill-current" aria-hidden />
            </IconButton>
            <IconButton
              label="Open Lyrics Mode"
              size="md"
              onClick={() => openLyricsMode({ immersive: true })}
              className={cn(queueIndex >= 0 && "text-accent/80")}
            >
              <ScrollText aria-hidden />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
