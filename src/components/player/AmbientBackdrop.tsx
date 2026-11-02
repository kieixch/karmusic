"use client";

import { artworkGradient } from "@/lib/utils/artwork";
import { cn } from "@/lib/utils/cn";

interface AmbientBackdropProps {
  id: string;
  artworkUrl?: string;
}

export function AmbientBackdrop({ id, artworkUrl }: AmbientBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="ambient-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050607]"
    >
      {artworkUrl ? (
        <img
          src={artworkUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full scale-125 object-cover opacity-45 blur-[90px] saturate-150"
        />
      ) : (
        <div
          className={cn(
            "absolute -inset-32 bg-gradient-to-br opacity-70 blur-[110px]",
            artworkGradient(id),
          )}
        />
      )}
      <div className="ambient-orb absolute -left-[20%] top-[5%] h-[55vmax] w-[55vmax] rounded-full bg-accent/[0.09] blur-[100px]" />
      <div className="ambient-orb ambient-orb-b absolute -bottom-[18%] -right-[16%] h-[52vmax] w-[52vmax] rounded-full bg-[#7c5cff]/[0.12] blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(5,6,7,0.55)_72%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050607]/25 via-transparent to-[#050607]/90" />
    </div>
  );
}
