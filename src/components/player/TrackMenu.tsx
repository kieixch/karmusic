"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FolderPlus,
  Heart,
  ListEnd,
  ListPlus,
  ListX,
  MoreHorizontal,

  Play,
  ScrollText,
  Trash2,
} from "lucide-react";
import type { Track } from "@/types/track";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { LyricsEditorDialog } from "@/components/lyrics/LyricsEditorDialog";

export function TrackMenu({
  track,
  queue,
  playlistId,
}: {
  track: Track;
  queue?: Track[];
  playlistId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { playlists, isFavorite, toggleFavorite, addTrackToPlaylist, removeTrack, removeTrackFromPlaylist, getLyrics } =
    useLibrary();
  const { playTrack, playNext, addToQueue } = usePlayer();
  const { openLyricsMode } = useLyricsMode();
  const { toast } = useToast();
  const favorite = isFavorite(track.id);
  const hasLyrics = Boolean(getLyrics(track.id));
  const isLocal = track.source === "local";

  const run = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <>
      <IconButton
        label={`More options for ${track.title}`}
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="text-white/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <MoreHorizontal aria-hidden />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} title="Track options" description={`${track.title} · ${track.artist}`}>
        <div className="space-y-1.5">
          <MenuButton
            icon={<Play className="size-4" aria-hidden />}
            label="Play now"
            onClick={() => run(() => playTrack(track, queue))}
          />
          <MenuButton
            icon={<ListEnd className="size-4" aria-hidden />}
            label="Play next"
            onClick={() => run(() => playNext(track))}
          />
          <MenuButton
            icon={<ListPlus className="size-4" aria-hidden />}
            label="Add to queue"
            onClick={() => run(() => addToQueue(track))}
          />
          <MenuButton
            icon={<Heart className={favorite ? "size-4 fill-current text-accent" : "size-4"} aria-hidden />}
            label={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => run(() => void toggleFavorite(track))}
          />
          <MenuButton
            icon={<ScrollText className="size-4" aria-hidden />}
            label={hasLyrics ? "Edit lyrics" : "Add lyrics"}
            onClick={() => {
              setOpen(false);
              setLyricsOpen(true);
            }}
          />
          {hasLyrics ? (
            <MenuButton
              icon={<ExternalLink className="size-4" aria-hidden />}
              label="Open Lyrics Mode"
              onClick={() =>
                run(() => {
                  playTrack(track, queue);
                  openLyricsMode({ immersive: false });
                })
              }
            />
          ) : null}
          {playlistId ? (
            <MenuButton
              icon={<ListX className="size-4" aria-hidden />}
              label="Remove from this playlist"
              onClick={() =>
                run(() => {
                  void removeTrackFromPlaylist(playlistId, track.id);
                  toast("Removed from playlist.", "info");
                })
              }
            />
          ) : null}
          <MenuButton
            icon={<Trash2 className="size-4" aria-hidden />}
            label={isLocal ? "Delete from this device" : "Remove from library"}
            destructive
            onClick={() => {
              setOpen(false);
              setConfirmRemove(true);
            }}
          />
        </div>

        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
            <FolderPlus className="size-3.5" aria-hidden />
            Add to playlist
          </div>
          {playlists.length ? (
            <div className="grid max-h-48 gap-1 overflow-y-auto pr-1">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => run(() => void addTrackToPlaylist(playlist.id, track))}
                  className="focus-ring flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="truncate">{playlist.name}</span>
                  <span className="text-xs text-white/35">{playlist.trackIds.length}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm muted">
              No playlists yet.{" "}
              <Link href="/playlists" className="focus-ring rounded text-accent hover:underline">
                Create one
              </Link>
              .
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-white/45">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isLocal ? "local" : "online"}>{isLocal ? "Local" : track.provider === "freetouse" ? "Free To Use" : "Jamendo"}</Badge>
            {track.licenseName ? <span>{track.licenseName}</span> : null}
          </div>
          {track.attribution ? <p>{track.attribution}</p> : null}
          {track.licenseUrl ? (
            <a
              href={track.licenseUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="focus-ring inline-flex items-center gap-1 rounded text-white/60 underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              View license terms
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
          {isLocal ? <p>{track.local?.fileName}</p> : null}
          <p>
            {isLocal
              ? "This file stays on your device and is never uploaded."
              : "Playback uses the provider's authorized stream. Save the provider ID, not a temporary stream URL."}
          </p>
        </div>
      </Dialog>

      <LyricsEditorDialog track={track} open={lyricsOpen} onClose={() => setLyricsOpen(false)} />

      <ConfirmDialog
        open={confirmRemove}
        title={isLocal ? "Delete local track?" : "Remove from library?"}
        description={
          isLocal
            ? "The audio file and its lyrics will be deleted from this browser. Playlists and favorites referencing it will be updated. This cannot be undone."
            : "This removes the saved online track metadata from your library. The track remains available in the online catalog."
        }
        confirmLabel={isLocal ? "Delete track" : "Remove"}
        destructive
        onConfirm={() => {
          setConfirmRemove(false);
          void removeTrack(track.id);
          toast(isLocal ? "Local track deleted." : "Removed from library.", "success");
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition hover:bg-white/[0.06] ${
        destructive ? "text-red-200 hover:bg-red-500/10" : "text-white/80 hover:text-white"
      }`}
    >
      <span className="text-white/45">{icon}</span>
      {label}
    </button>
  );
}
