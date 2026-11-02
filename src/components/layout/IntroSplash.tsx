"use client";

import { useEffect, useState } from "react";

export function IntroSplash() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      className="intro-splash pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-[#050607]"
      onAnimationEnd={(event) => {
        if (event.animationName === "intro-splash-out") setDone(true);
      }}
    >
      <div className="relative flex size-[clamp(112px,28vw,176px)] items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <img
          src="/icons/icon-2911.jpeg"
          alt=""
          width={1254}
          height={1254}
          className="intro-logo-image relative size-full rounded-full object-cover ring-1 ring-white/15"
        />
      </div>
    </div>
  );
}
