"use client";

import { useEffect, useMemo, useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { hashString } from "@/lib/utils/id";

const GRADIENTS = [
  "from-[#3b2f63] via-[#221c3d] to-[#0e0c18]",
  "from-[#1e4d3f] via-[#123028] to-[#08120f]",
  "from-[#5b3a1e] via-[#33210f] to-[#140c06]",
  "from-[#4d1e2e] via-[#2c1019] to-[#12070a]",
  "from-[#1e3f5b] via-[#102433] to-[#060d12]",
  "from-[#3e4d1e] via-[#232c10] to-[#0d1206]",
  "from-[#4d2a1e] via-[#2c1810] to-[#120906]",
  "from-[#2d1e5b] via-[#1a1033] to-[#090614]",
];

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
  const gradient = useMemo(
    () => GRADIENTS[parseInt(hashString(id), 36) % GRADIENTS.length],
    [id],
  );
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
