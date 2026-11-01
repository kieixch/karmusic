"use client";

import Link from "next/link";
import { Settings, ScrollText } from "lucide-react";
import { Logo } from "./Logo";
import { IconButton } from "@/components/ui/IconButton";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";

export function MobileHeader() {
  const { currentTrack } = usePlayer();
  const { openLyricsMode } = useLyricsMode();

  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Logo compact />
      <div className="flex items-center gap-1">
        <IconButton
          label="Open Lyrics Mode"
          size="sm"
          disabled={!currentTrack}
          onClick={() => openLyricsMode({ immersive: true })}
          className="text-accent/80"
        >
          <ScrollText aria-hidden />
        </IconButton>
        <Link
          href="/settings"
          aria-label="Settings"
          className="focus-ring inline-flex size-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
        >
          <Settings className="size-[18px]" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
