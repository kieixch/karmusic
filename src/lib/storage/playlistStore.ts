import type { Playlist } from "@/types/playlist";
import { getDb } from "./db";

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDb();
  return db.getAll("playlists");
}

export async function putPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDb();
  await db.put("playlists", playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("playlists", id);
}

export async function replacePlaylists(playlists: Playlist[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("playlists", "readwrite");
  await Promise.all([tx.store.clear(), ...playlists.map((playlist) => tx.store.put(playlist)), tx.done]);
}
