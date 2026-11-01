"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LyricsRecord } from "@/types/lyrics";
import type { Playlist } from "@/types/playlist";
import type { Track } from "@/types/track";
import { buildLocalTrack, type ImportFailure } from "@/lib/library/importAudio";
import { parseLyrics } from "@/lib/lyrics/parseLrc";
import {
  addTrackToPlaylist as addTrackPure,
  createPlaylist as createPlaylistPure,
  moveTrack as moveTrackPure,
  prunePlaylists,
  removeTrackFromPlaylist as removeTrackPure,
  renamePlaylist as renamePlaylistPure,
} from "@/lib/playlists/operations";
import {
  createPlaylistExport,
  parsePlaylistExport,
} from "@/lib/storage/validation";
import {
  clearLocalTracks,
  deleteTrack as deleteTrackDb,
  getAllTracks,
  getTrackBlob,
  putLocalTrack,
  putTrack,
} from "@/lib/storage/trackStore";
import {
  getAllLyrics,
  deleteLyrics as deleteLyricsDb,
  putLyrics,
} from "@/lib/storage/lyricsStore";
import {
  deletePlaylist as deletePlaylistDb,
  getAllPlaylists,
  putPlaylist,
} from "@/lib/storage/playlistStore";
import { getMeta, setMeta } from "@/lib/storage/metaStore";
import { resetDatabase } from "@/lib/storage/db";
import { errorMessage, isQuotaError } from "@/lib/utils/errors";
import { clamp } from "@/lib/utils/format";
import { useToast } from "./ToastProvider";

export interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  failures: ImportFailure[];
}

export interface ImportState {
  active: boolean;
  current: number;
  total: number;
  label: string;
  failures: ImportFailure[];
}

interface LibraryContextValue {
  hydrated: boolean;
  storageAvailable: boolean;
  storageError: string | null;
  clearStorageError: () => void;
  tracks: Track[];
  localTracks: Track[];
  onlineTracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  favoriteTracks: Track[];
  recent: Track[];
  lyrics: Record<string, LyricsRecord>;
  importState: ImportState;
  importFiles: (files: File[] | FileList) => Promise<ImportSummary>;
  importDemoTrack: () => Promise<ImportSummary>;
  removeTrack: (trackId: string) => Promise<void>;
  clearLocalLibrary: () => Promise<void>;
  clearAllData: () => Promise<void>;
  toggleFavorite: (track: Track) => Promise<void>;
  isFavorite: (trackId: string) => boolean;
  addRecent: (track: Track) => void;
  saveTrack: (track: Track) => Promise<void>;
  getTrack: (trackId: string) => Track | undefined;
  resolveLocalSource: (track: Track) => Promise<string>;
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  movePlaylistTrack: (playlistId: string, from: number, to: number) => Promise<void>;
  exportPlaylistsJson: () => string;
  importPlaylistsJson: (json: string) => Promise<{ imported: number; warnings: string[] }>;
  saveLyrics: (trackId: string, raw: string) => Promise<LyricsRecord>;
  setLyricsOffset: (trackId: string, offsetMs: number) => Promise<void>;
  removeLyrics: (trackId: string) => Promise<void>;
  getLyrics: (trackId: string) => LyricsRecord | undefined;
  playlistTracks: (playlist: Playlist) => Track[];
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const FAVORITES_KEY = "favorites.v1";
const RECENT_KEY = "recent.v1";
const MAX_RECENT = 40;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [lyrics, setLyrics] = useState<Record<string, LyricsRecord>>({});
  const [importState, setImportState] = useState<ImportState>({
    active: false,
    current: 0,
    total: 0,
    label: "",
    failures: [],
  });

  const tracksRef = useRef<Track[]>([]);
  const playlistsRef = useRef<Playlist[]>([]);
  const favoritesRef = useRef<string[]>([]);
  const recentRef = useRef<Track[]>([]);
  const lyricsRef = useRef<Record<string, LyricsRecord>>({});
  const urlCache = useRef(new Map<string, string>());
  const blobCache = useRef(new Map<string, Blob>());

  const setTracksSafe = useCallback((next: Track[]) => {
    tracksRef.current = next;
    setTracks(next);
  }, []);
  const setPlaylistsSafe = useCallback((next: Playlist[]) => {
    playlistsRef.current = next;
    setPlaylists(next);
  }, []);
  const setFavoritesSafe = useCallback((next: string[]) => {
    favoritesRef.current = next;
    setFavorites(next);
  }, []);
  const setRecentSafe = useCallback((next: Track[]) => {
    recentRef.current = next;
    setRecent(next);
  }, []);
  const setLyricsSafe = useCallback((next: Record<string, LyricsRecord>) => {
    lyricsRef.current = next;
    setLyrics(next);
  }, []);

  const reportStorageError = useCallback((error: unknown) => {
    const message = isQuotaError(error)
      ? "The browser storage quota is full. Remove some local tracks or clear site data, then try again."
      : errorMessage(error, "Local storage failed. This session may not persist after reload.");
    setStorageError(message);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedTracks, storedPlaylists, storedLyrics, storedFavorites, storedRecent] =
          await Promise.all([
            getAllTracks(),
            getAllPlaylists(),
            getAllLyrics(),
            getMeta<string[]>(FAVORITES_KEY, []),
            getMeta<Track[]>(RECENT_KEY, []),
          ]);
        if (cancelled) return;
        setTracksSafe(storedTracks);
        setPlaylistsSafe(storedPlaylists.sort((a, b) => b.updatedAt - a.updatedAt));
        setLyricsSafe(Object.fromEntries(storedLyrics.map((record) => [record.trackId, record])));
        setFavoritesSafe(
          Array.isArray(storedFavorites)
            ? storedFavorites.filter((id) => typeof id === "string")
            : [],
        );
        setRecentSafe(
          Array.isArray(storedRecent)
            ? storedRecent.filter(
                (track) => track && typeof track.id === "string" && typeof track.title === "string",
              )
            : [],
        );
      } catch (error) {
        if (cancelled) return;
        setStorageAvailable(false);
        setStorageError(
          `${errorMessage(error, "IndexedDB is unavailable.")} Imported music will work in this session but may not persist.`,
        );
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setFavoritesSafe, setLyricsSafe, setPlaylistsSafe, setRecentSafe, setTracksSafe]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void setMeta(FAVORITES_KEY, favoritesRef.current).catch(() => {
        setStorageAvailable(false);
      });
      void setMeta(RECENT_KEY, recentRef.current).catch(() => {
        setStorageAvailable(false);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [favorites, recent, hydrated]);

  useEffect(() => {
    const onTrackRemoved = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (!detail?.id) return;
      const cached = urlCache.current.get(detail.id);
      if (cached) {
        URL.revokeObjectURL(cached);
        urlCache.current.delete(detail.id);
      }
      blobCache.current.delete(detail.id);
    };
    window.addEventListener("karmusic:track-removed", onTrackRemoved);
    return () => window.removeEventListener("karmusic:track-removed", onTrackRemoved);
  }, []);

  const saveTrack = useCallback(
    async (track: Track) => {
      const exists = tracksRef.current.some((item) => item.id === track.id);
      if (!exists) {
        setTracksSafe([...tracksRef.current, track]);
      }
      try {
        await putTrack(track);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setTracksSafe],
  );

  const importFiles = useCallback(
    async (files: File[] | FileList): Promise<ImportSummary> => {
      const list = Array.from(files);
      const summary: ImportSummary = { imported: 0, skipped: 0, failed: 0, failures: [] };
      setImportState({ active: true, current: 0, total: list.length, label: "", failures: [] });

      for (let index = 0; index < list.length; index += 1) {
        const file = list[index];
        setImportState({
          active: true,
          current: index + 1,
          total: list.length,
          label: file.name,
          failures: summary.failures,
        });
        try {
          const { track, blob } = await buildLocalTrack(file);
          if (tracksRef.current.some((existing) => existing.id === track.id)) {
            summary.skipped += 1;
            continue;
          }
          try {
            await putLocalTrack(track, blob);
          } catch (error) {
            const persistedTrack: Track = {
              ...track,
              local: track.local ? { ...track.local, persisted: false } : undefined,
            };
            blobCache.current.set(track.id, blob);
            reportStorageError(error);
            setTracksSafe([...tracksRef.current, persistedTrack]);
            summary.imported += 1;
            continue;
          }
          setTracksSafe([...tracksRef.current, track]);
          summary.imported += 1;
        } catch (error) {
          summary.failed += 1;
          summary.failures.push({
            fileName: file.name,
            reason: errorMessage(error, "Could not import this file."),
          });
        }
      }

      setImportState({
        active: false,
        current: list.length,
        total: list.length,
        label: "",
        failures: summary.failures,
      });
      return summary;
    },
    [reportStorageError, setTracksSafe],
  );

  const importDemoTrack = useCallback(async (): Promise<ImportSummary> => {
    try {
      const response = await fetch("/demo/karmusic-demo.wav");
      if (!response.ok) throw new Error("Demo audio is unavailable.");
      const blob = await response.blob();
      const file = new File([blob], "KarMusic Demo.wav", { type: "audio/wav" });
      const summary = await importFiles([file]);
      const demoTrack = tracksRef.current.find(
        (track) => track.source === "local" && track.local?.fileName === "KarMusic Demo.wav",
      );
      if (demoTrack && !lyricsRef.current[demoTrack.id]) {
        try {
          const lyricsResponse = await fetch("/demo/karmusic-demo.lrc");
          if (lyricsResponse.ok) {
            const raw = await lyricsResponse.text();
            const parsed = parseLyrics(raw);
            if (parsed.lines.length) {
              const record: LyricsRecord = {
                trackId: demoTrack.id,
                format: parsed.format,
                raw,
                lines: parsed.lines,
                meta: parsed.meta,
                offsetMs: 0,
                updatedAt: Date.now(),
              };
              setLyricsSafe({ ...lyricsRef.current, [demoTrack.id]: record });
              await putLyrics(record);
            }
          }
        } catch {
          // Demo lyrics are optional; the audio still imports.
        }
      }
      return summary;
    } catch (error) {
      toast(errorMessage(error, "Could not load the demo track."), "error");
      return { imported: 0, skipped: 0, failed: 1, failures: [] };
    }
  }, [importFiles, setLyricsSafe, toast]);

  const removeTrack = useCallback(
    async (trackId: string) => {
      setTracksSafe(tracksRef.current.filter((track) => track.id !== trackId));
      setFavoritesSafe(favoritesRef.current.filter((id) => id !== trackId));
      setRecentSafe(recentRef.current.filter((track) => track.id !== trackId));
      const validIds = new Set(tracksRef.current.map((track) => track.id));
      const pruned = prunePlaylists(playlistsRef.current, validIds);
      setPlaylistsSafe(pruned);
      const cached = urlCache.current.get(trackId);
      if (cached) {
        URL.revokeObjectURL(cached);
        urlCache.current.delete(trackId);
      }
      blobCache.current.delete(trackId);
      try {
        await deleteTrackDb(trackId);
        await Promise.all(pruned.map((playlist) => putPlaylist(playlist)));
      } catch (error) {
        reportStorageError(error);
      }
      const nextLyrics = { ...lyricsRef.current };
      delete nextLyrics[trackId];
      setLyricsSafe(nextLyrics);
      window.dispatchEvent(new CustomEvent("karmusic:track-removed", { detail: { id: trackId } }));
    },
    [reportStorageError, setFavoritesSafe, setLyricsSafe, setPlaylistsSafe, setRecentSafe, setTracksSafe],
  );

  const revokeAllUrls = useCallback(() => {
    for (const url of urlCache.current.values()) URL.revokeObjectURL(url);
    urlCache.current.clear();
    blobCache.current.clear();
  }, []);

  const clearLocalLibrary = useCallback(async () => {
    const isLocal = (track: Track) => track.source === "local";
    const localIds = new Set(tracksRef.current.filter(isLocal).map((track) => track.id));
    setTracksSafe(tracksRef.current.filter((track) => !isLocal(track)));
    setFavoritesSafe(favoritesRef.current.filter((id) => !localIds.has(id)));
    setRecentSafe(recentRef.current.filter((track) => !isLocal(track)));
    const validIds = new Set(tracksRef.current.filter((track) => !isLocal(track)).map((track) => track.id));
    const pruned = prunePlaylists(playlistsRef.current, validIds);
    setPlaylistsSafe(pruned);
    const removedLyrics = { ...lyricsRef.current };
    for (const id of localIds) delete removedLyrics[id];
    setLyricsSafe(removedLyrics);
    revokeAllUrls();
    try {
      await clearLocalTracks();
      await Promise.all(pruned.map((playlist) => putPlaylist(playlist)));
    } catch (error) {
      reportStorageError(error);
    }
    for (const id of localIds) {
      window.dispatchEvent(new CustomEvent("karmusic:track-removed", { detail: { id } }));
    }
  }, [
    reportStorageError,
    revokeAllUrls,
    setFavoritesSafe,
    setLyricsSafe,
    setPlaylistsSafe,
    setRecentSafe,
    setTracksSafe,
  ]);

  const clearAllData = useCallback(async () => {
    revokeAllUrls();
    try {
      await resetDatabase();
    } catch (error) {
      reportStorageError(error);
    }
    setTracksSafe([]);
    setPlaylistsSafe([]);
    setFavoritesSafe([]);
    setRecentSafe([]);
    setLyricsSafe({});
    window.dispatchEvent(new CustomEvent("karmusic:library-cleared"));
  }, [
    reportStorageError,
    revokeAllUrls,
    setFavoritesSafe,
    setLyricsSafe,
    setPlaylistsSafe,
    setRecentSafe,
    setTracksSafe,
  ]);

  const toggleFavorite = useCallback(
    async (track: Track) => {
      const isFav = favoritesRef.current.includes(track.id);
      if (isFav) {
        setFavoritesSafe(favoritesRef.current.filter((id) => id !== track.id));
      } else {
        setFavoritesSafe([track.id, ...favoritesRef.current]);
        if (track.source === "online") await saveTrack(track);
      }
    },
    [saveTrack, setFavoritesSafe],
  );

  const isFavorite = useCallback((trackId: string) => favoritesRef.current.includes(trackId), []);

  const addRecent = useCallback(
    (track: Track) => {
      setRecentSafe([track, ...recentRef.current.filter((item) => item.id !== track.id)].slice(0, MAX_RECENT));
      if (track.source === "online") void saveTrack(track);
    },
    [saveTrack, setRecentSafe],
  );

  const getTrack = useCallback(
    (trackId: string) => tracksRef.current.find((track) => track.id === trackId),
    [],
  );

  const resolveLocalSource = useCallback(async (track: Track): Promise<string> => {
    const cached = urlCache.current.get(track.id);
    if (cached) return cached;
    const blob = blobCache.current.get(track.id) ?? (await getTrackBlob(track.id));
    if (!blob) {
      throw new Error(
        "The audio file for this local track is missing. Remove it and re-import the file from this device.",
      );
    }
    const url = URL.createObjectURL(blob);
    urlCache.current.set(track.id, url);
    return url;
  }, []);

  const createPlaylist = useCallback(
    async (name: string): Promise<Playlist | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const playlist = createPlaylistPure(trimmed);
      setPlaylistsSafe([playlist, ...playlistsRef.current]);
      try {
        await putPlaylist(playlist);
      } catch (error) {
        reportStorageError(error);
      }
      return playlist;
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const renamePlaylist = useCallback(
    async (playlistId: string, name: string) => {
      const target = playlistsRef.current.find((playlist) => playlist.id === playlistId);
      if (!target) return;
      const updated = renamePlaylistPure(target, name);
      const next = playlistsRef.current.map((playlist) =>
        playlist.id === playlistId ? updated : playlist,
      );
      setPlaylistsSafe(next);
      try {
        await putPlaylist(updated);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      setPlaylistsSafe(playlistsRef.current.filter((playlist) => playlist.id !== playlistId));
      try {
        await deletePlaylistDb(playlistId);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, track: Track): Promise<boolean> => {
      const target = playlistsRef.current.find((playlist) => playlist.id === playlistId);
      if (!target) return false;
      if (target.trackIds.includes(track.id)) {
        toast(`Already in “${target.name}”.`, "info");
        return false;
      }
      if (track.source === "online") await saveTrack(track);
      const updated = addTrackPure(target, track.id);
      const next = playlistsRef.current.map((playlist) =>
        playlist.id === playlistId ? updated : playlist,
      );
      setPlaylistsSafe(next);
      try {
        await putPlaylist(updated);
      } catch (error) {
        reportStorageError(error);
      }
      toast(`Added to “${updated.name}”.`, "success");
      return true;
    },
    [reportStorageError, saveTrack, setPlaylistsSafe, toast],
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const target = playlistsRef.current.find((playlist) => playlist.id === playlistId);
      if (!target) return;
      const updated = removeTrackPure(target, trackId);
      const next = playlistsRef.current.map((playlist) =>
        playlist.id === playlistId ? updated : playlist,
      );
      setPlaylistsSafe(next);
      try {
        await putPlaylist(updated);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const movePlaylistTrack = useCallback(
    async (playlistId: string, from: number, to: number) => {
      const target = playlistsRef.current.find((playlist) => playlist.id === playlistId);
      if (!target) return;
      const updated = moveTrackPure(target, from, to);
      if (updated === target) return;
      const next = playlistsRef.current.map((playlist) =>
        playlist.id === playlistId ? updated : playlist,
      );
      setPlaylistsSafe(next);
      try {
        await putPlaylist(updated);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const exportPlaylistsJson = useCallback(
    () => JSON.stringify(createPlaylistExport(playlistsRef.current), null, 2),
    [],
  );

  const importPlaylistsJson = useCallback(
    async (json: string) => {
      const { playlists: imported, warnings } = parsePlaylistExport(json);
      const byId = new Map(playlistsRef.current.map((playlist) => [playlist.id, playlist]));
      for (const playlist of imported) {
        const existing = byId.get(playlist.id);
        byId.set(
          playlist.id,
          existing
            ? { ...playlist, name: existing.name === playlist.name ? playlist.name : `${playlist.name} (imported)` }
            : playlist,
        );
      }
      const next = Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      setPlaylistsSafe(next);
      try {
        await Promise.all(imported.map((playlist) => putPlaylist(playlist)));
      } catch (error) {
        reportStorageError(error);
      }
      return { imported: imported.length, warnings };
    },
    [reportStorageError, setPlaylistsSafe],
  );

  const saveLyrics = useCallback(
    async (trackId: string, raw: string): Promise<LyricsRecord> => {
      const parsed = parseLyrics(raw);
      if (!parsed.lines.length) {
        throw new Error("No lyric lines were found. Paste lyrics or choose an LRC file.");
      }
      const existing = lyricsRef.current[trackId];
      const record: LyricsRecord = {
        trackId,
        format: parsed.format,
        raw,
        lines: parsed.lines,
        meta: parsed.meta,
        offsetMs: existing?.offsetMs ?? 0,
        updatedAt: Date.now(),
      };
      const next = { ...lyricsRef.current, [trackId]: record };
      setLyricsSafe(next);
      try {
        await putLyrics(record);
      } catch (error) {
        reportStorageError(error);
      }
      return record;
    },
    [reportStorageError, setLyricsSafe],
  );

  const setLyricsOffset = useCallback(
    async (trackId: string, offsetMs: number) => {
      const existing = lyricsRef.current[trackId];
      if (!existing) return;
      const updated: LyricsRecord = {
        ...existing,
        offsetMs: clamp(Math.round(offsetMs), -30_000, 30_000),
        updatedAt: Date.now(),
      };
      setLyricsSafe({ ...lyricsRef.current, [trackId]: updated });
      try {
        await putLyrics(updated);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setLyricsSafe],
  );

  const removeLyrics = useCallback(
    async (trackId: string) => {
      const next = { ...lyricsRef.current };
      delete next[trackId];
      setLyricsSafe(next);
      try {
        await deleteLyricsDb(trackId);
      } catch (error) {
        reportStorageError(error);
      }
    },
    [reportStorageError, setLyricsSafe],
  );

  const getLyrics = useCallback((trackId: string) => lyricsRef.current[trackId], []);

  const localTracks = useMemo(() => tracks.filter((track) => track.source === "local"), [tracks]);
  const onlineTracks = useMemo(() => tracks.filter((track) => track.source === "online"), [tracks]);
  const favoriteTracks = useMemo(
    () =>
      favorites
        .map((id) => tracks.find((track) => track.id === id))
        .filter((track): track is Track => Boolean(track)),
    [favorites, tracks],
  );

  const playlistTracks = useCallback(
    (playlist: Playlist) =>
      playlist.trackIds
        .map((id) => tracksRef.current.find((track) => track.id === id))
        .filter((track): track is Track => Boolean(track)),
    [],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      hydrated,
      storageAvailable,
      storageError,
      clearStorageError: () => setStorageError(null),
      tracks,
      localTracks,
      onlineTracks,
      playlists,
      favorites,
      favoriteTracks,
      recent,
      lyrics,
      importState,
      importFiles,
      importDemoTrack,
      removeTrack,
      clearLocalLibrary,
      clearAllData,
      toggleFavorite,
      isFavorite,
      addRecent,
      saveTrack,
      getTrack,
      resolveLocalSource,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      movePlaylistTrack,
      exportPlaylistsJson,
      importPlaylistsJson,
      saveLyrics,
      setLyricsOffset,
      removeLyrics,
      getLyrics,
      playlistTracks,
    }),
    [
      addRecent,
      addTrackToPlaylist,
      clearAllData,
      clearLocalLibrary,
      createPlaylist,
      deletePlaylist,
      exportPlaylistsJson,
      favoriteTracks,
      favorites,
      getLyrics,
      getTrack,
      hydrated,
      importDemoTrack,
      importFiles,
      importPlaylistsJson,
      importState,
      isFavorite,
      localTracks,
      lyrics,
      movePlaylistTrack,
      onlineTracks,
      playlistTracks,
      playlists,
      recent,
      removeLyrics,
      removeTrack,
      removeTrackFromPlaylist,
      renamePlaylist,
      resolveLocalSource,
      saveLyrics,
      saveTrack,
      setLyricsOffset,
      storageAvailable,
      storageError,
      toggleFavorite,
      tracks,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used inside LibraryProvider");
  return context;
}

