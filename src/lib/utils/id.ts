export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function makeLocalTrackId(file: { name: string; size: number; lastModified: number }): string {
  return `local:${hashString(`${file.name}:${file.size}:${file.lastModified}`)}`;
}

export function makeOnlineTrackId(provider: string, providerTrackId: string | number): string {
  return `${provider}:${providerTrackId}`;
}

export function makeId(prefix = "id"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}:${random}`;
}
