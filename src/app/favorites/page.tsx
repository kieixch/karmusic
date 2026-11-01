"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackList } from "@/components/library/TrackList";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { formatDurationLong } from "@/lib/utils/format";
import { totalDuration } from "@/lib/utils/trackFilters";

export default function FavoritesPage() {
  const { favoriteTracks, hydrated } = useLibrary();
  const { playQueue } = usePlayer();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Favorites"
        title="Loved tracks"
        description={
          favoriteTracks.length
            ? `${favoriteTracks.length} track${favoriteTracks.length === 1 ? "" : "s"} · ${formatDurationLong(totalDuration(favoriteTracks))}`
            : "Tap the heart in any track menu to keep it here."
        }
        actions={
          favoriteTracks.length ? (
            <button
              type="button"
              onClick={() => playQueue(favoriteTracks, 0)}
              className="focus-ring inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:bg-accent-soft"
            >
              Play favorites
            </button>
          ) : null
        }
      />

      {favoriteTracks.length ? (
        <TrackList tracks={favoriteTracks} queue={favoriteTracks} />
      ) : hydrated ? (
        <EmptyState
          icon={<Heart className="size-5" aria-hidden />}
          title="No favorites yet"
          description="Favorite local tracks and online tracks to build a quick-access collection. Favorites of online tracks store metadata only."
          action={
            <Link
              href="/online"
              className="focus-ring inline-flex h-9 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
            >
              Find music
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
