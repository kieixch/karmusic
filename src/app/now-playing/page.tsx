"use client";

import Link from "next/link";
import { ExternalLink, Heart, ListMusic, Maximize2, Music2, Sparkles, Trash2, X } from "lucide-react";
import { AlbumArt } from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";
import { SeekBar } from "@/components/player/SeekBar";
import { PlaybackControls } from "@/components/player/PlaybackControls";
import { VolumeControl } from "@/components/player/VolumeControl";
import { TrackMenu } from "@/components/player/TrackMenu";
import { LyricsPanel } from "@/components/lyrics/LyricsPanel";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { cn } from "@/lib/utils/cn";

export default function NowPlayingPage() {
  const {
    currentTrack,
    queue,
    queueIndex,
    error,
    retry,
    clearError,
    removeFromQueue,
    jumpToQueueIndex,
    clearQueue,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const { settings, updateSettings } = useSettings();
  const { openLyricsMode } = useLyricsMode();

  if (!currentTrack) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Now playing</h1>
        <EmptyState
          icon={<Music2 className="size-5" aria-hidden />}
          title="Nothing is playing"
          description="Choose a local file or an online track to start. The mini player and this page will follow the current queue."
          action={
            <>
              <Link
                href="/online"
                className="focus-ring inline-flex h-9 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-black transition hover:bg-accent-soft"
              >
                Browse online
              </Link>
              <Link
                href="/library"
                className="focus-ring inline-flex h-9 items-center rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-white transition hover:bg-white/[0.14]"
              >
                Open library
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const favorite = isFavorite(currentTrack.id);
  const isLocal = currentTrack.source === "local";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/80">Now playing</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Full player</h1>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label={settings.ambientMode ? "Disable ambient mode" : "Enable ambient mode"}
            active={settings.ambientMode}
            onClick={() => updateSettings({ ambientMode: !settings.ambientMode })}
          >
            <Sparkles aria-hidden />
          </IconButton>
          <IconButton
            label={favorite ? "Remove from favorites" : "Add to favorites"}
            active={favorite}
            onClick={() => void toggleFavorite(currentTrack)}
          >
            <Heart className={cn(favorite && "fill-current")} aria-hidden />
          </IconButton>
          <TrackMenu track={currentTrack} queue={queue} />
        </div>
      </div>

      {error ? (
        <InlineError
          message={error}
          onRetry={retry}
          note={isLocal ? "Re-import the file if it was removed from browser storage." : undefined}
        />
      ) : null}
      {error ? (
        <button
          type="button"
          onClick={clearError}
          className="focus-ring rounded text-xs text-white/35 underline decoration-white/20 underline-offset-2 hover:text-white/60"
        >
          Dismiss message
        </button>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        <section aria-label="Current track" className="mx-auto w-full max-w-md lg:mx-0">
          <AlbumArt
            id={currentTrack.id}
            title={currentTrack.title}
            artworkUrl={currentTrack.artworkUrl}
            className="aspect-square w-full shadow-soft"
            rounded="rounded-3xl"
            iconSize="size-16"
          />
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isLocal ? "local" : "online"}>
                {isLocal ? "Local file" : currentTrack.provider === "freetouse" ? "Free To Use" : "Jamendo"}
              </Badge>
              {currentTrack.genre ? <Badge tone="neutral">{currentTrack.genre}</Badge> : null}
              {currentTrack.licenseName ? <Badge tone="warning">{currentTrack.licenseName}</Badge> : null}
            </div>
            <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {currentTrack.title}
            </h2>
            <p className="mt-1 text-sm text-white/55 sm:text-base">{currentTrack.artist}</p>
            {currentTrack.album ? <p className="mt-0.5 text-xs text-white/35">{currentTrack.album}</p> : null}
          </div>

          <div className="mt-5">
            <SeekBar />
            <PlaybackControls className="mt-3" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <VolumeControl />
              <label className="flex items-center gap-2 text-xs text-white/45">
                Speed
                <Select
                  aria-label="Playback speed"
                  value={settings.playbackRate}
                  onChange={(event) => updateSettings({ playbackRate: Number(event.target.value) })}
                  className="h-8 text-xs"
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}×
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => openLyricsMode({ immersive: true })} className="flex-1 sm:flex-none">
                <Maximize2 className="size-4" aria-hidden />
                Lyrics Mode
              </Button>
              <Button variant="secondary" onClick={() => openLyricsMode({ immersive: false })}>
                In-app lyrics
              </Button>
            </div>
            {(currentTrack.attribution || currentTrack.licenseUrl || currentTrack.sourceUrl) && (
              <div className="mt-4 space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-white/40">
                {currentTrack.attribution ? <p>{currentTrack.attribution}</p> : null}
                <div className="flex flex-wrap gap-3">
                  {currentTrack.licenseUrl ? (
                    <a
                      href={currentTrack.licenseUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring inline-flex items-center gap-1 rounded text-white/60 underline decoration-white/20 underline-offset-2 hover:text-white"
                    >
                      License
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                  {currentTrack.sourceUrl ? (
                    <a
                      href={currentTrack.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring inline-flex items-center gap-1 rounded text-white/60 underline decoration-white/20 underline-offset-2 hover:text-white"
                    >
                      Source
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-label="Lyrics" className="flex min-h-[420px] flex-col lg:min-h-0">
          <LyricsPanel track={currentTrack} className="h-full" />
        </section>
      </div>

      <section aria-label="Queue">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-white">
            <ListMusic className="size-4 text-accent" aria-hidden />
            Queue
            <span className="text-xs font-normal text-white/35">{queue.length} tracks</span>
          </h2>
          {queue.length ? (
            <button
              type="button"
              onClick={clearQueue}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear queue
            </button>
          ) : null}
        </div>
        {queue.length ? (
          <ol className="divide-y divide-white/[0.04] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
            {queue.map((track, index) => {
              const isCurrent = index === queueIndex;
              return (
                <li
                  key={`${track.id}-${index}`}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-4",
                    isCurrent ? "bg-accent/[0.06]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => jumpToQueueIndex(index)}
                    aria-label={`Play ${track.title}`}
                    className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                  >
                    <span
                      className={cn(
                        "w-5 shrink-0 text-center font-mono text-[11px] tabular-nums",
                        isCurrent ? "text-accent" : "text-white/25",
                      )}
                    >
                      {isCurrent ? "▶" : index + 1}
                    </span>
                    <AlbumArt
                      id={track.id}
                      title={track.title}
                      artworkUrl={track.artworkUrl}
                      className="size-9"
                      rounded="rounded-md"
                      iconSize="size-3.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", isCurrent ? "font-semibold text-white" : "text-white/75")}>
                        {track.title}
                      </span>
                      <span className="block truncate text-xs text-white/35">
                        {track.artist}
                        {track.source === "local" ? " · Local" : ""}
                      </span>
                    </span>
                  </button>
                  <IconButton
                    label={`Remove ${track.title} from queue`}
                    size="sm"
                    onClick={() => removeFromQueue(index)}
                    className="text-white/30 hover:text-white"
                  >
                    <X aria-hidden />
                  </IconButton>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/35">
            The queue is empty.
          </p>
        )}
      </section>
    </div>
  );
}
