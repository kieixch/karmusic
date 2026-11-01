import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "online" | "local" | "warning";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone === "neutral" && "bg-white/[0.06] text-white/55",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "online" && "bg-sky-400/10 text-sky-300",
        tone === "local" && "bg-violet-400/10 text-violet-300",
        tone === "warning" && "bg-amber-400/10 text-amber-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
