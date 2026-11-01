"use client";

import { useState } from "react";
import { Compass, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCategories, useJamendoTracks, useOnlineTracks, useProviderStatuses } from "@/hooks/useOnlineCatalog";
import { OnlineTracksSection } from "@/components/library/OnlineTracksSection";
import { InlineError } from "@/components/ui/InlineError";
import { cn } from "@/lib/utils/cn";
import { AlbumArt } from "@/components/ui/AlbumArt";

export default function ExplorePage() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { jamendo } = useProviderStatuses();
  const jamendoTracks = useJamendoTracks(jamendo?.available ? "" : null, 10);

  const browse = useOnlineTracks({
    mode: selected ? "category" : "catalog",
    categoryId: selected?.id,
    order: "random",
    limit: 20,
  });

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Explore"
        title="Find your next soundtrack"
        description="Browse royalty-free categories from Free To Use, or dip into the optional Jamendo catalog when it is configured. Local music remains available even if an online provider is down."
      />

      <section aria-labelledby="categories-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="categories-heading" className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-accent" aria-hidden />
              Browse by mood & genre
            </span>
          </h2>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="focus-ring rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition hover:text-white"
            >
              Clear filter
            </button>
          ) : null}
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : categoriesError ? (
          <InlineError message={categoriesError} note="You can still use the main online catalog." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => {
              const active = selected?.id === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelected(active ? null : { id: category.id, name: category.name })}
                  aria-pressed={active}
                  className={cn(
                    "focus-ring group relative flex h-24 items-end overflow-hidden rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-accent/50 bg-accent/[0.08]"
                      : "border-white/[0.06] bg-ink-850/60 hover:border-white/[0.14]",
                  )}
                >
                  <AlbumArt
                    id={category.id}
                    title={category.name}
                    artworkUrl={category.artworkUrl}
                    className="absolute inset-0 size-full"
                    rounded="rounded-none"
                    iconSize="size-8"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" aria-hidden />
                  <span className="relative">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-accent/80">
                      {category.type}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-white">{category.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <OnlineTracksSection
        title={selected ? `${selected.name} picks` : "Discover something new"}
        subtitle={selected ? "Free To Use · randomly ordered category tracks" : "Free To Use · rotating royalty-free selection"}
        tracks={browse.tracks}
        loading={browse.loading}
        loadingMore={browse.loadingMore}
        error={browse.error}
        hasMore={browse.hasMore}
        total={browse.total}
        onLoadMore={browse.loadMore}
        onRetry={browse.retry}
        emptyMessage={selected ? "This category has no playable tracks right now." : undefined}
        href="/online"
      />

      {jamendo?.available ? (
        <OnlineTracksSection
          title="From Jamendo"
          subtitle="Creative Commons tracks · check each track's license"
          tracks={jamendoTracks.tracks}
          loading={jamendoTracks.loading}
          error={jamendoTracks.error}
          compact
        />
      ) : (
        <section aria-labelledby="jamendo-note" className="card p-5">
          <h2 id="jamendo-note" className="text-base font-semibold text-white">
            Optional Jamendo provider
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/45">
            Jamendo is supported through its official API but is not configured on this deployment.
            Add <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-white/70">JAMENDO_CLIENT_ID</code>{" "}
            to the server environment to enable Creative Commons tracks. No key is shipped to the
            browser. Local and Free To Use playback are unaffected.
          </p>
        </section>
      )}

      <section className="card flex items-start gap-3 p-4">
        <Compass className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <p className="text-xs leading-relaxed text-white/40">
          Every result shows its provider. KarMusic never pretends to search YouTube Music,
          Spotify, or other commercial catalogs, and does not scrape stream URLs.
        </p>
      </section>
    </div>
  );
}
