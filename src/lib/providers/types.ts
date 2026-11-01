import type { ProviderStatus, Track } from "@/types/track";

export interface SearchOptions {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export interface MusicProvider {
  id: "freetouse" | "jamendo";
  name: string;
  searchTracks(query: string, options?: SearchOptions): Promise<ProviderPage>;
  getFeaturedTracks(options?: SearchOptions): Promise<ProviderPage>;
  getTrackDetails(trackId: string): Promise<Track | null>;
  getPlaybackSource(track: Track): Promise<string | null>;
  getProviderStatus(): Promise<ProviderStatus>;
}

export interface ProviderPage {
  tracks: Track[];
  offset: number;
  limit: number | null;
  total: number | null;
  hasMore: boolean;
}

export const FREE_TO_USE = {
  name: "Free To Use",
  licenseName: "Free To Use License",
  licenseUrl: "https://freetouse.com/license",
  website: "https://freetouse.com",
  attribution: "Music by the original artists, provided by Free To Use.",
} as const;

export const JAMENDO = {
  name: "Jamendo",
  licenseName: "Creative Commons (per-track license)",
  licenseUrl: "https://developer.jamendo.com/v3.0/docs",
  website: "https://www.jamendo.com",
  attribution: "Music by the original artists, provided by Jamendo. Licence terms vary per track.",
} as const;
