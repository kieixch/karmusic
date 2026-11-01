"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileAudio,
  FolderDown,
  Globe2,
  ListMusic,
  MonitorSmartphone,
  Plus,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useOnlineTracks, useProviderStatuses } from "@/hooks/useOnlineCatalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImportMusicButton } from "@/components/library/ImportMusicButton";
import { OnlineTracksSection } from "@/components/library/OnlineTracksSection";
import { TrackList } from "@/components/library/TrackList";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  const { tracks, localTracks, recent, playlists, importDemoTrack } = useLibrary();
  const { currentTrack, playQueue } = usePlayer();
  const { openLyricsMode } = useLyricsMode();
  const { toast } = useToast();
  const { jamendo } = useProviderStatuses();
  const featured = useOnlineTracks({ mode: "featured", limit: 12 });
  const isEmpty = tracks.length === 0;
  const recentlyAddedLocal = [...localTracks]
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, 5);

  const handleDemo = async () => {
    const summary = await importDemoTrack();
    if (summary.imported) toast("Demo track imported. It is an original synthesized tone.", "success");
  };

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-5 shadow-soft sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <Sparkles className="size-3" aria-hidden />
              Free & local-first
            </Badge>
            <Badge tone="online">Online catalog</Badge>
            <Badge tone="local">Your files</Badge>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Music that turns into lyrics when you rotate.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50 sm:text-base">
            Stream a royalty-free online catalog or import your own audio, then open Lyrics Mode.
            In landscape, the lyrics take over the screen while playback controls stay within
            reach.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/explore"
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:bg-accent-soft"
            >
              <Globe2 className="size-4" aria-hidden />
              Explore online music
            </Link>
            <ImportMusicButton variant="secondary" />
            {currentTrack ? (
              <Button variant="outline" onClick={() => openLyricsMode({ immersive: true })}>
                <ScrollText className="size-4" aria-hidden />
                Open Lyrics Mode
              </Button>
            ) : null}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/30">
            <ShieldCheck className="size-3.5" aria-hidden />
            No account. No analytics. Local files never leave your device.
          </p>
        </div>
      </section>

      {isEmpty ? (
        <section aria-labelledby="get-started">
          <SectionHeader
            title="Start your library"
            subtitle="KarMusic has no built-in copyrighted catalog. Add your own files, try the original demo, or stream the free online catalog."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <OnboardingCard
              icon={<FolderDown className="size-5" aria-hidden />}
              title="Import your own music"
              body="Choose MP3, WAV, OGG, M4A and other browser-supported files. Metadata and artwork are read from the file."
              action={<ImportMusicButton size="sm" />}
            />
            <OnboardingCard
              icon={<FileAudio className="size-5" aria-hidden />}
              title="Try the demo track"
              body="An original synthesized tone for testing playback and lyrics without bringing your own file."
              action={
                <Button size="sm" variant="secondary" onClick={() => void handleDemo()}>
                  <Plus className="size-4" aria-hidden />
                  Import demo
                </Button>
              }
            />
            <OnboardingCard
              icon={<Globe2 className="size-5" aria-hidden />}
              title="Browse the free catalog"
              body="Royalty-free tracks from Free To Use, streamed from the provider with attribution and license details."
              action={
                <Link
                  href="/online"
                  className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
                >
                  Open catalog
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
          </div>
        </section>
      ) : null}

      <OnlineTracksSection
        title="Featured online"
        subtitle={
          featured.total != null
            ? `${featured.total.toLocaleString()} royalty-free tracks · Free To Use`
            : "Royalty-free picks from Free To Use"
        }
        tracks={featured.tracks.slice(0, 6)}
        loading={featured.loading}
        error={featured.error}
        onRetry={featured.retry}
        href="/online"
        compact
      />

      {jamendo?.available ? (
        <section>
          <div className="card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-white">Jamendo catalog is configured</p>
              <p className="mt-0.5 text-xs text-white/45">
                Search Creative Commons tracks from Jamendo in the online catalog.
              </p>
            </div>
            <Link
              href="/online"
              className="focus-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
            >
              Open providers
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      ) : null}

      {recent.length ? (
        <section>
          <SectionHeader
            title="Recently played"
            subtitle="Continue where you left off"
            href="/recent"
          />
          <TrackList tracks={recent.slice(0, 5)} queue={recent} />
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="Your local music"
          subtitle={
            localTracks.length
              ? `${localTracks.length} track${localTracks.length === 1 ? "" : "s"} stored on this device`
              : "Your imported files appear here"
          }
          href={localTracks.length ? "/library/local" : undefined}
          action={
            localTracks.length ? (
              <Button size="sm" variant="secondary" onClick={() => playQueue(localTracks, 0)}>
                Play all
              </Button>
            ) : null
          }
        />
        {recentlyAddedLocal.length ? (
          <TrackList tracks={recentlyAddedLocal} queue={localTracks} />
        ) : (
          <EmptyState
            icon={<FileAudio className="size-5" aria-hidden />}
            title="No local tracks yet"
            description="Add audio files from this device. KarMusic extracts title, artist and artwork when available and uses the filename as a fallback."
            action={
              <>
                <ImportMusicButton size="sm" />
                <Button size="sm" variant="ghost" onClick={() => void handleDemo()}>
                  Import demo
                </Button>
              </>
            }
          />
        )}
      </section>

      <section>
        <SectionHeader
          title="Playlists"
          subtitle="Build sets from online and local tracks"
          href="/playlists"
          action={
            <Link
              href="/playlists"
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
            >
              <Plus className="size-3.5" aria-hidden />
              New playlist
            </Link>
          }
        />
        {playlists.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playlists.slice(0, 5).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ListMusic className="size-5" aria-hidden />}
            title="No playlists yet"
            description="Create a playlist, then add online tracks or your own imports from any track menu."
            action={
              <Link
                href="/playlists"
                className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
              >
                Create a playlist
              </Link>
            }
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <FeatureCard
          icon={<MonitorSmartphone className="size-5" aria-hidden />}
          title="Built for landscape lyrics"
          body="Fullscreen, large type, auto-scroll, seek-by-line and safe-area aware controls. Orientation lock is used only when the browser allows it."
          action={
            currentTrack ? (
              <Button size="sm" variant="secondary" onClick={() => openLyricsMode({ immersive: true })}>
                Try it now
              </Button>
            ) : (
              <Link href="/online" className="text-xs font-medium text-accent hover:underline">
                Pick a track
              </Link>
            )
          }
        />
        <FeatureCard
          icon={<ShieldCheck className="size-5" aria-hidden />}
          title="Honest sources"
          body="No scraping, DRM bypassing or fake catalog. Online audio comes from documented provider APIs; local audio is stored in IndexedDB and never uploaded."
        />
      </section>

    </div>
  );
}

function OnboardingCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-white/45">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.05] text-accent">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/45">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
