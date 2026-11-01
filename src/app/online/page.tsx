"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe2, KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { OnlineTracksSection } from "@/components/library/OnlineTracksSection";
import { useJamendoTracks, useOnlineTracks, useProviderStatuses } from "@/hooks/useOnlineCatalog";
import { cn } from "@/lib/utils/cn";

type CatalogOrder = "staff_order" | "release_date" | "random" | "plays" | "views" | "downloads";

const ORDER_LABELS: Record<CatalogOrder, string> = {
  staff_order: "Staff picks",
  release_date: "Newest",
  random: "Shuffle order",
  plays: "Most played",
  views: "Most viewed",
  downloads: "Most downloaded",
};

export default function OnlinePage() {
  const [order, setOrder] = useState<CatalogOrder>("staff_order");
  const { statuses, loading: statusesLoading, jamendo } = useProviderStatuses();
  const freetouse = statuses.find((status) => status.id === "freetouse");
  const catalog = useOnlineTracks({ mode: "catalog", order, limit: 24 });
  const jamendoTracks = useJamendoTracks(jamendo?.available ? "" : null, 12);

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Online"
        title="Royalty-free catalog"
        description="KarMusic streams from documented provider APIs only. Free To Use is built in and needs no key. Jamendo is optional and server-proxied so the client ID is never sent to the browser."
        actions={
          <Link
            href="/search"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
          >
            <Globe2 className="size-4" aria-hidden />
            Search online
          </Link>
        }
      />

      <section aria-label="Providers" className="grid gap-3 md:grid-cols-2">
        <ProviderCard
          name="Free To Use"
          badge={<Badge tone="online">Built in</Badge>}
          description="Royalty-free music library with a public API and full-length streams. Attribution is shown on each saved track. Free use is subject to the provider license; commercial use may require a paid license."
          available={freetouse?.available ?? true}
          loading={statusesLoading}
          licenseUrl={freetouse?.licenseUrl ?? "https://freetouse.com/license"}
          siteUrl={freetouse?.website ?? "https://freetouse.com"}
          note={freetouse?.reason}
        />
        <ProviderCard
          name="Jamendo"
          badge={
            jamendo?.available ? <Badge tone="accent">Configured</Badge> : <Badge tone="neutral">Optional</Badge>
          }
          description="Creative Commons tracks through the official Jamendo API. Requires a server-side JAMENDO_CLIENT_ID. Each track's license and attribution must be respected."
          available={Boolean(jamendo?.available)}
          loading={statusesLoading}
          licenseUrl={jamendo?.licenseUrl ?? "https://www.jamendo.com/legal"}
          siteUrl={jamendo?.website ?? "https://www.jamendo.com"}
          note={
            jamendo?.available
              ? "Server-side key detected. Jamendo results appear in explore and below."
              : (jamendo?.reason ??
                "Set JAMENDO_CLIENT_ID in the server environment to enable this provider. No key is exposed to the browser.")
          }
          setup
        />
      </section>

      <section aria-label="Free To Use catalog" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Free To Use catalog</h2>
            <p className="mt-1 text-sm text-white/45">
              {catalog.total != null
                ? `${catalog.total.toLocaleString()} tracks available`
                : "Loading the public catalog"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/45">
            Order
            <Select
              aria-label="Catalog order"
              value={order}
              onChange={(event) => setOrder(event.target.value as CatalogOrder)}
            >
              {Object.entries(ORDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <OnlineTracksSection
          title="Catalog tracks"
          subtitle="Streamed from Free To Use"
          tracks={catalog.tracks}
          loading={catalog.loading}
          loadingMore={catalog.loadingMore}
          error={catalog.error}
          hasMore={catalog.hasMore}
          total={catalog.total}
          onLoadMore={catalog.loadMore}
          onRetry={catalog.retry}
        />
      </section>

      {jamendo?.available ? (
        <OnlineTracksSection
          title="Jamendo featured"
          subtitle="Creative Commons · verify each track's license before reuse"
          tracks={jamendoTracks.tracks}
          loading={jamendoTracks.loading}
          error={jamendoTracks.error}
          compact
        />
      ) : (
        <section className="card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
              <KeyRound className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Enabling Jamendo</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/45">
                Register an application at Jamendo, copy{" "}
                <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-white/70">.env.example</code>{" "}
                to <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-white/70">.env.local</code>,
                then set{" "}
                <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-xs text-white/70">JAMENDO_CLIENT_ID</code>.
                Restart the server. The browser only talks to KarMusic&apos;s own API routes.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="card flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <p className="text-xs leading-relaxed text-white/40">
          Streaming availability is controlled by each provider. KarMusic does not bypass DRM or
          scrape commercial services. If a provider changes its API or rate limits requests,
          only that online source is affected.
        </p>
      </section>
    </div>
  );
}

function ProviderCard({
  name,
  badge,
  description,
  available,
  loading,
  licenseUrl,
  siteUrl,
  note,
  setup = false,
}: {
  name: string;
  badge: React.ReactNode;
  description: string;
  available: boolean;
  loading: boolean;
  licenseUrl: string;
  siteUrl: string;
  note?: string;
  setup?: boolean;
}) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">{name}</h3>
          {badge}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            loading
              ? "bg-white/[0.05] text-white/45"
              : available
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-400/10 text-amber-200",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              loading ? "bg-white/30" : available ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
          {loading ? "Checking" : available ? "Available" : setup ? "Not configured" : "Unavailable"}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{description}</p>
      {note ? <p className="mt-3 text-xs leading-relaxed text-amber-100/60">{note}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={licenseUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-xs font-medium text-white transition hover:bg-white/[0.12]"
        >
          License
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          Provider site
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
