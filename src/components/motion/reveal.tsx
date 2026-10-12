"use client";

/**
 * Motion reveal module — re-exports the CSS-driven implementation.
 *
 * The site standard is compositor-driven entrance animation (see
 * `@/components/reveal`). Keeping this path as a re-export means components can
 * import from either location with identical, robust behaviour.
 */
export { Reveal, Stagger, MotionItem, staggerItem } from "@/components/reveal";
