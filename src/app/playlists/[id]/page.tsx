"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ListMusic, ListPlus, PencilLine, Play, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/Badge";
import { TrackList } from "@/components/library/TrackList";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDurationLong } from "@/lib/utils/format";
import { totalDuration } from "@/lib/utils/trackFilters";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ? decodeURIComponent(rawId) : rawId;
  const router = useRouter();
  const {
    hydrated,
    playlists,
    playlistTracks,
    renamePlaylist,
    deletePlaylist,
    movePlaylistTrack,
  } = useLibrary();
  const { playQueue, addToQueue } = usePlayer();
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const playlist = useMemo(() => playlists.find((item) => item.id === id), [playlists, id]);
  const tracks = useMemo(
    () => (playlist ? playlistTracks(playlist) : []),
    [playlist, playlistTracks],
  );
  const [name, setName] = useState(playlist?.name ?? "");
  const missing = playlist ? playlist.trackIds.length - tracks.length : 0;

  if (!hydrated) return null;

  if (!playlist) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Playlists" title="Playlist not found" />
        <EmptyState
          icon={<ListMusic className="size-5" aria-hidden />}
          title="This playlist does not exist"
          description="It may have been deleted, or the link may be out of date."
          action={
            <Link
              href="/playlists"
              className="focus-ring inline-flex h-9 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
            >
              Back to playlists
            </Link>
          }
        />
      </div>
    );
  }

  const handleRename = async () => {
    if (!name.trim()) {
      toast("Enter a playlist name.", "error");
      return;
    }
    await renamePlaylist(playlist.id, name);
    setRenameOpen(false);
    toast("Playlist renamed.", "success");
  };

  const addAllToQueue = () => {
    const existingQueueTitles = new Set<string>();
    let added = 0;
    for (const track of tracks) {
      if (existingQueueTitles.has(track.id)) continue;
      existingQueueTitles.add(track.id);
      addToQueue(track);
      added += 1;
    }
    if (added) toast(`Queued ${added} track${added === 1 ? "" : "s"}.`, "success");
  };

  const coverTrack = tracks[0];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Playlist"
        title={playlist.name}
        description={`${tracks.length} playable track${tracks.length === 1 ? "" : "s"}${
          tracks.length ? ` · ${formatDurationLong(totalDuration(tracks))}` : ""
        }${missing > 0 ? ` · ${missing} unavailable reference${missing === 1 ? "" : "s"}` : ""}`}
        actions={
          <>
            <Button
              onClick={() => playQueue(tracks, 0)}
              disabled={!tracks.length}
            >
              <Play className="size-4 fill-current" aria-hidden />
              Play
            </Button>
            <Button variant="secondary" onClick={addAllToQueue} disabled={!tracks.length}>
              <ListPlus className="size-4" aria-hidden />
              Queue
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setName(playlist.name);
                setRenameOpen(true);
              }}
            >
              <PencilLine className="size-4" aria-hidden />
              Rename
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-ink-850 to-ink-900 p-4 sm:flex-row sm:items-center">
        <AlbumArt
          id={playlist.id}
          title={playlist.name}
          artworkUrl={coverTrack?.artworkUrl}
          className="size-24 sm:size-28"
          rounded="rounded-2xl"
          iconSize="size-8"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Playlist</Badge>
            <span className="text-xs text-white/40">
              Updated {new Date(playlist.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            Use the arrows beside each row to reorder. The menu on each track can add lyrics,
            queue it next, or remove it from this playlist.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/online"
              className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-white transition hover:bg-white/[0.12]"
            >
              <Plus className="size-3.5" aria-hidden />
              Add online music
            </Link>
            <Link
              href="/library/local"
              className="focus-ring inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              Add local files
            </Link>
          </div>
        </div>
      </section>

      {tracks.length ? (
        <TrackList
          tracks={tracks}
          queue={tracks}
          playlistId={playlist.id}
          onMove={(from, to) => void movePlaylistTrack(playlist.id, from, to)}
          showIndex
        />
      ) : (
        <EmptyState
          icon={<ListMusic className="size-5" aria-hidden />}
          title="This playlist is empty"
          description="Add tracks from the online catalog or your local library using the menu on any track."
          action={
            <>
              <Link
                href="/online"
                className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
              >
                Browse online
              </Link>
              <Link
                href="/library/local"
                className="focus-ring inline-flex h-9 items-center rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
              >
                Local library
              </Link>
            </>
          }
        />
      )}

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename playlist"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRename()}>Save</Button>
          </>
        }
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleRename();
          }}
          maxLength={80}
          aria-label="Playlist name"
          autoFocus
        />
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete playlist?"
        description={`“${playlist.name}” will be removed. Tracks and audio files are not deleted.`}
        confirmLabel="Delete playlist"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          void deletePlaylist(playlist.id).then(() => {
            toast("Playlist deleted.", "success");
            router.push("/playlists");
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
