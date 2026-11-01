import { getDb } from "./db";

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const record = await db.get("meta", key);
  return (record?.value as T) ?? fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("meta", { key, value });
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await getDb();
  await db.delete("meta", key);
}
