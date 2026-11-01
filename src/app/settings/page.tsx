"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Download,
  Gauge,
  Info,
  Keyboard,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useStorageEstimate } from "@/hooks/useStorageEstimate";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ThemePreference } from "@/types/settings";
import { errorMessage } from "@/lib/utils/errors";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { localTracks, clearLocalLibrary, clearAllData, exportPlaylistsJson, importPlaylistsJson } =
    useLibrary();
  const { toast } = useToast();
  const estimate = useStorageEstimate(localTracks.length);
  const [confirm, setConfirm] = useState<"local" | "all" | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportPlaylistsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karmusic-playlists-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await importPlaylistsJson(await file.text());
      toast(`Imported ${result.imported} playlist(s).`, "success");
    } catch (error) {
      toast(errorMessage(error, "Invalid playlist export."), "error");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="Settings and library data stay in this browser. There is no account and no server-side profile."
      />

      <SettingsSection
        icon={<SlidersHorizontal className="size-4" aria-hidden />}
        title="Appearance"
        description="KarMusic is dark by default. OLED uses true black to save power on OLED screens."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["dark", "Dark", "Near-black surfaces with soft contrast"],
              ["oled", "OLED black", "True black background for OLED displays"],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateSettings({ theme: value as ThemePreference })}
              aria-pressed={settings.theme === value}
              className={cn(
                "focus-ring rounded-xl border p-4 text-left transition",
                settings.theme === value
                  ? "border-accent/40 bg-accent/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]",
              )}
            >
              <span className="block text-sm font-semibold text-white">{label}</span>
              <span className="mt-0.5 block text-xs text-white/40">{hint}</span>
            </button>
          ))}
        </div>
        <SwitchRow
          label="Reduce motion"
          description="Disable smooth scrolling, spinners and animated transitions where possible."
          checked={settings.reduceMotion}
          onChange={(checked) => updateSettings({ reduceMotion: checked })}
        />
      </SettingsSection>

      <SettingsSection
        icon={<MonitorSmartphone className="size-4" aria-hidden />}
        title="Lyrics Mode"
        description="Landscape lyrics are a priority. These defaults apply to the embedded lyrics panel and fullscreen Lyrics Mode."
      >
        <RangeRow
          label="Lyrics font size"
          value={settings.lyricsFontSize}
          min={16}
          max={72}
          step={1}
          display={`${settings.lyricsFontSize}px`}
          onChange={(value) => updateSettings({ lyricsFontSize: value })}
        />
        <RangeRow
          label="Line spacing"
          value={settings.lyricsLineSpacing}
          min={1}
          max={3}
          step={0.05}
          display={settings.lyricsLineSpacing.toFixed(2)}
          onChange={(value) => updateSettings({ lyricsLineSpacing: value })}
        />
        <RangeRow
          label="Inactive line dimming"
          value={settings.lyricsDim}
          min={0}
          max={0.92}
          step={0.02}
          display={`${Math.round(settings.lyricsDim * 100)}%`}
          onChange={(value) => updateSettings({ lyricsDim: value })}
        />
        <SwitchRow
          label="Auto-scroll lyrics"
          description="Keep the active line centered while the song plays. Manual scrolling pauses following until you resume."
          checked={settings.lyricsAutoScroll}
          onChange={(checked) => updateSettings({ lyricsAutoScroll: checked })}
        />
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Lyrics view</p>
            <p className="mt-0.5 text-xs text-white/40">Full shows artwork and queue; minimal focuses on lyrics.</p>
          </div>
          <div className="inline-flex rounded-lg border border-white/[0.08] p-0.5">
            {(
              [
                ["full", "Full"],
                ["minimal", "Minimal"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ lyricsMode: value })}
                aria-pressed={settings.lyricsMode === value}
                className={cn(
                  "focus-ring rounded-md px-3 py-1.5 text-xs font-medium transition",
                  settings.lyricsMode === value ? "bg-white/[0.1] text-white" : "text-white/45 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Gauge className="size-4" aria-hidden />}
        title="Playback"
        description="Player volume and mute are remembered separately while you listen. This default is used when no player preference exists."
      >
        <RangeRow
          label="Default volume"
          value={settings.defaultVolume}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(settings.defaultVolume * 100)}%`}
          onChange={(value) => updateSettings({ defaultVolume: value })}
        />
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Playback speed</p>
            <p className="mt-0.5 text-xs text-white/40">Applies immediately and persists across tracks.</p>
          </div>
          <Select
            aria-label="Playback speed"
            value={settings.playbackRate}
            onChange={(event) => updateSettings({ playbackRate: Number(event.target.value) })}
          >
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </Select>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Download className="size-4" aria-hidden />}
        title="Data & storage"
        description="Audio blobs, lyrics and playlists live in IndexedDB. Favorites, history and preferences use localStorage."
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">Browser storage</p>
            <p className="text-xs text-white/45">
              {estimate.usage != null ? formatBytes(estimate.usage) : "Unavailable"}
              {estimate.quota != null ? ` of ${formatBytes(estimate.quota)}` : ""}
            </p>
          </div>
          {estimate.usage != null && estimate.quota ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(100, (estimate.usage / estimate.quota) * 100)}%` }}
              />
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-white/35">
            {localTracks.length} local file{localTracks.length === 1 ? "" : "s"} stored on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="size-4" aria-hidden />
            Export playlists
          </Button>
          <Button variant="secondary" size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="size-4" aria-hidden />
            Import playlists
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import playlists JSON"
            onChange={(event) => {
              void handleImport(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button variant="danger" size="sm" onClick={() => setConfirm("local")} disabled={!localTracks.length}>
            <Trash2 className="size-4" aria-hidden />
            Clear local files
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirm("all")}>
            <Trash2 className="size-4" aria-hidden />
            Clear all library data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetSettings();
              toast("Settings reset to defaults.", "success");
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset settings
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Info className="size-4" aria-hidden />}
        title="About the catalog"
        description="KarMusic is a player, not a music repository. It plays files you own and streams from providers under their terms."
      >
        <div className="space-y-3 text-xs leading-relaxed text-white/45">
          <p>
            <strong className="text-white/70">Free To Use</strong> — royalty-free tracks from{" "}
            <a
              href="https://freetouse.com/license"
              target="_blank"
              rel="noreferrer noopener"
              className="focus-ring rounded text-accent underline decoration-accent/30 underline-offset-2"
            >
              freetouse.com/license
            </a>
            . Free use has conditions and attribution requirements; commercial use may require a paid
            license from the provider. Each saved track carries its license and attribution.
          </p>
          <p>
            <strong className="text-white/70">Jamendo</strong> — optional. Creative Commons tracks
            through the official Jamendo API. A server-side <code className="rounded bg-white/[0.07] px-1 py-0.5">JAMENDO_CLIENT_ID</code>{" "}
            is required. Track licenses vary and must be checked individually.
          </p>
          <p>
            <strong className="text-white/70">Your files</strong> — KarMusic does not verify that you
            have rights to imported audio, and it never uploads your files. You are responsible for
            the material you add.
          </p>
          <p className="flex items-start gap-2 rounded-lg bg-emerald-400/[0.05] p-3 text-emerald-100/70">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            No analytics, ads, accounts, or third-party trackers are included. Requests go to this
            app&apos;s API routes and the provider&apos;s audio CDN.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Keyboard className="size-4" aria-hidden />}
        title="Keyboard shortcuts"
        description="Shortcuts work outside text fields and are disabled while a dialog is open."
      >
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["Space", "Play / pause"],
            ["← / →", "Seek 5 seconds"],
            ["Shift + ← / →", "Previous / next track"],
            ["↑ / ↓", "Volume"],
            ["M", "Mute"],
            ["L", "Open Lyrics Mode"],
            ["F", "Favorite current track"],
            ["/", "Focus search"],
            ["Esc", "Close Lyrics Mode or dialog"],
          ].map(([key, action]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.025] px-3 py-2">
              <dt className="font-mono text-xs text-white/65">{key}</dt>
              <dd className="text-xs text-white/40">{action}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-white/30">
          Shortcuts are ignored while focus is inside an input, textarea, select or contenteditable
          element. See <Link href="/now-playing" className="text-accent/80 hover:underline">Now Playing</Link>{" "}
          for lyrics controls.
        </p>
      </SettingsSection>

      <ConfirmDialog
        open={confirm === "local"}
        title="Clear local files?"
        description="All imported audio and local lyrics will be deleted from this browser. Online library entries and playlists remain, but local tracks are removed from playlists."
        confirmLabel="Clear local files"
        destructive
        onConfirm={() => {
          setConfirm(null);
          void clearLocalLibrary().then(() => toast("Local files cleared.", "success"));
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "all"}
        title="Clear all library data?"
        description="Every track, local audio file, lyric, playlist, favorite and play history entry in this browser will be deleted. Preferences are kept. This cannot be undone."
        confirmLabel="Clear everything"
        destructive
        onConfirm={() => {
          setConfirm(null);
          void clearAllData().then(() => toast("Library data cleared.", "success"));
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-accent">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-white/40">{description}</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-white/[0.05] border-t border-white/[0.05] pt-1">{children}</div>
    </section>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-white/40">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-white/[0.14]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-white" htmlFor={`range-${label.replace(/\s+/g, "-")}`}>
          {label}
        </label>
        <span className="font-mono text-xs text-white/45">{display}</span>
      </div>
      <input
        id={`range-${label.replace(/\s+/g, "-")}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.12] accent-accent"
      />
    </div>
  );
}
