import type { Track } from "@/types/track";
import type { IAudioMetadata } from "music-metadata";
import { artworkToDataUrl, isLikelyAudioFile, readAudioDuration, titleFromFileName } from "@/lib/audio/formats";
import { makeLocalTrackId } from "@/lib/utils/id";

export const MAX_LOCAL_FILE_BYTES = 300 * 1024 * 1024;

export interface ImportFailure {
  fileName: string;
  reason: string;
}

export interface BuiltLocalTrack {
  track: Track;
  blob: Blob;
}

async function readMetadata(file: File): Promise<IAudioMetadata | null> {
  try {
    const { parseBlob } = await import("music-metadata");
    return await parseBlob(file, { duration: true, skipPostHeaders: true });
  } catch {
    return null;
  }
}

export async function buildLocalTrack(file: File): Promise<BuiltLocalTrack> {
  if (!isLikelyAudioFile(file)) {
    throw new Error("Unsupported file type. Try MP3, WAV, OGG, M4A, AAC, FLAC or WebM.");
  }
  if (file.size === 0) {
    throw new Error("The file is empty or could not be read.");
  }
  if (file.size > MAX_LOCAL_FILE_BYTES) {
    throw new Error("File is larger than the 300 MB import limit.");
  }

  const objectUrl = URL.createObjectURL(file);
  const [metadata, mediaDuration] = await Promise.all([
    readMetadata(file),
    readAudioDuration(objectUrl),
  ]);
  URL.revokeObjectURL(objectUrl);

  const common = metadata?.common;
  const metadataDuration =
    metadata?.format?.duration && Number.isFinite(metadata.format.duration)
      ? metadata.format.duration
      : undefined;
  // The browser's decoded duration is authoritative because it is the same
  // value the player and lyric clock use. Container metadata can be inaccurate
  // for VBR files or files with a missing/broken duration header.
  const duration = mediaDuration ?? metadataDuration;

  const artwork = await artworkToDataUrl(common?.picture?.[0]);
  const title =
    (typeof common?.title === "string" && common.title.trim()) || titleFromFileName(file.name);
  const artist = (typeof common?.artist === "string" && common.artist.trim()) || "Unknown artist";
  const album = typeof common?.album === "string" && common.album.trim() ? common.album.trim() : undefined;
  const genre = Array.isArray(common?.genre) && common.genre[0] ? common.genre[0] : undefined;
  const id = makeLocalTrackId({ name: file.name, size: file.size, lastModified: file.lastModified });

  const track: Track = {
    id,
    source: "local",
    provider: "local",
    title,
    artist,
    album,
    genre,
    duration,
    artworkUrl: artwork,
    addedAt: Date.now(),
    licenseName: "Your own file",
    attribution: "Imported from this device. Not uploaded anywhere.",
    local: {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      persisted: true,
    },
  };

  return { track, blob: file };
}
