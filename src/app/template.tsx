import type { ReactNode } from "react";

/**
 * Route transition.
 *
 * The outgoing page is replaced instantly by Next, so the work here is making the
 * incoming page's arrival read as deliberate rather than abrupt: a short rise and fade,
 * under 400ms, honouring the OS motion setting. The keyframes live in `globals.css`.
 *
 * Two things were deliberately taken out of this file, and both for the same reason —
 * a page whose visibility depends on JavaScript is a page that can disappear:
 *
 *  1. **The animation is CSS, not motion.** A JS entrance starts the page at
 *     `opacity: 0` and lifts it on requestAnimationFrame, so while the main thread is
 *     busy the content stays invisible — exactly when a slow machine is loading a heavy
 *     dashboard. The compositor drives a CSS opacity/transform animation, so it finishes
 *     on schedule no matter what the main thread is doing.
 *  2. **It animated `filter: blur()`, which is gone.** A filter animation on the page
 *     root forces a full-page raster and blur on every frame, and because the animated
 *     value ended at `blur(0px)` rather than `none`, motion left that filter on the page
 *     root as an inline style — so every page kept a filter pass and its own compositing
 *     layer for the whole session. Opacity and transform give the same arrival for free.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
