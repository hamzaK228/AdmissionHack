/**
 * Practice questions — the shape of the exam-hub engine.
 *
 * Per `docs/exam-hub-blueprint.md`, every exam hub is the same engine plus a
 * different content file, so the types here are deliberately exam-agnostic: a
 * question knows which exam and section it belongs to, not which exam it is.
 *
 * The bank is ORIGINAL question writing, styled after the real formats. Nothing
 * here is copied from a testing body's released material, and the UI says so —
 * which matters both for honesty and because copied questions are the one thing
 * that would make this hub worthless.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface Choice {
  /** "A" | "B" | "C" | "D" */
  id: string;
  text: string;
}

export interface Question {
  id: string;
  /** sat | ielts | toefl | det | csca */
  examId: string;
  /** the section this is scored under, e.g. "Math" or "Reading and Writing" */
  section: string;
  /** what it actually tests, used for the breakdown and for retry-by-skill */
  skill: string;
  /** the question itself */
  prompt: string;
  /** the passage, data, or sentence it refers to, when there is one */
  context?: string;
  choices: Choice[];
  /** the id of the correct choice */
  answer: string;
  explanation: string;
  /**
   * Optional: only set it on a question you have actually judged, and only when a
   * consumer uses it (adaptive ordering will). A required field that nothing reads
   * just invites inventing values.
   */
  difficulty?: Difficulty;
}

export interface PracticeSet {
  id: string;
  examId: string;
  name: string;
  blurb: string;
  /** suggested time in minutes; the runner counts up and never cuts you off */
  minutes: number;
}

export interface PracticeBank {
  set: PracticeSet;
  questions: Question[];
}

/** The order the tool chose, and what the student answered. */
export interface SessionState {
  setId: string;
  examId: string;
  order: string[];
  answers: Record<string, string>;
  index: number;
  startedAt: number;
}

export interface SectionScore {
  section: string;
  correct: number;
  total: number;
}

export interface Attempt {
  id: string;
  setId: string;
  setName: string;
  examId: string;
  total: number;
  correct: number;
  bySection: SectionScore[];
  /** question ids answered wrongly, so they can be retried by themselves */
  missed: string[];
  seconds: number;
  finishedAt: string;
}
