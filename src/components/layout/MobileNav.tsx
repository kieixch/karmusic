"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav } from "./nav-items";
import { cn } from "@/lib/utils/cn";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-900/95 pb-[var(--safe-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid h-14 grid-cols-5">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-white/45 hover:text-white/75",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
