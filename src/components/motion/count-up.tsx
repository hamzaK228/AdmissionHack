"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { animate } from "animejs";

/** Animated number count-up, powered by anime.js. */
export function CountUp({
  to,
  suffix = "",
  duration = 1600,
  className = "",
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const obj = { v: 0 };
    const anim = animate(obj, {
      v: to,
      duration,
      ease: "outExpo",
      onUpdate: () => setVal(Math.round(obj.v)),
    });
    return () => {
      anim.pause();
    };
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}
