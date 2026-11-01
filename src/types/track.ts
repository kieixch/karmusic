export type TrackSource = "local" | "online";

export type ProviderId = "local" | "freetouse" | "jamendo";

export interface Track {
  /** Stable identifier: `local:<hash>`, `freetouse:<uuid>` or `jamendo:<id>`. */
  id: string;
  source: TrackSource;
  provider: ProviderId;
  providerTrackId?: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  artworkUrl?: string;
  /**
   * Direct, provider-authorized stream URL. Local tracks never persist an
   * object URL here; it is resolved from IndexedDB at playback time.
   */
  playbackUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attribution?: string;
  /** Provider page / attribution link, when available. */
  sourceUrl?: string;
  addedAt: number;
  /** Metadata for locally imported files. Never includes the blob itself. */
  local?: {
    fileName: string;
    mimeType: string;
    size: number;
    /** Object URLs are session scoped; blobs live in IndexedDB. */
    persisted: boolean;
  };
}

export interface ProviderStatus {
  id: ProviderId;
  name: string;
  available: boolean;
  requiresKey: boolean;
  reason?: string;
  licenseName?: string;
  licenseUrl?: string;
  attribution?: string;
  supportsFullStreaming: boolean;
  website?: string;
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  licenseName: string;
  licenseUrl: string;
}

export function isLocalTrack(track: Track): boolean {
  return track.source === "local";
}

export function isOnlineTrack(track: Track): boolean {
  return track.source === "online";
}

export function trackArtistLine(track: Track): string {
  return track.artist || "Unknown artist";
}
