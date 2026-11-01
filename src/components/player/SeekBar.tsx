"use client";

import { useState, type CSSProperties } from "react";
import { usePlayer, usePlaybackClock } from "@/components/providers/PlayerProvider";
import { formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function SeekBar({
  compact = false,
  className,
  showTimes = true,
}: {
  compact?: boolean;
  className?: string;
  showTimes?: boolean;
}) {
  const { seek } = usePlayer();
  const { currentTime, duration } = usePlaybackClock();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? currentTime;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const percent = safeDuration ? Math.min(100, (shown / safeDuration) * 100) : 0;

  const commit = () => {
    if (dragValue !== null) {
      seek(dragValue);
      setDragValue(null);
    }
  };

  const style = {
    "--seek-percent": `${percent}%`,
  } as CSSProperties;

  return (
    <div className={cn("flex w-full items-center gap-2.5", className)}>
      {showTimes ? (
        <span className={cn("w-10 text-right font-mono tabular-nums text-white/45", compact ? "text-[10px]" : "text-[11px]")}>
          {formatTime(shown)}
        </span>
      ) : null}
      <input
        type="range"
        min={0}
        max={safeDuration || 1}
        step={0.1}
        value={Math.min(shown, safeDuration || 1)}
        disabled={!safeDuration}
        onChange={(event) => setDragValue(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label="Seek"
        aria-valuetext={`${formatTime(shown)} of ${formatTime(safeDuration)}`}
        className={cn(
          "seek-range h-5 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed",
          compact && "h-4",
        )}
        style={style}
      />
      {showTimes ? (
        <span className={cn("w-10 font-mono tabular-nums text-white/45", compact ? "text-[10px]" : "text-[11px]")}>
          {formatTime(safeDuration)}
        </span>
      ) : null}
      <style jsx>{`
        .seek-range {
          background: transparent;
        }
        .seek-range::-webkit-slider-runnable-track {
          height: ${compact ? "3px" : "4px"};
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #c8ff4d var(--seek-percent),
            rgba(255, 255, 255, 0.14) var(--seek-percent)
          );
        }
        .seek-range::-moz-range-track {
          height: ${compact ? "3px" : "4px"};
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
        }
        .seek-range::-moz-range-progress {
          height: ${compact ? "3px" : "4px"};
          border-radius: 999px;
          background: #c8ff4d;
        }
        .seek-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: ${compact ? "10px" : "12px"};
          width: ${compact ? "10px" : "12px"};
          margin-top: ${compact ? "-3.5px" : "-4px"};
          border-radius: 999px;
          background: #f7f8f8;
          border: 0;
          box-shadow: 0 0 0 4px rgba(200, 255, 77, 0.12);
          opacity: 0;
          transition: opacity 120ms ease;
        }
        .seek-range:hover::-webkit-slider-thumb,
        .seek-range:focus-visible::-webkit-slider-thumb {
          opacity: 1;
        }
        .seek-range::-moz-range-thumb {
          height: ${compact ? "10px" : "12px"};
          width: ${compact ? "10px" : "12px"};
          border-radius: 999px;
          background: #f7f8f8;
          border: 0;
        }
      `}</style>
    </div>
  );
}
