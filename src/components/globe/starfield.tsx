"use client";

import { useMemo } from "react";

/** Deterministic starfield — crisp SVG points with a slow twinkle. */
export function Starfield({ count = 170, className = "" }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    return Array.from({ length: count }, () => ({
      x: +(rnd() * 100).toFixed(3),
      y: +(rnd() * 100).toFixed(3),
      r: +(rnd() * 0.9 + 0.28).toFixed(2),
      o: +(rnd() * 0.55 + 0.18).toFixed(2),
      d: +(rnd() * 6).toFixed(2),
    }));
  }, [count]);

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r * 0.09}
          fill="#e7f2e3"
          opacity={s.o}
          style={{
            animation: `starTwinkle ${4 + s.d}s ease-in-out ${s.d}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
