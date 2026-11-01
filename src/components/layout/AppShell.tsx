"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { StorageBanner } from "./StorageBanner";
import { ImportProgress } from "./ImportProgress";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { NavigationRecovery } from "./NavigationRecovery";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { LyricsModeOverlay } from "@/components/lyrics/LyricsModeOverlay";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isImmersive = pathname === "/now-playing";

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <MobileHeader />
        <StorageBanner />
        <main
          id="main"
          className={cn(
            "mx-auto w-full max-w-[1400px] px-4 pb-40 pt-5 sm:px-6 lg:px-8 lg:pb-32 lg:pt-8",
            isImmersive && "pb-44 lg:pb-36",
          )}
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <MiniPlayer />
      <LyricsModeOverlay />
      <ImportProgress />
      <NavigationRecovery />
      <KeyboardShortcuts />
      <ServiceWorkerRegister />
    </div>
  );
}
