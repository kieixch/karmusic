"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackList } from "@/components/library/TrackList";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";

export default function RecentPage() {
  const { recent, hydrated } = useLibrary();
  const { playQueue } = usePlayer();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Recent"
        title="Recently played"
        description="The last 40 tracks you started, kept on this device. Online entries store metadata only; local entries point to your imported files."
        actions={
          recent.length ? (
            <button
              type="button"
              onClick={() => playQueue(recent, 0)}
              className="focus-ring inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:bg-accent-soft"
            >
              Play history
            </button>
          ) : null
        }
      />

      {recent.length ? (
        <TrackList tracks={recent} queue={recent} />
      ) : hydrated ? (
        <EmptyState
          icon={<History className="size-5" aria-hidden />}
          title="Nothing played yet"
          description="Tracks appear here once playback starts. History stays on this device."
          action={
            <Link
              href="/explore"
              className="focus-ring inline-flex h-9 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
            >
              Explore music
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
