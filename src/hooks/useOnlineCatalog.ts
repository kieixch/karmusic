"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/types/track";
import {
  fetchCategoryTracks,
  fetchFreeToUseCatalog,
  fetchFreeToUseCategories,
  fetchProviderStatuses,
  freetouseProvider,
  jamendoProvider,
} from "@/lib/providers/client";
import type { NormalizedCategory } from "@/lib/providers/normalize";
import type { ProviderPage } from "@/lib/providers/types";
import { errorMessage } from "@/lib/utils/errors";
import type { ProviderStatus } from "@/types/track";

type Mode = "featured" | "catalog" | "search" | "category";

export interface UseOnlineTracksOptions {
  mode: Mode;
  query?: string;
  categoryId?: string;
  order?: "staff_order" | "release_date" | "random" | "plays" | "views" | "downloads";
  limit?: number;
  enabled?: boolean;
}

export interface UseOnlineTracksResult {
  tracks: Track[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number | null;
  loadMore: () => void;
  retry: () => void;
}

export function useOnlineTracks({
  mode,
  query = "",
  categoryId,
  order = "staff_order",
  limit = 20,
  enabled = true,
}: UseOnlineTracksOptions): UseOnlineTracksResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const offsetRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const fetchPage = useCallback(
    async (offset: number, signal: AbortSignal): Promise<ProviderPage> => {
      if (mode === "search") {
        if (!query.trim()) {
          return { tracks: [], offset, limit, total: null, hasMore: false };
        }
        return freetouseProvider.searchTracks(query.trim(), { limit, offset, signal });
      }
      if (mode === "category") {
        if (!categoryId) return { tracks: [], offset, limit, total: null, hasMore: false };
        return fetchCategoryTracks(categoryId, { limit, offset }, signal);
      }
      if (mode === "catalog") {
        return fetchFreeToUseCatalog({ order, limit, offset }, signal);
      }
      return freetouseProvider.getFeaturedTracks({ limit, offset, signal });
    },
    [categoryId, limit, mode, order, query],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setTracks([]);
    offsetRef.current = 0;
    setHasMore(false);
    setTotal(null);

    (async () => {
      try {
        const page = await fetchPage(0, controller.signal);
        if (controller.signal.aborted || !mountedRef.current) return;
        setTracks(page.tracks);
        offsetRef.current = page.tracks.length;
        setHasMore(page.hasMore);
        setTotal(page.total);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(errorMessage(fetchError, "The online catalog could not be loaded."));
      } finally {
        if (!controller.signal.aborted && mountedRef.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [enabled, fetchPage, attempt]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoadingMore(true);
    (async () => {
      try {
        const page = await fetchPage(offsetRef.current, controller.signal);
        if (controller.signal.aborted || !mountedRef.current) return;
        setTracks((current) => {
          const existing = new Set(current.map((track) => track.id));
          return [...current, ...page.tracks.filter((track) => !existing.has(track.id))];
        });
        offsetRef.current += page.tracks.length;
        setHasMore(page.hasMore);
        if (page.total !== null) setTotal(page.total);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(errorMessage(fetchError, "Could not load more tracks."));
      } finally {
        if (!controller.signal.aborted && mountedRef.current) setLoadingMore(false);
      }
    })();
  }, [fetchPage, hasMore, loading, loadingMore]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { tracks, loading, loadingMore, error, hasMore, total, loadMore, retry };
}

export function useCategories() {
  const [categories, setCategories] = useState<NormalizedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await fetchFreeToUseCategories(controller.signal);
        if (controller.signal.aborted) return;
        setCategories(result);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(errorMessage(fetchError, "Categories are unavailable."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return { categories, loading, error };
}

export function useProviderStatuses() {
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await fetchProviderStatuses(controller.signal);
        if (!controller.signal.aborted) setStatuses(result);
      } catch {
        // Status is informational; the catalog hook reports actionable errors.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return { statuses, loading, jamendo: statuses.find((status) => status.id === "jamendo") };
}

export function useJamendoTracks(query: string | null, limit = 20) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query === null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const page = query.trim()
          ? await jamendoProvider.searchTracks(query.trim(), { limit, signal: controller.signal })
          : await jamendoProvider.getFeaturedTracks({ limit, signal: controller.signal });
        if (!controller.signal.aborted) setTracks(page.tracks);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(errorMessage(fetchError, "Jamendo is unavailable."));
        setTracks([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [query, limit]);

  return { tracks, loading, error };
}
