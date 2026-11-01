"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { IconButton } from "@/components/ui/IconButton";

export function VolumeControl({ className }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <IconButton label={muted ? "Unmute" : "Mute"} size="sm" onClick={toggleMute}>
          <Icon aria-hidden />
        </IconButton>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effective}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          aria-valuetext={`${Math.round(effective * 100)}%`}
          className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-accent"
        />
      </div>
    </div>
  );
}
