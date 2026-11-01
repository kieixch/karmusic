"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorSmartphone, ScrollText } from "lucide-react";
import { Logo } from "./Logo";
import { discoverNav, musicNav, settingsNav } from "./nav-items";
import { cn } from "@/lib/utils/cn";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { useLyricsMode } from "@/components/providers/LyricsModeProvider";
import { Button } from "@/components/ui/Button";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/library") return pathname === "/library";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentTrack } = usePlayer();
  const { openLyricsMode } = useLyricsMode();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/[0.06] bg-ink-900/70 px-4 pb-4 pt-6 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Discover
        </p>
        {discoverNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href, item.exact)} />
        ))}
        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Your music
        </p>
        {musicNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href, item.exact)} />
        ))}
      </nav>

      <div className="mt-4 space-y-2">
        <div className="rounded-2xl border border-accent/15 bg-accent/[0.05] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <MonitorSmartphone className="size-4" aria-hidden />
            Landscape lyrics
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
            Rotate your phone while playing to read lyrics full screen.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 w-full"
            disabled={!currentTrack}
            onClick={() => openLyricsMode({ immersive: false })}
          >
            <ScrollText className="size-3.5" aria-hidden />
            Open Lyrics Mode
          </Button>
        </div>
        <NavLink item={settingsNav} active={isActive(pathname, settingsNav.href)} />
        <p className="px-3 pt-1 text-[10px] leading-relaxed text-white/25">
          Local-first. No account. No tracking.
        </p>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof discoverNav[number]["icon"] };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-white/[0.07] text-white"
          : "text-white/55 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      <Icon className={cn("size-[18px]", active && "text-accent")} aria-hidden />
      {item.label}
    </Link>
  );
}
