"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll choreographer.
 *
 * Publishes scroll state as CSS custom properties on <html>:
 *   --sp  scroll progress 0..1 over the whole document
 *   --sy  scrollY in pixels
 *   --sv  scroll velocity (0..1, decays) for momentum effects
 *
 * Deliberately driven by a passive `scroll` listener writing CSS variables —
 * NOT by an animation-frame loop. Scroll-linked transforms then resolve in the
 * style engine, so the choreography survives throttled/background frames.
 * Elements opt in via CSS (e.g. `transform: scale(calc(1 - var(--sp) * .3))`).
 */
export function ScrollDriver({ showReadout = true }: { showReadout?: boolean }) {
  const pathname = usePathname();
  const [pct, setPct] = useState(0);
  const lastRef = useRef(-1);

  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let decay = 0;

    const write = () => {
      const y = window.scrollY;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, y / max));

      // velocity with decay, updated per scroll event
      const v = Math.min(1, Math.abs(y - lastY) / 90);
      decay = Math.max(decay * 0.86, v);
      lastY = y;

      root.style.setProperty("--sp", p.toFixed(4));
      root.style.setProperty("--sy", `${Math.round(y)}px`);
      root.style.setProperty("--sv", decay.toFixed(3));

      // keep React re-renders rare: only when the integer percent changes
      const pctInt = Math.round(p * 100);
      if (pctInt !== lastRef.current) {
        lastRef.current = pctInt;
        setPct(pctInt);
      }
    };

    write();
    window.addEventListener("scroll", write, { passive: true });
    window.addEventListener("resize", write);
    return () => {
      window.removeEventListener("scroll", write);
      window.removeEventListener("resize", write);
    };
  }, [pathname]);

  if (!showReadout) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 lg:flex"
    >
      <span className="text-[9px] uppercase tracking-[0.24em] text-dim">scroll</span>
      <span className="relative block h-28 w-px bg-line">
        <span
          className="absolute left-0 top-0 w-px bg-lime transition-[height] duration-150"
          style={{ height: `${Math.max(2, pct)}%` }}
        />
      </span>
      <span className="font-mono text-[10px] tabular-nums text-lime">
        {String(pct).padStart(3, "0")}%
      </span>
    </div>
  );
}
