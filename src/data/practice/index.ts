import { satBank } from "./sat";
import { ieltsBank } from "./ielts";
import { toeflBank } from "./toefl";
import { detBank } from "./det";
import type { PracticeBank, Question } from "./types";

/**
 * The practice registry.
 *
 * One entry per exam that has content, so adding an exam is a new file beside
 * `sat.ts` plus a line here — which is the point of the blueprint: the engine does
 * not change when an exam is added.
 */
const banks: PracticeBank[] = [satBank, ieltsBank, toeflBank, detBank];

export function bankFor(examId: string): PracticeBank | null {
  return banks.find((b) => b.set.examId === examId) ?? null;
}

export function hasPractice(examId: string): boolean {
  return bankFor(examId) !== null;
}

export function questionsFor(examId: string): Question[] {
  return bankFor(examId)?.questions ?? [];
}

export function questionById(examId: string, id: string): Question | null {
  return questionsFor(examId).find((q) => q.id === id) ?? null;
}

/** Sections present in a bank, in first-appearance order, with their counts. */
export function sectionsFor(bank: PracticeBank): { section: string; count: number }[] {
  const seen = new Map<string, number>();
  for (const q of bank.questions) seen.set(q.section, (seen.get(q.section) ?? 0) + 1);
  return [...seen.entries()].map(([section, count]) => ({ section, count }));
}

/** Exams that currently have a bank, for the hub to link to. */
export const practiceExamIds = banks.map((b) => b.set.examId);

export { satBank };
export type { PracticeBank, Question, Attempt, SectionScore, SessionState } from "./types";
