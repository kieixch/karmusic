"use client";

import { useMemo, useState } from "react";
import { FileAudio, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { TrackList } from "@/components/library/TrackList";
import { ImportDropzone } from "@/components/library/ImportDropzone";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useStorageEstimate } from "@/hooks/useStorageEstimate";
import { filterTracks } from "@/lib/utils/trackFilters";
import { formatBytes, formatDurationLong } from "@/lib/utils/format";

export default function LocalLibraryPage() {
  const { localTracks, hydrated, clearLocalLibrary, importDemoTrack } = useLibrary();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const estimate = useStorageEstimate(localTracks.length);

  const filtered = useMemo(
    () => filterTracks(localTracks, { query, source: "local", sort: "recent" }),
    [localTracks, query],
  );

  const localBytes = localTracks.reduce((sum, track) => sum + (track.local?.size ?? 0), 0);
  const localSeconds = localTracks.reduce((sum, track) => sum + (track.duration ?? 0), 0);

  const handleDemo = async () => {
    const summary = await importDemoTrack();
    if (summary.imported) toast("Demo track imported.", "success");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Library · Local"
        title="On this device"
        description="Audio files imported into KarMusic are stored in this browser's IndexedDB. They are never uploaded. Clearing site data or uninstalling the browser removes them."
        actions={
          <Button variant="danger" onClick={() => setConfirmClear(true)} disabled={!localTracks.length}>
            <Trash2 className="size-4" aria-hidden />
            Clear local library
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<FileAudio className="size-4" aria-hidden />}
          label="Local tracks"
          value={hydrated ? String(localTracks.length) : "—"}
        />
        <StatCard
          icon={<HardDrive className="size-4" aria-hidden />}
          label="Audio size"
          value={hydrated ? formatBytes(localBytes) : "—"}
          hint={
            estimate.usage != null
              ? `${formatBytes(estimate.usage)} used${estimate.quota ? ` of ${formatBytes(estimate.quota)}` : ""} by this site`
              : undefined
          }
        />
        <StatCard
          icon={<ShieldCheck className="size-4" aria-hidden />}
          label="Total local duration"
          value={hydrated ? formatDurationLong(localSeconds) : "—"}
          hint={estimate.persisted === true ? "Storage marked persistent" : "Browser may evict unused data"}
        />
      </section>

      <ImportDropzone />

      {localTracks.length ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter local files…"
              aria-label="Filter local files"
              className="h-10 sm:max-w-xs"
            />
            <p className="text-xs text-white/40">
              {filtered.length} of {localTracks.length} files
            </p>
          </div>
          {filtered.length ? (
            <TrackList tracks={filtered} queue={filtered} />
          ) : (
            <EmptyState
              title="No matching local files"
              description="Try a different filename or title."
              action={<Button variant="secondary" onClick={() => setQuery("")}>Clear filter</Button>}
            />
          )}
        </>
      ) : hydrated ? (
        <EmptyState
          icon={<FileAudio className="size-5" aria-hidden />}
          title="No local files yet"
          description="Choose audio files above or drop them onto the import area. Metadata is read locally; unsupported codecs may not play in every browser."
          action={
            <Button variant="secondary" onClick={() => void handleDemo()}>
              Import the demo track
            </Button>
          }
        />
      ) : null}

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-white">Storage limits & compatibility</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/45">
          <li>• Storage limits are browser and device specific. The estimate above can change.</li>
          <li>• Metadata extraction works best with MP3, FLAC, M4A and OGG. WAV files often have no embedded tags.</li>
          <li>• Playback depends on codec support in your browser, not just the file extension.</li>
          <li>• If the quota is exhausted, imports stay available for the current session but may not persist after reload.</li>
        </ul>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all local tracks?"
        description="Every imported audio file and its lyrics are deleted from this browser. Online library entries, favorites and playlists are kept, but local tracks are removed from playlists. This cannot be undone."
        confirmLabel="Clear local library"
        destructive
        onConfirm={() => {
          setConfirmClear(false);
          void clearLocalLibrary().then(() => toast("Local library cleared.", "success"));
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-white/45">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-white/35">{hint}</p> : null}
    </div>
  );
}
