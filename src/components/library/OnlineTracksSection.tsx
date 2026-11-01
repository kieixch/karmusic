"use client";

import { ListPlus, Play } from "lucide-react";
import type { Track } from "@/types/track";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkeletonCards } from "@/components/ui/Spinner";
import { InlineError } from "@/components/ui/InlineError";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { OnlineTrackCard } from "./OnlineTrackCard";

export function OnlineTracksSection({
  title,
  subtitle,
  tracks,
  loading,
  loadingMore,
  error,
  hasMore,
  total,
  onLoadMore,
  onRetry,
  href,
  emptyMessage = "No tracks were returned by the catalog.",
  compact = false,
}: {
  title: string;
  subtitle?: string;
  tracks: Track[];
  loading: boolean;
  loadingMore?: boolean;
  error: string | null;
  hasMore?: boolean;
  total?: number | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
  href?: string;
  emptyMessage?: string;
  compact?: boolean;
}) {
  const { playQueue } = usePlayer();
  const { toast } = useToast();

  const addAll = () => {
    if (!tracks.length) return;
    playQueue(tracks, 0);
    toast(`Playing ${tracks.length} tracks.`, "success");
  };

  return (
    <section aria-label={title}>
      <SectionHeader
        title={title}
        subtitle={
          subtitle ??
          (total != null ? `${total.toLocaleString()} royalty-free tracks · Free To Use` : undefined)
        }
        href={href}
        action={
          tracks.length > 0 && !compact ? (
            <Button size="sm" variant="secondary" onClick={addAll}>
              <Play className="size-3.5 fill-current" aria-hidden />
              Play all
            </Button>
          ) : null
        }
      />
      {loading ? (
        <SkeletonCards count={compact ? 6 : 8} />
      ) : error ? (
        <InlineError
          message={error}
          onRetry={onRetry}
          note="Local music and your imported files still work offline."
        />
      ) : tracks.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description={emptyMessage}
          icon={<ListPlus className="size-5" aria-hidden />}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {tracks.map((track) => (
              <OnlineTrackCard key={track.id} track={track} queue={tracks} />
            ))}
          </div>
          {!compact && onLoadMore && hasMore ? (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more tracks"}
              </Button>
            </div>
          ) : null}
          <p className="mt-4 text-[11px] leading-relaxed text-white/30">
            Online tracks are streamed from Free To Use with attribution. Free usage is subject to
            the{" "}
            <a
              href="https://freetouse.com/license"
              target="_blank"
              rel="noreferrer noopener"
              className="focus-ring rounded underline decoration-white/20 underline-offset-2 hover:text-white/60"
            >
              Free To Use License
            </a>
            ; commercial use may require a paid license from the provider.
          </p>
        </>
      )}
    </section>
  );
}
