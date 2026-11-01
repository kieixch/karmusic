"use client";

import { useEffect, useRef } from "react";

const RECOVERY_DELAY_MS = 3000;

function getPageSignature() {
  const main = document.getElementById("main");
  if (!main) return "";
  const heading = main.querySelector("h1");
  if (heading?.textContent?.trim()) return heading.textContent.trim();
  return (main.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function NavigationRecovery() {
  const pending = useRef<{ href: string; signature: string } | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const scheduleCheck = (href: string) => {
      window.clearTimeout(timer);
      pending.current = { href, signature: getPageSignature() };
      timer = window.setTimeout(() => {
        const current = pending.current;
        if (!current) return;

        const target = new URL(current.href);
        if (
          window.location.pathname !== target.pathname ||
          window.location.search !== target.search
        ) {
          return;
        }

        if (getPageSignature() !== current.signature) return;

        if (window.location.hash !== target.hash) {
          window.location.replace(target.href);
        } else {
          window.location.reload();
        }
      }, RECOVERY_DELAY_MS);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return;

      const element = event.target;
      const anchor = element instanceof Element ? element.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== window.location.origin) return;
      if (
        target.pathname === window.location.pathname &&
        target.search === window.location.search
      ) {
        return;
      }

      scheduleCheck(target.href);
    };

    const onPopState = () => {
      scheduleCheck(window.location.href);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return null;
}
