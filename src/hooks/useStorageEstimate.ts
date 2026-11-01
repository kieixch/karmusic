"use client";

import { useEffect, useState } from "react";

export interface StorageEstimate {
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
}

export function useStorageEstimate(refreshKey?: unknown): StorageEstimate {
  const [estimate, setEstimate] = useState<StorageEstimate>({
    usage: null,
    quota: null,
    persisted: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.storage?.estimate) return;
        const [result, persisted] = await Promise.all([
          navigator.storage.estimate(),
          navigator.storage.persisted?.() ?? Promise.resolve(null),
        ]);
        if (cancelled) return;
        setEstimate({
          usage: result.usage ?? null,
          quota: result.quota ?? null,
          persisted,
        });
      } catch {
        // Storage estimates are best-effort and widely unsupported.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return estimate;
}
