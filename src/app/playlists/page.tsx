"use client";

import { useMemo, useRef, useState } from "react";
import { Download, ListMusic, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import type { Playlist } from "@/types/playlist";
import { errorMessage } from "@/lib/utils/errors";

export default function PlaylistsPage() {
  const { playlists, createPlaylist, renamePlaylist, deletePlaylist, exportPlaylistsJson, importPlaylistsJson } =
    useLibrary();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [managing, setManaging] = useState<Playlist | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Playlist | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...playlists].sort((a, b) => b.updatedAt - a.updatedAt),
    [playlists],
  );

  const handleCreate = async () => {
    const created = await createPlaylist(name);
    if (!created) {
      toast("Enter a playlist name.", "error");
      return;
    }
    setName("");
    setCreateOpen(false);
    toast(`Created “${created.name}”.`, "success");
  };

  const handleRename = async () => {
    if (!managing) return;
    if (!renameValue.trim()) {
      toast("Playlist name cannot be empty.", "error");
      return;
    }
    await renamePlaylist(managing.id, renameValue);
    toast("Playlist renamed.", "success");
    setManaging(null);
  };

  const handleExport = () => {
    const blob = new Blob([exportPlaylistsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karmusic-playlists-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Playlists exported. Track metadata is included; audio is not.", "success");
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importPlaylistsJson(text);
      toast(
        `Imported ${result.imported} playlist${result.imported === 1 ? "" : "s"}${
          result.warnings.length ? ` with ${result.warnings.length} warning(s)` : ""
        }.`,
        "success",
      );
    } catch (importError) {
      toast(errorMessage(importError, "That file is not a valid KarMusic playlist export."), "error");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Playlists"
        title="Your sets"
        description="Playlists can mix local files and saved online tracks in any order. Export includes metadata only; download audio from the provider when its license allows it."
        actions={
          <>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New playlist
            </Button>
            <Button variant="secondary" onClick={() => importRef.current?.click()}>
              <Upload className="size-4" aria-hidden />
              Import
            </Button>
            <Button variant="ghost" onClick={handleExport} disabled={!playlists.length}>
              <Download className="size-4" aria-hidden />
              Export
            </Button>
          </>
        }
      />

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Import playlists JSON"
        onChange={(event) => {
          void handleImportFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {sorted.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {sorted.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onManage={() => {
                setManaging(playlist);
                setRenameValue(playlist.name);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ListMusic className="size-5" aria-hidden />}
          title="No playlists yet"
          description="Create a playlist for a mood, a set or a rehearsal. Add tracks from any track menu — online and local tracks can sit side by side."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Create your first playlist
            </Button>
          }
        />
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New playlist"
        description="Give it a name you will recognize."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()}>Create playlist</Button>
          </>
        }
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleCreate();
          }}
          placeholder="e.g. Late night drive"
          aria-label="Playlist name"
          maxLength={80}
          autoFocus
        />
      </Dialog>

      <Dialog
        open={Boolean(managing)}
        onClose={() => setManaging(null)}
        title={managing ? `Manage “${managing.name}”` : "Manage playlist"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setManaging(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRename()}>Save name</Button>
          </>
        }
      >
        <label className="mb-1.5 block text-xs font-medium text-white/50" htmlFor="rename-playlist">
          Playlist name
        </label>
        <Input
          id="rename-playlist"
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleRename();
          }}
          maxLength={80}
        />
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <Button
            variant="danger"
            onClick={() => {
              if (!managing) return;
              setConfirmDelete(managing);
              setManaging(null);
            }}
          >
            Delete playlist
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete playlist?"
        description={
          confirmDelete
            ? `“${confirmDelete.name}” will be removed. Tracks and audio files are not deleted.`
            : ""
        }
        confirmLabel="Delete playlist"
        destructive
        onConfirm={() => {
          if (confirmDelete) {
            void deletePlaylist(confirmDelete.id).then(() => toast("Playlist deleted.", "success"));
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
