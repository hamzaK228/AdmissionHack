/**
 * Companion hubs — sites that go deeper than an in-platform practice set.
 *
 * A platform that tries to own every drill will do each one badly. Where a real
 * engine already exists, the honest thing is a clear hand-off rather than a worse
 * copy of it, and the user's own SAT platform is exactly that case.
 *
 * The distinction worth stating in the UI is about provenance: SAThack drills
 * official College Board questions, while the in-platform SAT set is original
 * writing. Both are useful and they are not the same thing — a student should know
 * which one they are looking at.
 *
 * This is a hand-off, not a single sign-on: the two sites have separate accounts,
 * and the note below says so rather than letting the reader assume otherwise.
 */

export interface CompanionHub {
  examId: string;
  name: string;
  url: string;
  tagline: string;
  blurb: string;
  facts: string[];
  /** the thing a visitor would otherwise assume wrongly */
  caveat: string;
}

export const COMPANION_HUBS: CompanionHub[] = [
  {
    examId: "sat",
    name: "SAThack",
    url: "https://sathack-smoky.vercel.app",
    tagline: "Read the system. Ace the SAT.",
    blurb:
      "The deeper SAT engine: an adaptive diagnostic, drills, timed modules, error-log review, full-length mocks and a score predictor, built around official College Board material.",
    facts: [
      "a bank of official College Board questions — 3,766 of them by its own count",
      "adaptive diagnostic and score prediction",
      "its own free account",
    ],
    caveat:
      "Separate accounts. This workspace holds your admission plan; SAThack holds your drilling, and nothing is carried between them automatically.",
  },
];

export function companionHubFor(examId: string): CompanionHub | null {
  return COMPANION_HUBS.find((h) => h.examId === examId) ?? null;
}
