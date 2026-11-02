export const COMMON_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "ogg",
  "oga",
  "m4a",
  "mp4",
  "aac",
  "flac",
  "webm",
  "opus",
] as const;

export const AUDIO_ACCEPT =
  "audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,.opus";

export function extensionOf(fileName: string): string {
  const clean = fileName.split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export function isLikelyAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  if (file.type === "video/mp4" || file.type === "video/webm") return true;
  return (COMMON_AUDIO_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled track";
}

const MAX_ARTWORK_BYTES = 700_000;

export async function artworkToDataUrl(picture: {
  data: Uint8Array | ArrayBuffer;
  format?: string;
} | undefined): Promise<string | undefined> {
  if (!picture) return undefined;
  const bytes = picture.data instanceof Uint8Array ? picture.data : new Uint8Array(picture.data);
  if (!bytes.byteLength || bytes.byteLength > MAX_ARTWORK_BYTES) return undefined;
  const mime = picture.format && picture.format.startsWith("image/") ? picture.format : "image/jpeg";
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : bytesToBase64(bytes);
  return `data:${mime};base64,${base64}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function readAudioDuration(src: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    let settled = false;
    const finish = (duration?: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      audio.removeAttribute("src");
      audio.load();
      resolve(duration);
    };
    const timer = setTimeout(() => finish(undefined), 12_000);
    const readDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) finish(audio.duration);
    };
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", readDuration);
    audio.addEventListener("durationchange", readDuration);
    audio.addEventListener("canplay", readDuration);
    audio.onerror = () => finish(undefined);
    audio.src = src;
  });
}
