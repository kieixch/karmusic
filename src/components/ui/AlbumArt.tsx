"use client";

import { useEffect, useMemo, useState } from "react";
import { Music2 } from "lucide-react";
import { artworkGradient } from "@/lib/utils/artwork";
import { cn } from "@/lib/utils/cn";

interface AlbumArtProps {
  id: string;
  title: string;
  artworkUrl?: string;
  className?: string;
  rounded?: string;
  iconSize?: string;
}

export function AlbumArt({
  id,
  title,
  artworkUrl,
  className,
  rounded = "rounded-xl",
  iconSize = "size-5",
}: AlbumArtProps) {
  const [failed, setFailed] = useState(false);
  const gradient = useMemo(() => artworkGradient(id), [id]);
  const initial = (title.trim()[0] ?? "?").toUpperCase();
  const hasCustomPosition = className
    ? className.split(/\s+/).some((token) => ["absolute", "fixed", "sticky"].includes(token))
    : false;

  useEffect(() => {
    setFailed(false);
  }, [artworkUrl]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 overflow-hidden bg-gradient-to-br",
        !hasCustomPosition && "relative",
        gradient,
        rounded,
        className,
      )}
    >
      {artworkUrl && !failed ? (
        <img
          src={artworkUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-white/35">
          <Music2 className={iconSize} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
            {initial}
          </span>
        </div>
      )}
    </div>
  );
}
