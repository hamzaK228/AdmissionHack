/**
 * Compatibility shim: the original hand-rolled Reveal lived here.
 * It now re-exports the motion.dev implementation so every page that imports
 * `@/components/reveal` gets spring-based motion without import changes.
 */
export { Reveal, Stagger, MotionItem, staggerItem } from "@/components/motion/reveal";
