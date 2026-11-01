import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex items-center gap-2.5 rounded-xl", compact && "gap-2")}
      aria-label="KarMusic home"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-accent text-black shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none">
          <path
            d="M6 4v16M6 12l8-8M6 12l8 8"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18.5" cy="7" r="2.2" fill="currentColor" />
        </svg>
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
