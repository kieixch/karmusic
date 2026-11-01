"use client";

import { Loader2 } from "lucide-react";
import { useLibrary } from "@/components/providers/LibraryProvider";

export function ImportProgress() {
  const { importState } = useLibrary();
  if (!importState.active) return null;
  const percent = importState.total
    ? Math.round((importState.current / importState.total) * 100)
    : 0;

  return (
    <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top,0px)+68px)] z-[80] mx-auto max-w-sm lg:top-6">
      <div className="rounded-xl border border-white/10 bg-ink-800/95 p-3 shadow-soft backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm text-white">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
          <span className="truncate">
            Importing {importState.current} of {importState.total}
          </span>
          <span className="ml-auto text-xs text-white/40">{percent}%</span>
        </div>
        <p className="mt-1 truncate text-xs text-white/40">{importState.label}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
