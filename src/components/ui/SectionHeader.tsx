import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "See all",
  action,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm muted">{subtitle}</p> : null}
      </div>
      {action}
      {href ? (
        <Link
          href={href}
          className="focus-ring inline-flex shrink-0 items-center gap-0.5 rounded text-sm font-medium text-white/55 transition hover:text-white"
        >
          {linkLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
