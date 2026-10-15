"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useReducedMotion } from "motion/react";

const R = 15;
const CIRC = 2 * Math.PI * R;

/**
 * Days remaining: a ring that closes, with the number counted inside it.
 *
 * The one figure on a deadline row that is actually being read, so it gets the most
 * information in the least space — a shape you can take in without reading, and the number if
 * you want the precision. Anime drives the count because a counting number is a plain JS value,
 * which is what anime is for; the same tick writes the ring's dash offset.
 *
 * `days` is clamped so the ring means something: today fills it, four months or more empties it,
 * and the arc between is the honest proportion. A negative count (a date that has passed) keeps
 * the ring full and the caller shows the past tense.
 */
export function DeadlineCount({ days, size = 44 }: { days: number; size?: number }) {
  const reduce = useReducedMotion();
  const numRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const fill = Math.max(0, Math.min(1, 1 - days / 120));
  const shown = Math.max(0, days);

  useEffect(() => {
    const num = numRef.current;
    const ring = ringRef.current;
    const write = (v: number) => {
      if (num) num.textContent = String(Math.round(shown * v));
      if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - fill * v));
    };

    if (reduce) {
      write(1);
      return;
    }

    const t = { v: 0 };
    const a = animate(t, {
      v: 1,
      duration: 720,
      ease: "outQuart",
      onUpdate: () => write(t.v),
    });
    return () => {
      a.pause();
    };
  }, [fill, shown, reduce]);

  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36" className="absolute inset-0" aria-hidden>
        <circle cx="18" cy="18" r={R} fill="none" stroke="currentColor" strokeOpacity={0.16} strokeWidth={2.6} />
        <circle
          ref={ringRef}
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span ref={numRef} className="text-[11px] font-bold tabular-nums">
        0
      </span>
    </span>
  );
}
