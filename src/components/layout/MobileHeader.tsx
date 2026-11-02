"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, ScrollText } from "lucide-react";
import { Logo } from "./Logo";
import { IconButton } from "@/components/ui/IconButton";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { cn } from "@/lib/utils/cn";

export function MobileHeader({ overAmbient = false }: { overAmbient?: boolean }) {
  const { currentTrack } = usePlayer();
  const { openLyricsMode } = useLyricsMode();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overAmbient) {
      setScrolled(false);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overAmbient]);

  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 lg:hidden",
        overAmbient && !scrolled
          ? "border-transparent bg-transparent shadow-none"
          : "border-white/[0.06] bg-ink-950/80",
        overAmbient && scrolled && "shadow-[0_12px_32px_rgba(0,0,0,0.28)]",
      )}
    >
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
