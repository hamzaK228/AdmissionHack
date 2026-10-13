"use client";

import type { Attempt, Question, SectionScore } from "@/data/practice/types";

/**
 * Scoring, kept out of the components so it can be reasoned about on its own.
 *
 * Deliberately total: an unanswered question counts as wrong, because on the real
 * test it is, and a scorer that quietly ignores blanks flatters the student.
 */

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface ScoreResult {
  correct: number;
  total: number;
  bySection: SectionScore[];
  missed: string[];
}

export function scoreAttempt(
  questions: Question[],
  answers: Record<string, string>,
): ScoreResult {
  let correct = 0;
  const sections = new Map<string, SectionScore>();
  const missed: string[] = [];

  for (const q of questions) {
    const given = answers[q.id];
    const right = given === q.answer;
    if (right) correct++;
    else missed.push(q.id);

    const row = sections.get(q.section) ?? { section: q.section, correct: 0, total: 0 };
    row.total++;
    if (right) row.correct++;
    sections.set(q.section, row);
  }

  return { correct, total: questions.length, bySection: [...sections.values()], missed };
}

/** mm:ss, counting up — the runner never cuts anyone off mid-question. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function buildAttempt(
  questions: Question[],
  answers: Record<string, string>,
  meta: { setId: string; setName: string; examId: string; seconds: number },
): Attempt {
  const scored = scoreAttempt(questions, answers);
  return {
    id: `${meta.setId}-${Date.now()}`,
    setId: meta.setId,
    setName: meta.setName,
    examId: meta.examId,
    total: scored.total,
    correct: scored.correct,
    bySection: scored.bySection,
    missed: scored.missed,
    seconds: meta.seconds,
    finishedAt: new Date().toISOString(),
  };
}

/* ── history, in this browser ─────────────────────────────────────────────── */

const KEY = "ah.practice.attempts";
const LIMIT = 40;

export function loadAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Attempt[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt): Attempt[] {
  const next = [attempt, ...loadAttempts()].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — the attempt is still shown this session */
  }
  return next;
}

export function clearAttempts(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** The most recent attempt per exam, for a compact dashboard summary. */
export function latestPerExam(attempts: Attempt[]): Attempt[] {
  const byExam = new Map<string, Attempt>();
  for (const a of attempts) if (!byExam.has(a.examId)) byExam.set(a.examId, a);
  return [...byExam.values()];
}
