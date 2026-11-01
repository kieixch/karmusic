import type { LyricsRecord } from "@/types/lyrics";
import { getDb } from "./db";

export async function getAllLyrics(): Promise<LyricsRecord[]> {
  const db = await getDb();
  return db.getAll("lyrics");
}

export async function getLyrics(trackId: string): Promise<LyricsRecord | null> {
  const db = await getDb();
  return (await db.get("lyrics", trackId)) ?? null;
}

export async function putLyrics(record: LyricsRecord): Promise<void> {
  const db = await getDb();
  await db.put("lyrics", record);
}

export async function deleteLyrics(trackId: string): Promise<void> {
  const db = await getDb();
  await db.delete("lyrics", trackId);
}
