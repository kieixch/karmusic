"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, sanitizeSettings, type UserSettings } from "@/types/settings";

const STORAGE_KEY = "karmusic.settings.v1";

interface SettingsContextValue {
  settings: UserSettings;
  hydrated: boolean;
  updateSettings: (patch: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Private browsing / disabled localStorage: keep settings in memory.
    }
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.classList.toggle("oled", settings.theme === "oled");
    root.style.colorScheme = "dark";
    const reduce =
      settings.reduceMotion ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.classList.toggle("reduce-motion", Boolean(reduce));
  }, [settings.theme, settings.reduceMotion, hydrated]);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((current) => sanitizeSettings({ ...current, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const value = useMemo(
    () => ({ settings, hydrated, updateSettings, resetSettings }),
    [settings, hydrated, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
