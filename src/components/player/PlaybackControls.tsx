"use client";

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { IconButton } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

export function PlaybackControls({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isBuffering,
    shuffle,
    repeatMode,
    togglePlay,
    next,
    previous,
    setShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const disabled = !currentTrack;

  return (
    <div className={cn("flex items-center justify-center gap-1 sm:gap-2", className)}>
      {!compact ? (
        <IconButton
          label={shuffle ? "Turn shuffle off" : "Turn shuffle on"}
          size={compact ? "sm" : "md"}
          active={shuffle}
          onClick={() => setShuffle(!shuffle)}
          disabled={!currentTrack}
        >
          <Shuffle aria-hidden />
        </IconButton>
      ) : null}
      <IconButton
        label="Previous track"
        size={compact ? "md" : "lg"}
        onClick={previous}
        disabled={disabled}
      >
        <SkipBack className="fill-current" aria-hidden />
      </IconButton>
      <button
        type="button"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "focus-ring relative flex shrink-0 items-center justify-center rounded-full bg-accent text-black transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40",
          compact ? "size-12" : "size-14 sm:size-16",
        )}
      >
        {isLoading || isBuffering ? (
          <Spinner className="text-black/70" label={isLoading ? "Loading track" : "Buffering"} />
        ) : isPlaying ? (
          <Pause className={compact ? "size-5 fill-current" : "size-6 fill-current"} aria-hidden />
        ) : (
          <Play className={cn("translate-x-0.5 fill-current", compact ? "size-5" : "size-6")} aria-hidden />
        )}
      </button>
      <IconButton
        label="Next track"
        size={compact ? "md" : "lg"}
        onClick={next}
        disabled={disabled}
      >
        <SkipForward className="fill-current" aria-hidden />
      </IconButton>
      {!compact ? (
        <IconButton
          label={
            repeatMode === "off"
              ? "Repeat off"
              : repeatMode === "all"
                ? "Repeat all"
                : "Repeat one"
          }
          size="md"
          active={repeatMode !== "off"}
          onClick={cycleRepeatMode}
          disabled={!currentTrack}
        >
          {repeatMode === "one" ? <Repeat1 aria-hidden /> : <Repeat aria-hidden />}
        </IconButton>
      ) : null}
    </div>
  );
}
