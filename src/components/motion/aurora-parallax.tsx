"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";

/**
 * The site's aurora, scroll-linked: the two blobs keep their own CSS drift
 * rhythm AND glide at different speeds as the page scrolls (parallax depth).
 * Uses a manual scroll listener for deterministic behavior.
 */
export function AuroraParallax() {
  const scrollY = useMotionValue(0);

  useEffect(() => {
    const onScroll = () => scrollY.set(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollY]);

  const y1 = useTransform(scrollY, [0, 2400], [0, 260]);
  const y2 = useTransform(scrollY, [0, 2400], [0, -180]);

  return (
    <div className="aurora" aria-hidden>
      <motion.div className="absolute inset-0" style={{ y: y1 }}>
        <div className="aurora-blob aurora-blob-1" />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: y2 }}>
        <div className="aurora-blob aurora-blob-2" />
      </motion.div>
    </div>
  );
}
