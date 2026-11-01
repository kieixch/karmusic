import type { Track } from "@/types/track";
import { normalizeFreeToUseCategory, normalizeFreeToUseTrack, normalizeJamendoTrack } from "./normalize";
import type { NormalizedCategory } from "./normalize";
import { FREE_TO_USE, JAMENDO } from "./types";

export interface ProviderPage {
  tracks: Track[];
  offset: number;
  limit: number | null;
  total: number | null;
  hasMore: boolean;
}

const TIMEOUT_MS = 12_000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error(`Provider responded with HTTP ${response.status}.`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

interface FreeToUseResponse {
  ok?: boolean;
  data?: unknown;
  error?: string;
  pagination?: { limit?: number | null; offset?: number; count?: number };
}

async function freeToUseFetch(path: string): Promise<FreeToUseResponse> {
  const json = (await fetchJson(`https://api.freetouse.com/v3${path}`)) as FreeToUseResponse;
  if (!json || json.ok !== true) {
    throw new Error(typeof json?.error === "string" ? json.error : "Free To Use request failed.");
  }
  return json;
}

function toPage(
  json: FreeToUseResponse,
  offset: number,
  limit: number,
): ProviderPage {
  const data = Array.isArray(json.data) ? json.data : [];
  const tracks = data
    .map((item) => normalizeFreeToUseTrack(item as Parameters<typeof normalizeFreeToUseTrack>[0]))
    .filter((track): track is Track => track !== null);
  const total = typeof json.pagination?.count === "number" ? json.pagination.count : null;
  return {
    tracks,
    offset,
    limit,
    total,
    hasMore: total !== null ? offset + tracks.length < total : data.length === limit,
  };
}

export async function fetchFreeToUseTracks(options: {
  limit: number;
  offset: number;
  order: "staff_order" | "release_date" | "random" | "plays" | "views" | "downloads";
  sort: "asc" | "desc";
}): Promise<ProviderPage> {
  const params = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset),
    order: options.order,
    sort: options.sort,
  });
  const json = await freeToUseFetch(`/music/tracks/all?${params.toString()}`);
  return toPage(json, options.offset, options.limit);
}

export async function fetchFreeToUseSearch(options: {
  query: string;
  limit: number;
  offset: number;
}): Promise<ProviderPage> {
  const params = new URLSearchParams({
    query: options.query,
    limit: String(options.limit),
    offset: String(options.offset),
  });
  const json = await freeToUseFetch(`/music/tracks/search?${params.toString()}`);
  return toPage(json, options.offset, options.limit);
}

export async function fetchFreeToUseTrack(id: string): Promise<Track | null> {
  const json = await freeToUseFetch(`/music/tracks/${encodeURIComponent(id)}`);
  if (!json.data || typeof json.data !== "object") return null;
  return normalizeFreeToUseTrack(json.data as Parameters<typeof normalizeFreeToUseTrack>[0]);
}

export async function fetchFreeToUseCategories(limit = 24): Promise<NormalizedCategory[]> {
  const json = await freeToUseFetch(`/music/categories/all?limit=${limit}`);
  return (Array.isArray(json.data) ? json.data : [])
    .map((item) => normalizeFreeToUseCategory(item as Parameters<typeof normalizeFreeToUseCategory>[0]))
    .filter((category): category is NormalizedCategory => category !== null);
}

export async function fetchFreeToUseCategoryTracks(
  categoryId: string,
  options: { limit: number; offset: number; order: string; sort: "asc" | "desc" },
): Promise<ProviderPage> {
  const params = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset),
    order: options.order,
    sort: options.sort,
  });
  const json = await freeToUseFetch(
    `/music/categories/${encodeURIComponent(categoryId)}/tracks?${params.toString()}`,
  );
  return toPage(json, options.offset, options.limit);
}

export function isJamendoConfigured(): boolean {
  return Boolean(process.env.JAMENDO_CLIENT_ID?.trim());
}

interface JamendoResponse {
  headers?: { status?: string; code?: number; error_message?: string };
  results?: unknown[];
}

async function jamendoFetch(path: string, params: Record<string, string>): Promise<JamendoResponse> {
  const clientId = process.env.JAMENDO_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Jamendo is not configured. Set JAMENDO_CLIENT_ID on the server.");
  }
  const search = new URLSearchParams({
    client_id: clientId,
    format: "json",
    ...params,
  });
  const json = (await fetchJson(`https://api.jamendo.com/v3.0${path}?${search.toString()}`)) as JamendoResponse;
  if (json?.headers?.status === "failed") {
    throw new Error(json.headers.error_message || "Jamendo request failed.");
  }
  return json;
}

function toJamendoPage(json: JamendoResponse, offset: number, limit: number): ProviderPage {
  const data = Array.isArray(json.results) ? json.results : [];
  const tracks = data
    .map((item) => normalizeJamendoTrack(item as Parameters<typeof normalizeJamendoTrack>[0]))
    .filter((track): track is Track => track !== null)
    // Stream playback is only offered when the provider returns an audio URL.
    .filter((track) => Boolean(track.playbackUrl));
  return {
    tracks,
    offset,
    limit,
    total: null,
    hasMore: data.length === limit,
  };
}

export async function fetchJamendoTracks(options: {
  limit: number;
  offset: number;
  query?: string;
  order?: string;
}): Promise<ProviderPage> {
  const params: Record<string, string> = {
    limit: String(options.limit),
    offset: String(options.offset),
    include: "musicinfo",
    audioformat: "mp32",
    imagesize: "500",
    order: options.order ?? "popularity_total",
  };
  if (options.query) {
    params.search = options.query;
    params.boost = "popularity_month";
  }
  const json = await jamendoFetch("/tracks/", params);
  return toJamendoPage(json, options.offset, options.limit);
}

export async function fetchJamendoTrack(id: string): Promise<Track | null> {
  const json = await jamendoFetch("/tracks/", {
    id,
    include: "musicinfo",
    audioformat: "mp32",
    imagesize: "500",
  });
  const item = Array.isArray(json.results) ? json.results[0] : null;
  return item ? normalizeJamendoTrack(item as Parameters<typeof normalizeJamendoTrack>[0]) : null;
}

export function providerStatuses() {
  return [
    {
      id: "freetouse" as const,
      name: FREE_TO_USE.name,
      available: process.env.NEXT_PUBLIC_ENABLE_FREETOUSE !== "false",
      requiresKey: false,
      licenseName: FREE_TO_USE.licenseName,
      licenseUrl: FREE_TO_USE.licenseUrl,
      attribution: FREE_TO_USE.attribution,
      supportsFullStreaming: true,
      website: FREE_TO_USE.website,
    },
    {
      id: "jamendo" as const,
      name: JAMENDO.name,
      available: isJamendoConfigured(),
      requiresKey: true,
      reason: isJamendoConfigured()
        ? undefined
        : "Set JAMENDO_CLIENT_ID in the server environment to enable this optional catalog.",
      licenseName: JAMENDO.licenseName,
      licenseUrl: JAMENDO.licenseUrl,
      attribution: JAMENDO.attribution,
      supportsFullStreaming: true,
      website: JAMENDO.website,
    },
  ];
}
