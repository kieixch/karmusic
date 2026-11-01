"use client";

import { useEffect } from "react";
import type { Track } from "@/types/track";

interface MediaSessionOptions {
  track: Track | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
}

interface MediaSessionLike {
  metadata: unknown;
  playbackState: "none" | "paused" | "playing";
  setActionHandler: (action: string, handler: ((details?: unknown) => void) | null) => void;
  setPositionState?: (state?: { duration: number; playbackRate: number; position: number }) => void;
}

function getSession(): MediaSessionLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { mediaSession?: MediaSessionLike }).mediaSession ?? null;
}

/** Progressive enhancement: no-op where the Media Session API is unavailable. */
export function useMediaSession({
  track,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
}: MediaSessionOptions) {
  useEffect(() => {
    const session = getSession();
    if (!session) return;

    if (typeof MediaMetadata !== "undefined" && track) {
      const artwork = track.artworkUrl
        ? [
            { src: track.artworkUrl, sizes: "500x500", type: "image/webp" },
            { src: track.artworkUrl, sizes: "512x512" },
          ]
        : [];
      session.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album ?? (track.source === "local" ? "Local library" : "KarMusic Online"),
        artwork,
      });
    } else if (!track) {
      session.metadata = null;
    }

    try {
      session.setActionHandler("play", () => onPlay());
      session.setActionHandler("pause", () => onPause());
      session.setActionHandler("nexttrack", () => onNext());
      session.setActionHandler("previoustrack", () => onPrevious());
      session.setActionHandler("seekto", (details) => {
        const seekTime = (details as { seekTime?: number } | undefined)?.seekTime;
        if (typeof seekTime === "number") onSeek(seekTime);
      });
    } catch {
      // Some browsers expose mediaSession but reject action handlers.
    }
    session.playbackState = track ? (isPlaying ? "playing" : "paused") : "none";

    return () => {
      try {
        session.setActionHandler("play", null);
        session.setActionHandler("pause", null);
        session.setActionHandler("nexttrack", null);
        session.setActionHandler("previoustrack", null);
        session.setActionHandler("seekto", null);
      } catch {
        // ignore
      }
    };
  }, [track, isPlaying, onPlay, onPause, onNext, onPrevious, onSeek]);
}
