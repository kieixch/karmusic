"use client";

import { useState } from "react";
import { FileAudio, ShieldCheck } from "lucide-react";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ImportMusicButton } from "./ImportMusicButton";
import { cn } from "@/lib/utils/cn";

export function ImportDropzone() {
  const [dragging, setDragging] = useState(false);
  const { importFiles } = useLibrary();
  const { toast } = useToast();

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const files = event.dataTransfer.files;
    if (!files?.length) return;
    const summary = await importFiles(files);
    if (summary.imported) toast(`Imported ${summary.imported} track(s).`, "success");
    if (summary.failed) toast(summary.failures[0]?.reason ?? "Some files could not be imported.", "error");
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => void handleDrop(event)}
      className={cn(
        "rounded-2xl border border-dashed p-5 transition-colors",
        dragging ? "border-accent/60 bg-accent/[0.06]" : "border-white/10 bg-white/[0.015]",
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
          <FileAudio className="size-5" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Drag audio files here</p>
          <p className="mt-0.5 text-xs leading-relaxed muted">
            MP3, WAV, OGG, M4A and other codecs your browser supports. Files stay on this device.
          </p>
        </div>
        <ImportMusicButton />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/30 sm:justify-start">
        <ShieldCheck className="size-3.5" aria-hidden />
        Nothing is uploaded to a server. Large files may hit your browser&apos;s storage quota.
      </p>
    </div>
  );
}
