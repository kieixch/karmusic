"use client";

import { AlertTriangle, X } from "lucide-react";
import { useLibrary } from "@/components/providers/LibraryProvider";

export function StorageBanner() {
  const { storageError, clearStorageError } = useLibrary();
  if (!storageError) return null;

  return (
    <div
      role="alert"
      className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3.5 py-3 text-sm text-amber-100 lg:mx-8"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
      <p className="flex-1 leading-snug">{storageError}</p>
      <button
        type="button"
        onClick={clearStorageError}
        aria-label="Dismiss storage warning"
        className="focus-ring rounded-full p-1 text-amber-200/60 hover:text-amber-100"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
