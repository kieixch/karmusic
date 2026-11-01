"use client";

import { useEffect } from "react";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";

/** Desktop keyboard shortcuts. Ignored while typing or inside dialogs. */
export function KeyboardShortcuts() {
  const { togglePlay, next, previous, seekBy, toggleMute, currentTrack } = usePlayer();
  const { openLyricsMode } = useLyricsMode();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))
      ) {
        return;
      }
      if (target?.closest("[role='dialog']")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case " ":
          event.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(5);
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-5);
          break;
        case "n":
        case "N":
          next();
          break;
        case "p":
        case "P":
          previous();
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "l":
        case "L":
          if (currentTrack) openLyricsMode({ immersive: false });
          break;
        case "/":
          event.preventDefault();
          document.querySelector<HTMLInputElement>("[data-search-input]")?.focus();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentTrack, next, openLyricsMode, previous, seekBy, toggleMute, togglePlay]);

  return null;
}
