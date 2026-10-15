"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";

/**
 * The cursor: a filled dot that tracks the pointer exactly, and a ring that trails
 * behind it with an exponential ease and swells over anything clickable.
 *
 * Three decisions matter more than the drawing:
 *
 *  1. **Not on the whole site.** It is off inside `/dashboard`, `/cv`, `/signin` and
 *     `/auth`, where people type, select text and aim at small controls — hiding the
 *     native cursor there trades a real cost for a decoration. Form fields keep their
 *     caret cursor regardless, via the rule below.
 *  2. **Not on touch, and not under reduced motion.** A custom cursor on a phone is
 *     meaningless, and a ring chasing the pointer is exactly the kind of movement
 *     `prefers-reduced-motion` exists to stop. Both cases return nothing at all,
 *     rather than rendering something static.
 *  3. **`pointer-events: none` on both elements**, so the cursor can never intercept a
 *     click — the failure mode that makes a decorative cursor an actual bug.
 *
 * The trailing lag is one line of arithmetic in the frame loop, not a spring
 * dependency: `ring += (pointer - ring) * k`. Changing `k` is the only way to tune how
 * much it drags.
 */

const LAG = 0.16;
const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, summary, [data-cursor]";
const APP_ROUTES = /^\/(dashboard|cv|signin|auth)(\/|$)/;

export function Cursor() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const onAppRoute = APP_ROUTES.test(pathname ?? "");

  useEffect(() => {
    if (reduce || onAppRoute) return;
    // a fine pointer is required: there is no cursor to replace on a touch screen
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
  }, [reduce, onAppRoute]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.dataset.customCursor = "on";

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let hovering = false;
    let pressed = false;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        rx = tx;
        ry = ty;
      }
      const el = e.target as Element | null;
      hovering = Boolean(el?.closest?.(INTERACTIVE));
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onOut = () => {
      visible = false;
    };

    const tick = () => {
      rx += (tx - rx) * LAG;
      ry += (ty - ry) * LAG;

      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(${pressed ? 0.55 : 1})`;
      dot.style.opacity = visible ? "1" : "0";

      const swell = (hovering ? 1.85 : 1) * (pressed ? 0.86 : 1);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${swell})`;
      ring.style.opacity = visible ? (hovering ? "0.95" : "0.5") : "0";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onOut);

    return () => {
      cancelAnimationFrame(raf);
      delete document.documentElement.dataset.customCursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onOut);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        [data-custom-cursor="on"], [data-custom-cursor="on"] * { cursor: none; }
        /* typing and selecting still need a caret */
        [data-custom-cursor="on"] input,
        [data-custom-cursor="on"] textarea,
        [data-custom-cursor="on"] select,
        [data-custom-cursor="on"] [contenteditable="true"] { cursor: auto; }
      `}</style>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 rounded-full border border-lime/80 opacity-0 shadow-[0_0_0_1px_rgba(3,5,4,0.4)] will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-lime opacity-0 shadow-[0_0_0_1px_rgba(3,5,4,0.4)] will-change-transform"
      />
    </>
  );
}
