"use client";

import { useEffect, useRef, type ElementType } from "react";
import { animate, onScroll, stagger } from "animejs";

/**
 * Scroll-scrubbed text reveal.
 *
 * The heading is split into words and anime.js's ScrollObserver scrubs their
 * opacity against scroll position (sync), staggered so the line resolves
 * left-to-right as you scroll past it — the effect the reference uses on its
 * statement lines.
 *
 * Two safety decisions:
 *  - Words start at a readable 0.22 opacity, never 0, so if a browser throttles
 *    the animation loop the copy is still legible rather than invisible.
 *  - Reduced motion and no-JS both leave the text fully visible.
 */
export function ScrollWords({
  text,
  as: Tag = "h2",
  className = "",
  accent,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** substring to tint with the accent colour (rendered as one unit) */
  accent?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    if (words.length === 0) return;

    let advanced = false;
    const anim = animate(words, {
      opacity: [0.3, 1],
      delay: stagger(0.6),
      ease: "linear",
      autoplay: onScroll({
        target: el,
        enter: "bottom",
        leave: "top",
        // `sync` takes a boolean or an easing: "linear" scrubs the words
        // directly against scroll position with no easing lag.
        sync: "linear",
        // proof the scrub is actually running
        onUpdate: (self) => {
          if (self.progress > 0.001) advanced = true;
        },
      }),
    });

    /* Progressive enhancement guard. The scrubbed interpolation runs on the
       animation-frame loop, which browsers throttle in background tabs and
       low-power modes. If the scrub never advanced, revert so the heading sits
       at full opacity instead of parked at a dimmed value forever. */
    const guard = window.setTimeout(() => {
      if (!advanced) anim.revert();
    }, 1200);

    return () => {
      window.clearTimeout(guard);
      anim.revert();
    };
  }, [text, accent]);

  // split into words, keeping the accent phrase as a single coloured unit
  const parts: { text: string; accent: boolean }[] = [];
  if (accent && text.includes(accent)) {
    const [before, after] = text.split(accent);
    if (before.trim()) parts.push({ text: before.trim(), accent: false });
    parts.push({ text: accent, accent: true });
    if (after.trim()) parts.push({ text: after.trim(), accent: false });
  } else {
    parts.push({ text, accent: false });
  }

  return (
    <Tag ref={ref} className={className}>
      {parts.map((part, pi) =>
        part.accent ? (
          <span key={pi} className="text-lime">
            {part.text.split(" ").map((w, wi) => (
              <span key={wi} data-word className="inline-block">
                {w}
                {wi < part.text.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </span>
        ) : (
          part.text.split(" ").map((w, wi) => (
            <span key={`${pi}-${wi}`} data-word className="inline-block">
              {w}
              {"\u00A0"}
            </span>
          ))
        ),
      )}
    </Tag>
  );
}
