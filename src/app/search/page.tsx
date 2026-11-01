"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListMusic, Search as SearchIcon, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackList } from "@/components/library/TrackList";
import { OnlineTracksSection } from "@/components/library/OnlineTracksSection";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOnlineTracks } from "@/hooks/useOnlineCatalog";
import { filterTracks, searchPlaylists } from "@/lib/utils/trackFilters";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const trimmed = debounced.trim();
  const { tracks, playlists } = useLibrary();

  const localResults = useMemo(
    () => (trimmed ? filterTracks(tracks, { query: trimmed, sort: "recent" }) : []),
    [tracks, trimmed],
  );
  const playlistResults = useMemo(
    () => searchPlaylists(playlists, trimmed),
    [playlists, trimmed],
  );
  const online = useOnlineTracks({
    mode: "search",
    query: trimmed,
    limit: 20,
    enabled: trimmed.length >= 2,
  });

  const hasLocal = localResults.length > 0 || playlistResults.length > 0;
  const hasOnline = online.tracks.length > 0;
  const showNothing = trimmed.length > 0 && !hasLocal && !hasOnline && !online.loading && !online.error;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Search"
        title="Search everything"
        description="Search your saved tracks, playlists and the royalty-free online catalog. Results from your device are shown separately from online results."
      />

      <div className="relative max-w-2xl">
        <SearchIcon
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35"
          aria-hidden
        />
        <Input
          data-search-input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, albums or playlists…"
          aria-label="Search music"
          autoComplete="off"
          className="h-12 pl-10 pr-11 text-base"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 hover:text-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {!trimmed ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SearchHint title="Your library" body="Local imports and saved online tracks are searched instantly on this device." />
          <SearchHint title="Playlists" body="Playlist names are matched alongside track metadata." />
          <SearchHint title="Online catalog" body="Free To Use results load after you pause typing. Jamendo appears when configured." />
        </div>
      ) : null}

      {playlistResults.length ? (
        <section aria-label="Matching playlists">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">Playlists</h2>
          <div className="flex flex-wrap gap-2">
            {playlistResults.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.07]"
              >
                <ListMusic className="size-4 text-accent" aria-hidden />
                {playlist.name}
                <span className="text-xs text-white/35">{playlist.trackIds.length}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {localResults.length ? (
        <section aria-label="Results from your library">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
            From your library · {localResults.length}
          </h2>
          <TrackList tracks={localResults} queue={localResults} />
        </section>
      ) : null}

      {trimmed.length >= 2 ? (
        <OnlineTracksSection
          title="Online results"
          subtitle={online.total != null ? `${online.total.toLocaleString()} matching royalty-free tracks` : undefined}
          tracks={online.tracks}
          loading={online.loading}
          loadingMore={online.loadingMore}
          error={online.error}
          hasMore={online.hasMore}
          total={online.total}
          onLoadMore={online.loadMore}
          onRetry={online.retry}
          emptyMessage={`No online tracks matched “${trimmed}”. Try a broader search.`}
          compact={false}
        />
      ) : null}

      {showNothing ? (
        <EmptyState
          icon={<SearchIcon className="size-5" aria-hidden />}
          title="No matches"
          description={`Nothing in your library or the online catalog matched “${trimmed}”. Try a different spelling or search by artist.`}
        />
      ) : null}

      {!trimmed ? (
        <EmptyState
          icon={<SearchIcon className="size-5" aria-hidden />}
          title="Start typing to search"
          description="Press / anywhere to jump back to the search field. Online searching begins with at least two characters."
        />
      ) : null}
    </div>
  );
}

function SearchHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/45">{body}</p>
    </div>
  );
}
