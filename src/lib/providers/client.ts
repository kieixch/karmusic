import type { ProviderStatus, Track } from "@/types/track";
import type { MusicProvider, ProviderPage } from "./types";
import type { NormalizedCategory } from "./normalize";
import { AppError } from "@/lib/utils/errors";

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new AppError("Could not reach the online catalog. Check your connection.", "NETWORK");
  }
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string; configured?: boolean })
    | null;
  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : `The online catalog responded with HTTP ${response.status}.`;
    throw new AppError(message, response.status === 503 ? "NOT_CONFIGURED" : "PROVIDER");
  }
  if (!data) throw new AppError("The online catalog returned an empty response.", "PROVIDER");
  return data;
}

function pageFrom(data: ProviderPage): ProviderPage {
  return {
    tracks: Array.isArray(data.tracks) ? data.tracks : [],
    offset: data.offset ?? 0,
    limit: data.limit ?? null,
    total: data.total ?? null,
    hasMore: Boolean(data.hasMore),
  };
}

export const freetouseProvider: MusicProvider = {
  id: "freetouse",
  name: "Free To Use",
  async searchTracks(query, options) {
    const params = new URLSearchParams({ query, limit: String(options?.limit ?? 20), offset: String(options?.offset ?? 0) });
    const data = await request<ProviderPage & { tracks: Track[] }>(
      `/api/freetouse/search?${params.toString()}`,
      options?.signal,
    );
    return pageFrom(data);
  },
  async getFeaturedTracks(options) {
    const params = new URLSearchParams({
      limit: String(options?.limit ?? 20),
      offset: String(options?.offset ?? 0),
      order: "staff_order",
      sort: "desc",
    });
    const data = await request<ProviderPage>(`/api/freetouse/tracks?${params.toString()}`, options?.signal);
    return pageFrom(data);
  },
  async getTrackDetails(trackId) {
    const data = await request<{ track: Track | null }>(
      `/api/freetouse/track/${encodeURIComponent(trackId)}`,
    );
    return data.track ?? null;
  },
  async getPlaybackSource(track) {
    return track.playbackUrl ?? null;
  },
  async getProviderStatus() {
    const data = await request<{ providers: ProviderStatus[] }>("/api/providers/status");
    return data.providers.find((provider) => provider.id === "freetouse")!;
  },
};

export const jamendoProvider: MusicProvider = {
  id: "jamendo",
  name: "Jamendo",
  async searchTracks(query, options) {
    const params = new URLSearchParams({ query, limit: String(options?.limit ?? 20), offset: String(options?.offset ?? 0) });
    const data = await request<ProviderPage>(`/api/jamendo/search?${params.toString()}`, options?.signal);
    return pageFrom(data);
  },
  async getFeaturedTracks(options) {
    const params = new URLSearchParams({
      limit: String(options?.limit ?? 20),
      offset: String(options?.offset ?? 0),
    });
    const data = await request<ProviderPage>(`/api/jamendo/tracks?${params.toString()}`, options?.signal);
    return pageFrom(data);
  },
  async getTrackDetails(trackId) {
    const data = await request<{ track: Track | null }>(
      `/api/jamendo/track/${encodeURIComponent(trackId)}`,
    );
    return data.track ?? null;
  },
  async getPlaybackSource(track) {
    return track.playbackUrl ?? null;
  },
  async getProviderStatus() {
    const data = await request<{ providers: ProviderStatus[] }>("/api/providers/status");
    return data.providers.find((provider) => provider.id === "jamendo")!;
  },
};

export const providers: MusicProvider[] = [freetouseProvider, jamendoProvider];

export function getProvider(id: string): MusicProvider | undefined {
  return providers.find((provider) => provider.id === id);
}

export async function fetchProviderStatuses(signal?: AbortSignal): Promise<ProviderStatus[]> {
  const data = await request<{ providers: ProviderStatus[] }>("/api/providers/status", signal);
  return Array.isArray(data.providers) ? data.providers : [];
}

export async function fetchFreeToUseCatalog(
  options: {
    order?: "staff_order" | "release_date" | "random" | "plays" | "views" | "downloads";
    limit?: number;
    offset?: number;
  },
  signal?: AbortSignal,
): Promise<ProviderPage> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 20),
    offset: String(options.offset ?? 0),
    order: options.order ?? "staff_order",
    sort: "desc",
  });
  const data = await request<ProviderPage>(`/api/freetouse/tracks?${params.toString()}`, signal);
  return pageFrom(data);
}

export async function fetchFreeToUseCategories(signal?: AbortSignal): Promise<NormalizedCategory[]> {
  const data = await request<{ categories: NormalizedCategory[] }>(
    "/api/freetouse/categories?limit=30",
    signal,
  );
  return Array.isArray(data.categories) ? data.categories : [];
}

export async function fetchCategoryTracks(
  categoryId: string,
  options?: { limit?: number; offset?: number },
  signal?: AbortSignal,
): Promise<ProviderPage> {
  const params = new URLSearchParams({
    limit: String(options?.limit ?? 20),
    offset: String(options?.offset ?? 0),
    order: "random",
    sort: "desc",
  });
  const data = await request<ProviderPage>(
    `/api/freetouse/categories/${encodeURIComponent(categoryId)}/tracks?${params.toString()}`,
    signal,
  );
  return pageFrom(data);
}

export async function refreshOnlineTrack(track: Track): Promise<Track | null> {
  const provider = getProvider(track.provider);
  if (!provider || !track.providerTrackId) return null;
  try {
    return await provider.getTrackDetails(track.providerTrackId);
  } catch {
    return null;
  }
}
