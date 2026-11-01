"use client";

import { Pause, Play } from "lucide-react";
import type { Track } from "@/types/track";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/Badge";
import { TrackMenu } from "@/components/player/TrackMenu";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { cn } from "@/lib/utils/cn";

export function OnlineTrackCard({
  track,
  queue,
  className,
}: {
  track: Track;
  queue?: Track[];
  className?: string;
}) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/[0.06] bg-ink-850/60 p-2.5 transition-colors hover:border-white/[0.12] hover:bg-ink-800/80",
        isCurrent && "border-accent/25 bg-accent/[0.04]",
        className,
      )}
    >
      <div className="relative">
        <AlbumArt
          id={track.id}
          title={track.title}
          artworkUrl={track.artworkUrl}
          className="aspect-square w-full"
          rounded="rounded-xl"
          iconSize="size-10"
        />
        <button
          type="button"
          onClick={() => (isCurrent ? togglePlay() : playTrack(track, queue ?? [track]))}
          aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${track.title}`}
          className="focus-ring absolute bottom-2 right-2 flex size-10 translate-y-1 items-center justify-center rounded-full bg-accent text-black opacity-0 shadow-soft transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          {isCurrent && isPlaying ? (
            <Pause className="size-4 fill-current" aria-hidden />
          ) : (
            <Play className="size-4 translate-x-0.5 fill-current" aria-hidden />
          )}
        </button>
        <div className="absolute left-2 top-2">
          <Badge tone={track.provider === "freetouse" ? "online" : "accent"}>
            {track.provider === "freetouse" ? "Free To Use" : "Jamendo"}
          </Badge>
        </div>
      </div>
      <div className="mt-2.5 flex items-start gap-1 px-0.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white" title={track.title}>
            {track.title}
          </p>
          <p className="truncate text-xs text-white/45" title={track.artist}>
            {track.artist}
          </p>
        </div>
        <TrackMenu track={track} queue={queue ?? [track]} />
      </div>
      {track.licenseName ? (
        <p className="mt-1 truncate px-0.5 text-[10px] text-white/30">{track.licenseName}</p>
      ) : null}
    </div>
  );
}
