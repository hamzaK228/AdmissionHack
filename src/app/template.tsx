"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Route transition.
 *
 * The outgoing page is replaced instantly by Next, so the work here is making
 * the incoming page's arrival read as deliberate rather than abrupt: a short
 * blur bridges the swap (the two states blend instead of visibly overlapping),
 * combined with a small rise. Under 400ms, and motion honours the OS setting.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
