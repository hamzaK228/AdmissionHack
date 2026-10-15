"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Route transition.
 *
 * The outgoing page is replaced instantly by Next, so the work here is making
 * the incoming page's arrival read as deliberate rather than abrupt: a short
 * rise and fade, under 400ms, honouring the OS motion setting.
 *
 * This used to animate `filter: blur(6px) → blur(0px)` to blend the swap, and
 * that was the wrong trade. A filter animation on the page root forces a full
 * raster and blur of the entire subtree on every frame of the transition, and
 * because the animated value ends at `blur(0px)` rather than `none`, motion
 * leaves that filter on the page root as an inline style — so every page kept a
 * filter pass and its own compositing layer for the entire session, long after
 * the 340ms it was for. Opacity and transform get the same arrival for free on
 * the compositor and cost nothing when the transition is over.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
