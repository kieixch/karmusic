type AudioEventName =
  | "timeupdate"
  | "durationchange"
  | "loadedmetadata"
  | "play"
  | "pause"
  | "ended"
  | "waiting"
  | "playing"
  | "canplay"
  | "error"
  | "volumechange"
  | "ratechange"
  | "progress"
  | "seeked"
  | "emptied";

export type AudioEngineHandler = (audio: HTMLAudioElement) => void;

/**
 * Thin, framework-agnostic wrapper around a single HTMLAudioElement.
 * The element is created once and reused for every track so we never leak
 * media elements or accumulate duplicate listeners across React renders.
 */
export class AudioEngine {
  readonly audio: HTMLAudioElement;
  private handlers = new Map<AudioEventName, Set<AudioEngineHandler>>();
  private bound = new Map<AudioEventName, () => void>();

  constructor() {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.setAttribute("playsinline", "true");
    this.audio = audio;
  }

  on(event: AudioEventName, handler: AudioEngineHandler): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
      const listener = () => {
        for (const fn of this.handlers.get(event) ?? []) fn(this.audio);
      };
      this.bound.set(event, listener);
      this.audio.addEventListener(event, listener);
    }
    set.add(handler);
    return () => {
      const current = this.handlers.get(event);
      current?.delete(handler);
      if (current && current.size === 0) {
        const listener = this.bound.get(event);
        if (listener) this.audio.removeEventListener(event, listener);
        this.bound.delete(event);
        this.handlers.delete(event);
      }
    };
  }

  setSource(src: string): void {
    this.audio.pause();
    this.audio.src = src;
    this.audio.currentTime = 0;
    this.audio.load();
  }

  clearSource(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  async play(): Promise<void> {
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  seek(seconds: number): void {
    const duration = this.audio.duration;
    const target = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    try {
      this.audio.currentTime = Number.isFinite(duration) ? Math.min(target, duration) : target;
    } catch {
      // Some streams do not allow seeking; ignore.
    }
  }

  setVolume(volume: number, muted: boolean): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
    this.audio.muted = muted;
  }

  setPlaybackRate(rate: number): void {
    try {
      this.audio.playbackRate = rate;
    } catch {
      // Ignore unsupported rates.
    }
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  destroy(): void {
    this.audio.pause();
    for (const [event, listener] of this.bound) {
      this.audio.removeEventListener(event, listener);
    }
    this.handlers.clear();
    this.bound.clear();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}
