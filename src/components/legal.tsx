import type { ReactNode } from "react";

/**
 * The small set of primitives the legal pages are written in.
 *
 * Shared because /privacy and /terms have to read the same way — inconsistent
 * typography between two documents that a reader jumps between makes both look
 * less considered than they are.
 */

export function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="headline-gradient mt-12 text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm leading-relaxed text-fog">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 space-y-2 text-sm leading-relaxed text-fog">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="shrink-0 text-lime">—</span>
      <span>{children}</span>
    </li>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-xs leading-relaxed text-dim">{children}</p>;
}
