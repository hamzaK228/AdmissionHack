"use client";

import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { animate } from "animejs";

/**
 * Decorative "admission system" circuit — draws itself with anime.js
 * when it enters the viewport. Purely visual (aria-hidden).
 */
export function SystemPath({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const paths = ref.current.querySelectorAll<SVGPathElement>("[data-draw]");
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      animate(p, {
        strokeDashoffset: [len, 0],
        duration: 2000,
        delay: 250 + i * 380,
        ease: "outQuart",
      });
    });
  }, [inView]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 560"
      fill="none"
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* trunk: applicant → exams → universities → accepted */}
      <path
        data-draw
        d="M 40 300 H 260 Q 300 300 300 260 V 180 Q 300 140 340 140 H 560 Q 600 140 600 180 V 300 Q 600 340 640 340 H 880 Q 920 340 920 300 V 220 Q 920 180 960 180 H 1160"
        stroke="rgba(201,255,74,0.4)"
        strokeWidth="1.5"
      />
      {/* branch: documents vault */}
      <path
        data-draw
        d="M 300 260 V 420 Q 300 460 340 460 H 520"
        stroke="rgba(94,234,212,0.35)"
        strokeWidth="1.5"
      />
      {/* branch: deadlines */}
      <path
        data-draw
        d="M 880 340 V 460 Q 880 490 840 490 H 660"
        stroke="rgba(125,211,252,0.3)"
        strokeWidth="1.5"
      />
      {/* nodes */}
      {[
        [40, 300], [340, 140], [640, 340], [960, 180], [1160, 180], [340, 460], [840, 490],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" stroke="rgba(201,255,74,0.5)" strokeWidth="1.5" />
      ))}
      {/* labels sit in HTML next to nodes */}
    </svg>
  );
}
