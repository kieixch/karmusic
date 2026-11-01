"use client";

import { useRef, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { AUDIO_ACCEPT } from "@/lib/audio/formats";
import { useLibrary } from "@/components/providers/LibraryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, type ButtonProps } from "@/components/ui/Button";

interface ImportMusicButtonProps {
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  icon?: ReactNode;
  onImported?: () => void;
}

export function ImportMusicButton({
  label = "Add local music",
  variant = "primary",
  size = "md",
  className,
  icon,
  onImported,
}: ImportMusicButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importFiles } = useLibrary();
  const { toast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const summary = await importFiles(files);
    if (summary.imported > 0) {
      toast(
        `Imported ${summary.imported} track${summary.imported === 1 ? "" : "s"} to this device.`,
        "success",
      );
    }
    if (summary.skipped > 0) {
      toast(`${summary.skipped} duplicate file${summary.skipped === 1 ? " was" : "s were"} skipped.`, "info");
    }
    if (summary.failed > 0) {
      toast(
        `${summary.failed} file${summary.failed === 1 ? "" : "s"} could not be imported. ${summary.failures[0]?.reason ?? ""}`.trim(),
        "error",
      );
    }
    onImported?.();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Choose audio files to import"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        {icon ?? <Upload className="size-4" aria-hidden />}
        {label}
      </Button>
    </>
  );
}
