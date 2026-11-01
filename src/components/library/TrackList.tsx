"use client";

import { ChevronDown, ChevronUp, Heart, Pause, Play } from "lucide-react";
import type { Track } from "@/types/track";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/Badge";
import { TrackMenu } from "@/components/player/TrackMenu";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format";

interface TrackListProps {
  tracks: Track[];
  queue?: Track[];
  showIndex?: boolean;
  playlistId?: string;
  className?: string;
  showSource?: boolean;
  onMove?: (from: number, to: number) => void;
}

export function TrackList({
  tracks,
  queue,
  showIndex = false,
  playlistId,
  className,
  showSource = true,
  onMove,
}: TrackListProps) {
  if (!tracks.length) return null;
  return (
    <ul className={cn("space-y-0.5", className)} aria-label="Tracks">
      {tracks.map((track, index) => (
        <TrackRow
          key={`${track.id}-${index}`}
          track={track}
          index={index}
          queue={queue ?? tracks}
          showIndex={showIndex}
          playlistId={playlistId}
          showSource={showSource}
          canMoveUp={Boolean(onMove) && index > 0}
          canMoveDown={Boolean(onMove) && index < tracks.length - 1}
          onMoveUp={onMove ? () => onMove(index, index - 1) : undefined}
          onMoveDown={onMove ? () => onMove(index, index + 1) : undefined}
        />
      ))}
    </ul>
  );
}

function TrackRow({
  track,
  index,
  queue,
  showIndex,
  playlistId,
  showSource,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  track: Track;
  index: number;
  queue: Track[];
  showIndex: boolean;
  playlistId?: string;
  showSource: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isFavorite } = useLibrary();
  const isCurrent = currentTrack?.id === track.id;
  const favorite = isFavorite(track.id);

  const handlePlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queue);
    }
  };

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-colors",
        isCurrent ? "bg-accent/[0.07]" : "hover:bg-white/[0.045]",
      )}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a")) return;
        handlePlay();
      }}
    >
      {showIndex ? (
        <span className="hidden w-5 shrink-0 text-center text-xs tabular-nums text-white/30 sm:block">
          {isCurrent && isPlaying ? <Equalizer /> : index + 1}
        </span>
      ) : null}
      <button
        type="button"
        onClick={handlePlay}
        aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${track.title}`}
        className="focus-ring group/art relative shrink-0 rounded-lg"
      >
        <AlbumArt
          id={track.id}
          title={track.title}
          artworkUrl={track.artworkUrl}
          className="size-12"
          rounded="rounded-lg"
        />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 text-white transition-opacity",
            isCurrent ? "opacity-100" : "opacity-0 group-hover/art:opacity-100 group-focus-visible/art:opacity-100",
          )}
        >
          {isCurrent && isPlaying ? (
            <Pause className="size-5 fill-current" aria-hidden />
          ) : (
            <Play className="size-5 fill-current" aria-hidden />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={handlePlay}
          className="focus-ring block max-w-full truncate rounded text-left text-sm font-medium text-white hover:underline"
        >
          {track.title}
        </button>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-white/45">
          <span className="truncate">{track.artist}</span>
          {showSource ? (
            <Badge
              tone={track.source === "local" ? "local" : "online"}
              className="hidden shrink-0 sm:inline-flex"
            >
              {track.source === "local" ? "Local" : track.provider === "freetouse" ? "Free To Use" : "Jamendo"}
            </Badge>
          ) : null}
        </div>
      </div>

      {favorite ? (
        <Heart className="size-3.5 shrink-0 fill-accent text-accent" aria-label="In favorites" />
      ) : null}
      {onMoveUp || onMoveDown ? (
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${track.title} up`}
            className="focus-ring rounded p-0.5 text-white/35 hover:text-white disabled:opacity-20"
          >
            <ChevronUp className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${track.title} down`}
            className="focus-ring rounded p-0.5 text-white/35 hover:text-white disabled:opacity-20"
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
      <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-white/35">
        {track.duration ? formatTime(track.duration) : "—"}
      </span>
      <TrackMenu track={track} queue={queue} playlistId={playlistId} />
    </li>
  );
}

function Equalizer() {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden>
      <span className="h-2 w-0.5 animate-[equalize_0.9s_ease-in-out_infinite] rounded-full bg-accent" />
      <span className="h-3 w-0.5 animate-[equalize_0.7s_ease-in-out_infinite_0.15s] rounded-full bg-accent" />
      <span className="h-1.5 w-0.5 animate-[equalize_0.8s_ease-in-out_infinite_0.3s] rounded-full bg-accent" />
      <style jsx>{`
        @keyframes equalize {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.35);
          }
        }
      `}</style>
    </span>
  );
}
