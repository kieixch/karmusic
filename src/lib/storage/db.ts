import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LyricsRecord } from "@/types/lyrics";
import type { Playlist } from "@/types/playlist";
import type { Track } from "@/types/track";

export interface MetaRecord {
  key: string;
  value: unknown;
}

interface KarMusicDB extends DBSchema {
  tracks: { key: string; value: Track };
  blobs: { key: string; value: { id: string; blob: Blob } };
  lyrics: { key: string; value: LyricsRecord };
  playlists: { key: string; value: Playlist };
  meta: { key: string; value: MetaRecord };
}

const DB_NAME = "karmusic";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KarMusicDB>> | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): Promise<IDBPDatabase<KarMusicDB>> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error("Local storage (IndexedDB) is unavailable in this browser."));
  }
  if (!dbPromise) {
    dbPromise = openDB<KarMusicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("tracks")) db.createObjectStore("tracks", { keyPath: "id" });
        if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("lyrics")) db.createObjectStore("lyrics", { keyPath: "trackId" });
        if (!db.objectStoreNames.contains("playlists")) db.createObjectStore("playlists", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      },
    }).catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function resetDatabase(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // ignore
    }
    dbPromise = null;
  }
  if (!isIndexedDbAvailable()) return;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Could not delete local database."));
    request.onblocked = () => resolve();
  });
}
