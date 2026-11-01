"use client";

import Link from "next/link";
import { ListMusic, MoreHorizontal, Play } from "lucide-react";
import type { Playlist } from "@/types/playlist";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { formatDurationLong } from "@/lib/utils/format";

export function PlaylistCard({
  playlist,
  showPlay = true,
  onManage,
}: {
  playlist: Playlist;
  showPlay?: boolean;
  onManage?: () => void;
}) {
  const { playlistTracks } = useLibrary();
  const { playQueue } = usePlayer();
  const tracks = playlistTracks(playlist);
  const duration = tracks.reduce((sum, track) => sum + (track.duration ?? 0), 0);
  const covers = tracks.slice(0, 4);

  return (
    <div className="group relative">
      <Link
        href={`/playlists/${playlist.id}`}
        className="focus-ring block rounded-2xl border border-white/[0.06] bg-ink-850/60 p-2.5 transition-colors hover:border-white/[0.12] hover:bg-ink-800/80"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 to-ink-900">
          {covers.length ? (
            <div className="grid size-full grid-cols-2 grid-rows-2">
              {[0, 1, 2, 3].map((index) => {
                const track = covers[index] ?? covers[0];
                return track ? (
                  <AlbumArt
                    key={`${track.id}-${index}`}
                    id={track.id}
                    title={track.title}
                    artworkUrl={track.artworkUrl}
                    className="size-full"
                    rounded="rounded-none"
                    iconSize="size-5"
                  />
                ) : (
                  <div key={index} className="bg-white/[0.03]" />
                );
              })}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center text-white/25">
              <ListMusic className="size-10" aria-hidden />
            </div>
          )}
        </div>
        <p className="mt-2.5 truncate text-sm font-semibold text-white">{playlist.name}</p>
        <p className="mt-0.5 text-xs text-white/40">
          {tracks.length} track{tracks.length === 1 ? "" : "s"}
          {duration ? ` · ${formatDurationLong(duration)}` : ""}
        </p>
      </Link>
      {showPlay && tracks.length ? (
        <button
          type="button"
          onClick={() => playQueue(tracks, 0)}
          aria-label={`Play ${playlist.name}`}
          className="focus-ring absolute bottom-[4.8rem] right-4 flex size-9 translate-y-1 items-center justify-center rounded-full bg-accent text-black opacity-0 shadow-soft transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          <Play className="size-4 translate-x-0.5 fill-current" aria-hidden />
        </button>
      ) : null}
      {onManage ? (
        <button
          type="button"
          onClick={onManage}
          aria-label={`Manage ${playlist.name}`}
          className="focus-ring absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/65 text-white/70 opacity-0 backdrop-blur transition hover:text-white group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
