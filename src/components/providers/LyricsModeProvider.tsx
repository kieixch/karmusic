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
import { useOrientation, type Orientation } from "@/hooks/useOrientation";
import { useToast } from "./ToastProvider";

interface OrientationLockLike {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
  type?: string;
}

interface LyricsModeContextValue {
  open: boolean;
  isFullscreen: boolean;
  orientation: Orientation;
  isPortrait: boolean;
  orientationLocked: boolean;
  orientationNote: string | null;
  openLyricsMode: (options?: { immersive?: boolean }) => void;
  closeLyricsMode: () => void;
  toggleFullscreen: () => void;
}

const LyricsModeContext = createContext<LyricsModeContextValue | null>(null);

function getOrientationApi(): OrientationLockLike | null {
  if (typeof screen === "undefined") return null;
  return (screen as Screen & { orientation?: OrientationLockLike }).orientation ?? null;
}

export function LyricsModeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [orientationNote, setOrientationNote] = useState<string | null>(null);
  const acquiredFullscreen = useRef(false);
  const orientation = useOrientation();
  const isPortrait = orientation === "portrait";

  const unlockOrientation = useCallback(() => {
    try {
      getOrientationApi()?.unlock?.();
    } catch {
      // ignore
    }
    setOrientationLocked(false);
  }, []);

  const tryLockLandscape = useCallback(async () => {
    const api = getOrientationApi();
    if (!api?.lock) {
      setOrientationNote("Orientation lock is not supported here. Rotate your phone to landscape manually.");
      return;
    }
    try {
      await api.lock("landscape");
      setOrientationLocked(true);
      setOrientationNote(null);
    } catch {
      setOrientationNote("Your browser declined the orientation lock. Rotate your phone to landscape manually.");
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      setIsFullscreen(true);
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
      acquiredFullscreen.current = true;
      setIsFullscreen(true);
      void tryLockLandscape();
    } catch {
      setIsFullscreen(false);
      setOrientationNote("Fullscreen was not available. Lyrics Mode still works in your browser window.");
      toast("Fullscreen was not available. Lyrics Mode still works.", "info");
    }
  }, [toast, tryLockLandscape]);

  const exitFullscreenIfAcquired = useCallback(async () => {
    unlockOrientation();
    if (!acquiredFullscreen.current) return;
    acquiredFullscreen.current = false;
    if (typeof document !== "undefined" && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, [unlockOrientation]);

  const openLyricsMode = useCallback(
    (options?: { immersive?: boolean }) => {
      setOpen(true);
      if (options?.immersive !== false) {
        void enterFullscreen();
      } else {
        void tryLockLandscape();
      }
    },
    [enterFullscreen, tryLockLandscape],
  );

  const closeLyricsMode = useCallback(() => {
    setOpen(false);
    void exitFullscreenIfAcquired();
  }, [exitFullscreenIfAcquired]);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      void exitFullscreenIfAcquired();
    } else {
      void enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreenIfAcquired]);

  useEffect(() => {
    const onChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        acquiredFullscreen.current = false;
        setOrientationLocked(false);
      } else {
        void tryLockLandscape();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [tryLockLandscape]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      try {
        getOrientationApi()?.unlock?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      open,
      isFullscreen,
      orientation,
      isPortrait,
      orientationLocked,
      orientationNote,
      openLyricsMode,
      closeLyricsMode,
      toggleFullscreen,
    }),
    [
      open,
      isFullscreen,
      orientation,
      isPortrait,
      orientationLocked,
      orientationNote,
      openLyricsMode,
      closeLyricsMode,
      toggleFullscreen,
    ],
  );

  return <LyricsModeContext.Provider value={value}>{children}</LyricsModeContext.Provider>;
}

export function useLyricsMode(): LyricsModeContextValue {
  const context = useContext(LyricsModeContext);
  if (!context) throw new Error("useLyricsMode must be used inside LyricsModeProvider");
  return context;
}
