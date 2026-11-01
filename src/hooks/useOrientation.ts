"use client";

import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

function readOrientation(): Orientation {
  if (typeof window === "undefined") return "portrait";
  if (window.matchMedia) {
    return window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
  }
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  useEffect(() => {
    setOrientation(readOrientation());
    const media = window.matchMedia?.("(orientation: landscape)");
    const onChange = () => setOrientation(readOrientation());
    if (media?.addEventListener) {
      media.addEventListener("change", onChange);
    } else {
      window.addEventListener("resize", onChange);
    }
    window.addEventListener("resize", onChange);
    return () => {
      if (media?.removeEventListener) {
        media.removeEventListener("change", onChange);
      }
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return orientation;
}
