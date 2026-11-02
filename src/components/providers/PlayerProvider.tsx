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
import { AudioEngine } from "@/lib/audio/AudioEngine";
import { refreshOnlineTrack } from "@/lib/providers/client";
import { clamp } from "@/lib/utils/format";
import type { Track } from "@/types/track";
import { useLibrary } from "./LibraryProvider";
import { useSettings } from "./SettingsProvider";
import { useToast } from "./ToastProvider";
import { useMediaSession } from "@/hooks/useMediaSession";

export type RepeatMode = "off" | "all" | "one";

interface PersistedPlayerPrefs {
  volume: number;
  muted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
}

const PREFS_KEY = "karmusic.player.v1";
const DEFAULT_PREFS: PersistedPlayerPrefs = {
  volume: 0.85,
  muted: false,
  repeatMode: "off",
  shuffle: false,
};

function loadPrefs(): PersistedPlayerPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PersistedPlayerPrefs>;
    return {
      volume: clamp(typeof parsed.volume === "number" ? parsed.volume : 0.85, 0, 1),
      muted: parsed.muted === true,
      repeatMode: parsed.repeatMode === "all" || parsed.repeatMode === "one" ? parsed.repeatMode : "off",
      shuffle: parsed.shuffle === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  error: string | null;
  repeatMode: RepeatMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
  playTrack: (track: Track, queue?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setShuffle: (shuffle: boolean) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  jumpToQueueIndex: (index: number) => void;
  retry: () => void;
  clearError: () => void;
}

interface ClockContextValue {
  currentTime: number;
  duration: number;
  buffered: number;
  seeking: boolean;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
const ClockContext = createContext<ClockContextValue | null>(null);

function PlaybackClock({
  engine,
  children,
}: {
  engine: AudioEngine | null;
  children: ReactNode;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    if (!engine) return;
    let frame = 0;
    let lastUpdate = 0;

    const update = (audio: HTMLAudioElement) => {
      setCurrentTime(audio.currentTime || 0);
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      try {
        if (audio.buffered.length && Number.isFinite(audio.duration) && audio.duration > 0) {
          const end = audio.buffered.end(audio.buffered.length - 1);
          setBuffered(Math.min(1, end / audio.duration));
        }
      } catch {
        // ignore
      }
    };

    const onTime = (audio: HTMLAudioElement) => {
      const now = performance.now();
      if (now - lastUpdate < 120) return;
      lastUpdate = now;
      update(audio);
    };

    const tick = () => {
      if (!engine.audio.paused) {
        const now = performance.now();
        if (now - lastUpdate >= 120) {
          lastUpdate = now;
          update(engine.audio);
        }
        frame = requestAnimationFrame(tick);
      }
    };

    const unsubs = [
      engine.on("timeupdate", onTime),
      engine.on("loadedmetadata", (audio) => {
        update(audio);
        frame = requestAnimationFrame(tick);
      }),
      engine.on("durationchange", (audio) => {
        if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      }),
      engine.on("seeked", update),
      engine.on("progress", update),
      engine.on("play", () => {
        setSeeking(false);
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
      }),
      engine.on("pause", () => {
        cancelAnimationFrame(frame);
        update(engine.audio);
      }),
      engine.on("emptied", () => {
        setCurrentTime(0);
        setDuration(0);
        setBuffered(0);
      }),
    ];

    return () => {
      cancelAnimationFrame(frame);
      for (const unsubscribe of unsubs) unsubscribe();
    };
  }, [engine]);

  const seek = useCallback(
    (seconds: number) => {
      if (!engine) return;
      engine.seek(seconds);
      setCurrentTime(clamp(seconds, 0, duration || seconds));
    },
    [engine, duration],
  );

  const value = useMemo(
    () => ({ currentTime, duration, buffered, seeking, seek }),
    [currentTime, duration, buffered, seeking, seek],
  );

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated, updateSettings } = useSettings();
  const { resolveLocalSource, addRecent, syncLocalTrackDuration } = useLibrary();
  const { toast } = useToast();

  const [engine] = useState<AudioEngine | null>(() =>
    typeof window !== "undefined" ? new AudioEngine() : null,
  );
  const [prefs] = useState<PersistedPlayerPrefs>(() => loadPrefs());
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndexState] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(prefs.repeatMode);
  const [shuffle, setShuffleState] = useState(prefs.shuffle);
  const [volume, setVolumeState] = useState(prefs.volume);
  const [muted, setMutedState] = useState(prefs.muted);
  const [prefsReady, setPrefsReady] = useState(false);

  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(-1);
  const trackRef = useRef<Track | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const repeatRef = useRef<RepeatMode>(prefs.repeatMode);
  const shuffleRef = useRef(prefs.shuffle);
  const volumeRef = useRef(prefs.volume);
  const mutedRef = useRef(prefs.muted);
  const lastAudibleVolumeRef = useRef(prefs.volume > 0 ? prefs.volume : DEFAULT_PREFS.volume);
  const loadTokenRef = useRef(0);
  const retriedRef = useRef(new Set<string>());
  const settingsHydratedRef = useRef(false);

  const setQueue = useCallback((next: Track[]) => {
    queueRef.current = next;
    setQueueState(next);
  }, []);
  const setQueueIndex = useCallback((next: number) => {
    indexRef.current = next;
    setQueueIndexState(next);
  }, []);
  const setCurrent = useCallback((next: Track | null) => {
    trackRef.current = next;
    currentTrackIdRef.current = next?.id ?? null;
    setCurrentTrack(next);
  }, []);
  const setRepeat = useCallback((next: RepeatMode) => {
    repeatRef.current = next;
    setRepeatModeState(next);
  }, []);
  const setShuffleStateSafe = useCallback((next: boolean) => {
    shuffleRef.current = next;
    setShuffleState(next);
  }, []);
  const setMuted = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMutedState(next);
  }, []);
  const setVolumeSafe = useCallback((next: number) => {
    volumeRef.current = next;
    setVolumeState(next);
  }, []);

  useEffect(() => {
    if (!engine) return;
    engine.setVolume(volumeRef.current, mutedRef.current);
    setPrefsReady(true);
    return () => engine.destroy();
  }, [engine]);

  // Apply the saved default volume once settings hydrate. Player preferences
  // in localStorage take precedence when they already set a non-zero volume.
  useEffect(() => {
    if (!hydrated || !engine || settingsHydratedRef.current) return;
    settingsHydratedRef.current = true;
    if (!volumeRef.current) {
      engine.setVolume(settings.defaultVolume, mutedRef.current);
      setVolumeSafe(settings.defaultVolume);
    }
  }, [hydrated, engine, settings.defaultVolume, setVolumeSafe]);

  useEffect(() => {
    if (!engine) return;
    engine.setVolume(volumeRef.current, mutedRef.current);
    engine.setPlaybackRate(settings.playbackRate);
  }, [engine, volume, muted, settings.playbackRate]);

  useEffect(() => {
    if (!prefsReady) return;
    const payload: PersistedPlayerPrefs = {
      volume: volumeRef.current,
      muted: mutedRef.current,
      repeatMode: repeatRef.current,
      shuffle: shuffleRef.current,
    };
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [volume, muted, repeatMode, shuffle, prefsReady]);

  const handlePlaybackError = useCallback(
    async (track: Track | null, token: number) => {
      if (!track || !engine) return;
      if (token !== loadTokenRef.current) return;
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
      if (track.source === "online" && track.providerTrackId && !retriedRef.current.has(track.id)) {
        retriedRef.current.add(track.id);
        setError("The stream may have expired. Refreshing the track…");
        const fresh = await refreshOnlineTrack(track);
        if (token !== loadTokenRef.current) return;
        if (fresh?.playbackUrl) {
          const updated = { ...track, ...fresh, addedAt: track.addedAt };
          setCurrent(updated);
          setQueue(queueRef.current.map((item) => (item.id === updated.id ? updated : item)));
          engine.setSource(fresh.playbackUrl);
          try {
            await engine.play();
            setError(null);
            setIsPlaying(true);
            return;
          } catch {
            // fall through to error state
          }
        }
      }
      const code = engine.audio.error?.code;
      const networkError =
        typeof MediaError !== "undefined" && code === MediaError.MEDIA_ERR_NETWORK;
      const message =
        track.source === "local"
          ? "Could not play this local file. The browser may not support its codec, or the stored file is missing."
          : networkError
            ? "The online track could not be streamed. Check your connection or try another track."
            : "This online track is unavailable right now. It may have been removed by the provider.";
      setError(message);
      toast(message, "error");
    },
    [engine, setCurrent, setQueue, toast],
  );

  const loadTrack = useCallback(
    async (track: Track, autoplay: boolean) => {
      if (!engine) return;
      const token = ++loadTokenRef.current;
      setError(null);
      setIsLoading(true);
      setIsBuffering(true);
      setCurrent(track);

      let src: string | null = null;
      try {
        if (track.source === "local") {
          src = await resolveLocalSource(track);
        } else {
          src = track.playbackUrl ?? null;
          if (!src) {
            const fresh = await refreshOnlineTrack(track);
            if (fresh?.playbackUrl) {
              src = fresh.playbackUrl;
              const updated = { ...track, ...fresh, addedAt: track.addedAt };
              setCurrent(updated);
              setQueue(queueRef.current.map((item) => (item.id === updated.id ? updated : item)));
            }
          }
        }
      } catch (sourceError) {
        if (token !== loadTokenRef.current) return;
        const message =
          sourceError instanceof Error
            ? sourceError.message
            : "Could not load the audio for this track.";
        setError(message);
        setIsLoading(false);
        setIsBuffering(false);
        setIsPlaying(false);
        toast(message, "error");
        return;
      }
      if (token !== loadTokenRef.current) return;
      if (!src) {
        const message = "No authorized playback source is available for this track.";
        setError(message);
        setIsLoading(false);
        setIsBuffering(false);
        toast(message, "error");
        return;
      }

      engine.setSource(src);
      engine.setVolume(volumeRef.current, mutedRef.current);
      engine.setPlaybackRate(settings.playbackRate);
      setCurrent(track);
      addRecent(track);

      if (autoplay) {
        try {
          await engine.play();
          if (token !== loadTokenRef.current) return;
          setIsPlaying(true);
          retriedRef.current.delete(track.id);
        } catch (playError) {
          if (token !== loadTokenRef.current) return;
          if ((playError as Error)?.name === "NotAllowedError") {
            setIsPlaying(false);
            setIsLoading(false);
            setIsBuffering(false);
            toast("Tap play to start audio (your browser blocked autoplay).", "info");
          } else {
            await handlePlaybackError(trackRef.current, token);
          }
        }
      } else {
        setIsPlaying(false);
      }
    },
    [
      addRecent,
      engine,
      handlePlaybackError,
      resolveLocalSource,
      setCurrent,
      setQueue,
      settings.playbackRate,
      toast,
    ],
  );

  const playTrack = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      const resolvedQueue = nextQueue && nextQueue.length ? nextQueue : [track];
      const index = Math.max(0, resolvedQueue.findIndex((item) => item.id === track.id));
      setQueue(resolvedQueue);
      setQueueIndex(index);
      if (trackRef.current?.id === track.id) {
        setError(null);
        if (engine) {
          void engine.play().then(() => setIsPlaying(true)).catch(() => {
            void loadTrack(track, true);
          });
        }
        return;
      }
      void loadTrack(track, true);
    },
    [engine, loadTrack, setQueue, setQueueIndex],
  );

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (!tracks.length) return;
      const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
      setQueue(tracks);
      setQueueIndex(index);
      void loadTrack(tracks[index], true);
    },
    [loadTrack, setQueue, setQueueIndex],
  );

  const playAt = useCallback(
    (index: number, list: Track[]) => {
      if (index < 0 || index >= list.length) return;
      setQueueIndex(index);
      void loadTrack(list[index], true);
    },
    [loadTrack, setQueueIndex],
  );

  const next = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    if (shuffleRef.current && list.length > 1) {
      let candidate = indexRef.current;
      while (candidate === indexRef.current) {
        candidate = Math.floor(Math.random() * list.length);
      }
      playAt(candidate, list);
      return;
    }
    const nextIndex = indexRef.current + 1;
    if (nextIndex < list.length) {
      playAt(nextIndex, list);
      return;
    }
    if (repeatRef.current === "all") {
      playAt(0, list);
      return;
    }
    toast("End of the queue.", "info");
    setIsPlaying(false);
    engine?.pause();
  }, [engine, playAt, toast]);

  const previous = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    if (engine && engine.currentTime > 3) {
      engine.seek(0);
      return;
    }
    if (indexRef.current > 0) {
      playAt(indexRef.current - 1, list);
      return;
    }
    if (repeatRef.current === "all" && list.length > 1) {
      playAt(list.length - 1, list);
      return;
    }
    if (engine) engine.seek(0);
  }, [engine, playAt]);

  const handleEnded = useCallback(() => {
    if (repeatRef.current === "one") {
      if (engine) {
        engine.seek(0);
        void engine.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      return;
    }
    const list = queueRef.current;
    if (!list.length) return;
    const nextIndex = indexRef.current + 1;
    if (shuffleRef.current && list.length > 1) {
      let candidate = indexRef.current;
      while (candidate === indexRef.current) {
        candidate = Math.floor(Math.random() * list.length);
      }
      playAt(candidate, list);
      return;
    }
    if (nextIndex < list.length) {
      playAt(nextIndex, list);
    } else if (repeatRef.current === "all") {
      playAt(0, list);
    } else {
      setIsPlaying(false);
    }
  }, [engine, playAt]);

  useEffect(() => {
    if (!engine) return;
    const unsubs = [
      engine.on("playing", () => {
        setIsPlaying(true);
        setIsBuffering(false);
        setIsLoading(false);
      }),
      engine.on("play", () => setIsPlaying(true)),
      engine.on("pause", () => setIsPlaying(false)),
      engine.on("waiting", () => setIsBuffering(true)),
      engine.on("canplay", () => setIsBuffering(false)),
      engine.on("loadedmetadata", (audio) => {
        setIsLoading(false);
        const track = trackRef.current;
        if (track?.source !== "local" || !Number.isFinite(audio.duration)) return;
        const updated = syncLocalTrackDuration(track.id, audio.duration);
        if (!updated) return;
        setCurrent(updated);
        setQueue(queueRef.current.map((item) => (item.id === updated.id ? updated : item)));
      }),
      engine.on("ended", () => handleEnded()),
      engine.on("error", () => {
        void handlePlaybackError(trackRef.current, loadTokenRef.current);
      }),
    ];
    return () => {
      for (const unsubscribe of unsubs) unsubscribe();
    };
  }, [
    engine,
    handleEnded,
    handlePlaybackError,
    setCurrent,
    setQueue,
    syncLocalTrackDuration,
  ]);

  useEffect(() => {
    if (!engine) return;
    const onRemoved = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      const nextQueue = queueRef.current.filter((track) => track.id !== id);
      const removedCurrent = trackRef.current?.id === id;
      if (nextQueue.length !== queueRef.current.length) {
        setQueue(nextQueue);
      }
      if (removedCurrent) {
        engine.pause();
        engine.clearSource();
        setCurrent(null);
        setIsPlaying(false);
        setIsLoading(false);
        setIsBuffering(false);
        indexRef.current = -1;
        setQueueIndexState(-1);
        const replacement = nextQueue[0];
        if (replacement) {
          setQueueIndex(0);
          void loadTrack(replacement, false);
        }
      }
    };
    const onCleared = () => {
      engine.pause();
      engine.clearSource();
      setQueue([]);
      setQueueIndex(-1);
      setCurrent(null);
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);
    };
    window.addEventListener("karmusic:track-removed", onRemoved);
    window.addEventListener("karmusic:library-cleared", onCleared);
    return () => {
      window.removeEventListener("karmusic:track-removed", onRemoved);
      window.removeEventListener("karmusic:library-cleared", onCleared);
    };
  }, [engine, loadTrack, setCurrent, setQueue, setQueueIndex]);

  const togglePlay = useCallback(() => {
    if (!engine) return;
    if (!trackRef.current) return;
    if (engine.audio.paused) {
      const token = loadTokenRef.current;
      setError(null);
      void engine.play().then(() => {
        if (token === loadTokenRef.current) setIsPlaying(true);
      }).catch((playError) => {
        if ((playError as Error)?.name === "NotAllowedError") {
          toast("Tap play to start audio (your browser blocked autoplay).", "info");
          return;
        }
        void handlePlaybackError(trackRef.current, token);
      });
    } else {
      engine.pause();
      setIsPlaying(false);
    }
  }, [engine, handlePlaybackError, toast]);

  const seek = useCallback(
    (seconds: number) => {
      if (!engine) return;
      engine.seek(clamp(seconds, 0, Number.isFinite(engine.audio.duration) ? engine.audio.duration : seconds));
    },
    [engine],
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      if (!engine) return;
      engine.seek(engine.currentTime + deltaSeconds);
    },
    [engine],
  );

  const setVolume = useCallback(
    (nextVolume: number) => {
      const clamped = clamp(nextVolume, 0, 1);
      setVolumeSafe(clamped);
      if (clamped > 0) {
        lastAudibleVolumeRef.current = clamped;
      }
      const nextMuted = clamped <= 0;
      setMuted(nextMuted);
      engine?.setVolume(clamped, nextMuted);
      updateSettings({ defaultVolume: clamped });
    },
    [engine, setMuted, setVolumeSafe, updateSettings],
  );

  const toggleMute = useCallback(() => {
    if (mutedRef.current || volumeRef.current <= 0) {
      const restore =
        lastAudibleVolumeRef.current > 0 ? lastAudibleVolumeRef.current : DEFAULT_PREFS.volume;
      setVolumeSafe(restore);
      setMuted(false);
      engine?.setVolume(restore, false);
      updateSettings({ defaultVolume: restore });
      return;
    }
    lastAudibleVolumeRef.current = volumeRef.current;
    setMuted(true);
    engine?.setVolume(volumeRef.current, true);
    updateSettings({ defaultVolume: volumeRef.current });
  }, [engine, setMuted, setVolumeSafe, updateSettings]);

  const setRepeatMode = useCallback(
    (mode: RepeatMode) => {
      setRepeat(mode);
    },
    [setRepeat],
  );

  const cycleRepeatMode = useCallback(() => {
    const nextMode = repeatRef.current === "off" ? "all" : repeatRef.current === "all" ? "one" : "off";
    setRepeat(nextMode);
  }, [setRepeat]);

  const setShuffle = useCallback(
    (nextShuffle: boolean) => {
      setShuffleStateSafe(nextShuffle);
    },
    [setShuffleStateSafe],
  );

  const addToQueue = useCallback(
    (track: Track) => {
      if (queueRef.current.some((item) => item.id === track.id)) {
        toast("That track is already in the queue.", "info");
        return;
      }
      const nextQueue = [...queueRef.current, track];
      setQueue(nextQueue);
      if (indexRef.current === -1) {
        setQueueIndex(0);
        setCurrent(track);
        void loadTrack(track, false);
      }
      toast("Added to the queue.", "success");
    },
    [loadTrack, setCurrent, setQueue, setQueueIndex, toast],
  );

  const playNext = useCallback(
    (track: Track) => {
      if (indexRef.current === -1) {
        setQueue([track]);
        setQueueIndex(0);
        void loadTrack(track, true);
        return;
      }
      if (queueRef.current.some((item) => item.id === track.id)) {
        toast("That track is already in the queue.", "info");
        return;
      }
      const nextQueue = [...queueRef.current];
      nextQueue.splice(indexRef.current + 1, 0, track);
      setQueue(nextQueue);
      toast("Playing next.", "success");
    },
    [loadTrack, setQueue, setQueueIndex, toast],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      const list = queueRef.current;
      if (index < 0 || index >= list.length) return;
      const removed = list[index];
      const nextQueue = list.filter((_, itemIndex) => itemIndex !== index);
      if (index === indexRef.current) {
        engine?.pause();
        setQueue(nextQueue);
        if (!nextQueue.length) {
          setQueueIndex(-1);
          setCurrent(null);
          engine?.clearSource();
          setIsPlaying(false);
          return;
        }
        const nextIndex = Math.min(index, nextQueue.length - 1);
        setQueueIndex(nextIndex);
        void loadTrack(nextQueue[nextIndex], false);
        return;
      }
      setQueue(nextQueue);
      if (index < indexRef.current) setQueueIndex(indexRef.current - 1);
      toast(`Removed ${removed.title} from the queue.`, "info");
    },
    [engine, loadTrack, setCurrent, setQueue, setQueueIndex, toast],
  );

  const clearQueue = useCallback(() => {
    engine?.pause();
    engine?.clearSource();
    setQueue([]);
    setQueueIndex(-1);
    setCurrent(null);
    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);
    setError(null);
  }, [engine, setCurrent, setQueue, setQueueIndex]);

  const jumpToQueueIndex = useCallback(
    (index: number) => {
      playAt(index, queueRef.current);
    },
    [playAt],
  );

  const retry = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    retriedRef.current.delete(track.id);
    void loadTrack(track, true);
  }, [loadTrack]);

  useMediaSession({
    track: currentTrack,
    isPlaying,
    onPlay: togglePlay,
    onPause: () => engine?.pause(),
    onNext: next,
    onPrevious: previous,
    onSeek: seek,
  });

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isBuffering,
      isLoading,
      error,
      repeatMode,
      shuffle,
      volume,
      muted,
      playTrack,
      playQueue,
      togglePlay,
      next,
      previous,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      setRepeatMode,
      cycleRepeatMode,
      setShuffle,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      jumpToQueueIndex,
      retry,
      clearError: () => setError(null),
    }),
    [
      addToQueue,
      clearQueue,
      currentTrack,
      cycleRepeatMode,
      error,
      isBuffering,
      isLoading,
      isPlaying,
      jumpToQueueIndex,
      muted,
      next,
      playNext,
      playQueue,
      playTrack,
      previous,
      queue,
      queueIndex,
      removeFromQueue,
      repeatMode,
      retry,
      seek,
      seekBy,
      setRepeatMode,
      setShuffle,
      setVolume,
      shuffle,
      toggleMute,
      togglePlay,
      volume,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      <PlaybackClock engine={engine}>{children}</PlaybackClock>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}

export function usePlaybackClock(): ClockContextValue {
  const context = useContext(ClockContext);
  if (!context) throw new Error("usePlaybackClock must be used inside PlayerProvider");
  return context;
}

