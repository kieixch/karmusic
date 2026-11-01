"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Save, Trash2 } from "lucide-react";
import type { Track } from "@/types/track";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { parseLyrics } from "@/lib/lyrics/parseLrc";
import { errorMessage } from "@/lib/utils/errors";

const SAMPLE = `[ti:Demo Song]
[ar:Demo Artist]
[00:05.00]First lyric line
[00:08.50]Second lyric line
[00:12.00]Third lyric line`;

export function LyricsEditorDialog({
  track,
  open,
  onClose,
}: {
  track: Track;
  open: boolean;
  onClose: () => void;
}) {
  const { getLyrics, saveLyrics, removeLyrics, setLyricsOffset } = useLibrary();
  const { toast } = useToast();
  const existing = getLyrics(track.id);
  const [value, setValue] = useState("");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(existing?.raw ?? "");
    setOffset(existing?.offsetMs ?? 0);
    setError(null);
  }, [open, existing?.raw, existing?.offsetMs]);

  const parsed = useMemo(() => {
    if (!value.trim()) return null;
    return parseLyrics(value);
  }, [value]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Lyric file is too large (maximum 1 MB).");
      return;
    }
    try {
      const text = await file.text();
      setValue(text);
      setError(null);
    } catch {
      setError("Could not read that file.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveLyrics(track.id, value);
      if (existing && offset !== existing.offsetMs) {
        await setLyricsOffset(track.id, offset);
      }
      toast(existing ? "Lyrics updated." : "Lyrics saved locally.", "success");
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not save lyrics."));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    await removeLyrics(track.id);
    toast("Lyrics removed.", "success");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Lyrics"
      description={`${track.title} · ${track.artist}`}
      size="lg"
      footer={
        <>
          {existing ? (
            <Button variant="danger" size="sm" onClick={handleRemove}>
              <Trash2 className="size-4" aria-hidden />
              Remove
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp className="size-4" aria-hidden />
            Choose LRC file
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !value.trim()}>
            <Save className="size-4" aria-hidden />
            {saving ? "Saving…" : "Save lyrics"}
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".lrc,.txt,text/plain"
        className="sr-only"
        aria-label="Choose lyric file"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="space-y-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={`Paste plain lyrics or LRC with timestamps…\n\n${SAMPLE}`}
          aria-label="Lyrics text"
          className="font-mono text-[13px] leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="muted">
            {parsed
              ? `${parsed.format === "lrc" ? "Synced LRC" : "Plain text"} · ${parsed.lines.length} lines`
              : "Paste lyrics or upload an .lrc file you have the rights to use."}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="lyrics-offset" className="muted">
              Offset
            </label>
            <input
              id="lyrics-offset"
              type="number"
              step={0.1}
              min={-30}
              max={30}
              value={(offset / 1000).toFixed(1)}
              onChange={(event) => setOffset(Math.round(Number(event.target.value) * 1000))}
              className="focus-ring h-9 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-right text-sm"
            />
            <span className="muted">s</span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-white/35">
          KarMusic does not download lyrics from unlicensed sources. Only add lyrics you own or are
          authorized to use. Positive offset delays the highlighted line.
        </p>
        {error ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
