"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "./ToastProvider";
import { SettingsProvider } from "./SettingsProvider";
import { LibraryProvider } from "./LibraryProvider";
import { PlayerProvider } from "./PlayerProvider";
import { LyricsModeProvider } from "./LyricsModeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <LibraryProvider>
          <PlayerProvider>
            <LyricsModeProvider>{children}</LyricsModeProvider>
          </PlayerProvider>
        </LibraryProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
