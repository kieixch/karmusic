"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileAudio, Globe2, Library, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TrackList } from "@/components/library/TrackList";
import { ImportMusicButton } from "@/components/library/ImportMusicButton";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { filterTracks, totalDuration, type SourceFilter, type TrackSort } from "@/lib/utils/trackFilters";
import { formatDurationLong } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function LibraryPage() {
  const { tracks, localTracks, onlineTracks, hydrated } = useLibrary();
  const { playQueue } = usePlayer();
  const [source, setSource] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<TrackSort>("recent");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterTracks(tracks, { query, source, sort }),
    [tracks, query, source, sort],
  );

  const counts: Record<SourceFilter, number> = {
    all: tracks.length,
    online: onlineTracks.length,
    local: localTracks.length,
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Library"
        title="Your music"
        description={`Saved online tracks and files imported to this device. ${
          tracks.length ? `${tracks.length} tracks · ${formatDurationLong(totalDuration(tracks))}` : "Nothing saved yet."
        }`}
        actions={
          <>
            <ImportMusicButton />
            <Link
              href="/online"
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              <Globe2 className="size-4" aria-hidden />
              Browse online
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter by source" className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
          {(
            [
              ["all", "All"],
              ["online", "Online"],
              ["local", "Local"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={source === value}
              onClick={() => setSource(value)}
              className={cn(
                "focus-ring flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition",
                source === value
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-white/50 hover:text-white",
              )}
            >
              {label}
              <span className="text-[10px] text-white/35">{counts[value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter library…"
              aria-label="Filter library"
              className="h-10 pl-9"
            />
          </div>
          <Select
            aria-label="Sort tracks"
            value={sort}
            onChange={(event) => setSort(event.target.value as TrackSort)}
            className="h-10"
          >
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="artist">Artist A–Z</option>
            <option value="duration">Duration</option>
          </Select>
        </div>
      </div>

      {filtered.length ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-white/40">
              {filtered.length} track{filtered.length === 1 ? "" : "s"}
              {query ? ` matching “${query}”` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => playQueue(filtered, 0)}
              >
                Play all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => playQueue([...filtered].sort(() => Math.random() - 0.5), 0)}>
                Shuffle play
              </Button>
            </div>
          </div>
          <TrackList tracks={filtered} queue={filtered} />
        </>
      ) : hydrated ? (
        <EmptyState
          icon={<Library className="size-5" aria-hidden />}
          title={query ? "No matching tracks" : "Your library is empty"}
          description={
            query
              ? "Try a different title, artist or album. The source filter also applies."
              : "Import audio from this device or save online tracks from the catalog. Nothing is uploaded to a server."
          }
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear filter
              </Button>
            ) : (
              <>
                <ImportMusicButton size="sm" />
                <Link
                  href="/online"
                  className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
                >
                  <Globe2 className="size-3.5" aria-hidden />
                  Online catalog
                </Link>
              </>
            )
          }
        />
      ) : null}

      {localTracks.length ? (
        <div className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FileAudio className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Manage local files</p>
              <p className="mt-0.5 text-xs text-white/45">
                View storage usage, import more files or remove device-only tracks.
              </p>
            </div>
          </div>
          <Link
            href="/library/local"
            className="focus-ring inline-flex h-9 items-center rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
          >
            Open local library
          </Link>
        </div>
      ) : null}
    </div>
  );
}
