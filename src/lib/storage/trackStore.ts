import type { Track } from "@/types/track";
import { getDb } from "./db";

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDb();
  return db.getAll("tracks");
}

export async function putTrack(track: Track): Promise<void> {
  const db = await getDb();
  await db.put("tracks", track);
}

export async function putLocalTrack(track: Track, blob: Blob): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["tracks", "blobs"], "readwrite");
  await Promise.all([
    tx.objectStore("tracks").put(track),
    tx.objectStore("blobs").put({ id: track.id, blob }),
    tx.done,
  ]);
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["tracks", "blobs", "lyrics"], "readwrite");
  await Promise.all([
    tx.objectStore("tracks").delete(trackId),
    tx.objectStore("blobs").delete(trackId),
    tx.objectStore("lyrics").delete(trackId),
    tx.done,
  ]);
}

export async function getTrackBlob(trackId: string): Promise<Blob | null> {
  const db = await getDb();
  const record = await db.get("blobs", trackId);
  return record?.blob ?? null;
}

export async function clearLocalTracks(): Promise<void> {
  const db = await getDb();
  const tracks = await db.getAll("tracks");
  const localIds = tracks.filter((track) => track.source === "local").map((track) => track.id);
  const tx = db.transaction(["tracks", "blobs", "lyrics"], "readwrite");
  await Promise.all([
    ...localIds.map((id) => tx.objectStore("tracks").delete(id)),
    ...localIds.map((id) => tx.objectStore("blobs").delete(id)),
    ...localIds.map((id) => tx.objectStore("lyrics").delete(id)),
    tx.done,
  ]);
}

export async function clearAllTracks(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["tracks", "blobs"], "readwrite");
  await Promise.all([tx.objectStore("tracks").clear(), tx.objectStore("blobs").clear(), tx.done]);
}
