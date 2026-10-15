"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";

/**
 * The cursor, in two parts — and the second part is the brand.
 *
 * A filled dot tracks the pointer exactly; a ring trails it on an exponential ease and
 * swells over anything clickable. That much is the reference's idea.
 *
 * What makes it ours is the third element: over anything interactive, a small terminal
 * pill types out the verb for what that thing does — `> open` on a link, `> run` on a
 * button, `> type` in a field. The whole product is a terminal, so the cursor speaks in
 * terminal verbs rather than showing a generic label; and a student learns the
 * vocabulary by moving the mouse, which is a nicer way to find it than a legend.
 *
 * Any element can name its own verb with `data-cursor="add to list"`, which is how a
 * specific control says something more precise than its tag implies.
 *
 * Three limits, all deliberate:
 *
 *  1. **Not inside the app.** `/dashboard`, `/cv`, `/signin` and `/auth` keep the native
 *     cursor: that is where people type, select text and aim at small controls, and
 *     replacing the cursor there costs real usability for a decoration. Form fields keep
 *     their caret cursor everywhere, by the rule below.
 *  2. **Nothing on touch, nothing under reduced motion.** A cursor on a phone is
 *     meaningless, and a ring chasing the pointer is exactly what `prefers-reduced-motion`
 *     exists to prevent — so both cases return nothing at all rather than something static.
 *  3. **`pointer-events: none` on every element**, so the cursor can never intercept a
 *     click. That is the failure mode which turns a decorative cursor into a real bug.
 */

const LAG = 0.16;
const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, summary, [data-cursor]";
const APP_ROUTES = /^\/(dashboard|cv|signin|auth)(\/|$)/;

/** The verb a tag implies, when the element has not named its own. */
function verbFor(el: Element): string {
  const own = el.getAttribute("data-cursor");
  if (own) return own;
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return "open";
  if (tag === "input" || tag === "textarea") return "type";
  if (tag === "select") return "choose";
  if (tag === "summary") return "expand";
  if (tag === "label") return "focus";
  if (tag === "button" || el.getAttribute("role") === "button") return "run";
  return "select";
}

export function Cursor() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  const onAppRoute = APP_ROUTES.test(pathname ?? "");

  useEffect(() => {
    if (reduce || onAppRoute) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
  }, [reduce, onAppRoute]);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const pill = pillRef.current;
    const text = textRef.current;
    if (!dot || !ring || !pill || !text) return;

    document.documentElement.dataset.customCursor = "on";

    let raf = 0;
    let typing: ReturnType<typeof setInterval> | null = null;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let hovering = false;
    let pressed = false;
    let visible = false;
    let label: string | null = null;

    /** Type the verb in, rather than swapping the text — the motion is the point. */
    const retype = (next: string | null) => {
      if (typing) {
        clearInterval(typing);
        typing = null;
      }
      if (!next) {
        pill.style.opacity = "0";
        text.textContent = "";
        return;
      }
      text.textContent = "";
      pill.style.opacity = "1";
      let i = 0;
      typing = setInterval(() => {
        i += 1;
        text.textContent = next.slice(0, i);
        if (i >= next.length && typing) {
          clearInterval(typing);
          typing = null;
        }
      }, 26);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        rx = tx;
        ry = ty;
      }
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
      hovering = Boolean(el);
      const next = el ? verbFor(el) : null;
      if (next !== label) {
        label = next;
        retype(next);
      }
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onOut = () => {
      visible = false;
      label = null;
      retype(null);
    };

    const tick = () => {
      // the whole trailing effect is this one line of arithmetic — no spring dependency
      rx += (tx - rx) * LAG;
      ry += (ty - ry) * LAG;

      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(${pressed ? 0.55 : 1})`;
      dot.style.opacity = visible ? "1" : "0";

      const swell = (hovering ? 1.85 : 1) * (pressed ? 0.86 : 1);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${swell})`;
      ring.style.opacity = visible ? (hovering ? "0.9" : "0.45") : "0";

      // the pill sits beside the pointer, never under it, so it cannot cover a target
      pill.style.transform = `translate3d(${rx + 18}px, ${ry + 16}px, 0)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onOut);

    return () => {
      cancelAnimationFrame(raf);
      if (typing) clearInterval(typing);
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
      {/* the terminal verb — `> open`, `> run`, `> type` */}
      <div
        ref={pillRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center gap-1 rounded-md border border-lime/40 bg-ink/90 px-2 py-1 font-mono text-[10px] font-bold lowercase text-lime opacity-0 shadow-[0_6px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm will-change-transform"
      >
        <span className="text-lime/60">&gt;</span>
        <span ref={textRef} />
        <span className="anim-blink -ml-0.5 inline-block">▌</span>
      </div>
    </>
  );
}
