import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex items-center gap-2.5 rounded-xl", compact && "gap-2")}
      aria-label="KarMusic home"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl shadow-glow">
        <img
          src="/icons/icon-2911.jpeg"
          alt=""
          width={1254}
          height={1254}
          className="size-full object-cover"
        />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-white">KarMusic</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
            lyrics first
          </span>
        </span>
      ) : null}
    </Link>
  );
}
