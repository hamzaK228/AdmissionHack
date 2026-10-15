"use client";

import { useMemo } from "react";

/**
 * Deterministic starfield — crisp SVG points with a slow twinkle.
 *
 * The twinkle is animated in LAYERS, not per star. Giving every star its own
 * keyframe looked identical but meant 170 independent opacity animations
 * repainting the SVG every frame, and it measured as the single largest cost on
 * the landing page: 170 of the page's 185 running animations came from here.
 * Six groups pulsing at different rates is six animations for the same picture,
 * and since opacity on a group multiplies the opacity already set on each
 * circle, every star keeps its own brightness.
 */
const LAYERS = 6;

export function Starfield({ count = 170, className = "" }: { count?: number; className?: string }) {
  const layers = useMemo(() => {
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const buckets: { x: number; y: number; r: number; o: number }[][] = Array.from(
      { length: LAYERS },
      () => [],
    );
    for (let i = 0; i < count; i++) {
      buckets[i % LAYERS].push({
        x: +(rnd() * 100).toFixed(3),
        y: +(rnd() * 100).toFixed(3),
        r: +(rnd() * 0.9 + 0.28).toFixed(2),
        o: +(rnd() * 0.55 + 0.18).toFixed(2),
      });
    }
    return buckets;
  }, [count]);

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {layers.map((stars, layer) => (
        <g
          key={layer}
          style={{
            animation: `starTwinkle ${5.4 + layer * 1.15}s ease-in-out ${layer * 0.83}s infinite`,
            willChange: "opacity",
          }}
        >
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.09} fill="#e7f2e3" opacity={s.o} />
          ))}
        </g>
      ))}
    </svg>
  );
}
