"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bankFor, sectionsFor } from "@/data/practice";
import type { Attempt, Question } from "@/data/practice/types";
import { buildAttempt, formatClock, saveAttempt, scoreAttempt, shuffle } from "@/lib/practice";
import { Eyebrow } from "@/components/ui";

type Phase = "intro" | "running" | "done";

/**
 * The practice runner.
 *
 * Instant feedback rather than a silent scored test: you answer, the explanation
 * appears, and you move on — which is how practice actually teaches. The clock
 * counts up and never cuts you off, because being rushed is the thing you are
 * here to train, not the thing the tool should impose.
 *
 * Answers are only scored when you ask to see them, so a stray click cannot cost
 * you a mark. Keyboard: 1–4 or A–D to choose, Enter to check and then to advance.
 */
export function PracticeRunner({ examId, examName }: { examId: string; examName: string }) {
  const bank = bankFor(examId);
  const questions = useMemo(() => bank?.questions ?? [], [bank]);
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [retryOf, setRetryOf] = useState<string[] | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  const current: Question | undefined = byId.get(order[index] ?? "");

  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [phase, startedAt]);

  const start = useCallback(
    (only?: string[]) => {
      const pool = only ? questions.filter((q) => only.includes(q.id)) : questions;
      setOrder(shuffle(pool).map((q) => q.id));
      setAnswers({});
      setIndex(0);
      setRevealed(false);
      setRetryOf(only ?? null);
      setAttempt(null);
      setElapsed(0);
      setStartedAt(Date.now());
      setPhase("running");
    },
    [questions],
  );

  const finish = useCallback(
    (finalAnswers: Record<string, string>) => {
      const used = order.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
      const a = buildAttempt(used, finalAnswers, {
        setId: bank?.set.id ?? examId,
        setName: bank?.set.name ?? examName,
        examId,
        seconds: Math.round((Date.now() - startedAt) / 1000),
      });
      saveAttempt(a);
      setAttempt(a);
      setPhase("done");
    },
    [order, byId, bank, examId, examName, startedAt],
  );

  const advance = useCallback(() => {
    if (index + 1 < order.length) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      finish(answers);
    }
  }, [index, order.length, finish, answers]);

  useEffect(() => {
    if (phase !== "running" || !current) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!revealed) {
        const byNumber = ["1", "2", "3", "4"].indexOf(k);
        const byLetter = ["a", "b", "c", "d"].indexOf(k);
        const pos = byNumber >= 0 ? byNumber : byLetter;
        if (pos >= 0 && current.choices[pos]) {
          e.preventDefault();
          setAnswers((prev) => ({ ...prev, [current.id]: current.choices[pos].id }));
          return;
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (answers[current.id] && !revealed) setRevealed(true);
        else if (revealed) advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, revealed, answers, advance]);

  if (!bank) return null;

  /* ── intro ─────────────────────────────────────────────────────────────── */
  if (phase === "intro") {
    const sections = sectionsFor(bank);
    return (
      <div className="mx-auto max-w-2xl">
        <Eyebrow>{examName} practice</Eyebrow>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-paper sm:text-4xl">
          {bank.set.name}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-fog">{bank.set.blurb}</p>

        <ul className="mt-6 space-y-2">
          {sections.map((s) => (
            <li
              key={s.section}
              className="flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3"
            >
              <span className="text-sm font-bold text-paper">{s.section}</span>
              <span className="text-xs text-dim">{s.count} questions</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => start()}
            className="anim-glow rounded-lg bg-lime px-6 py-3 text-sm font-bold text-ink press-grow"
          >
            start — {questions.length} questions
          </button>
          <span className="text-xs text-dim">suggested: {bank.set.minutes} min · the clock counts up</span>
        </div>

        <p className="mt-8 rounded-xl border border-line2 bg-panel/40 p-4 text-xs leading-relaxed text-dim">
          These questions are <span className="text-paper">original writing</span> in the style of the
          exam, not released material from the testing body. They are for practice; use official
          papers for a score you can rely on.
        </p>

        <p className="mt-4 text-xs text-dim">
          Keyboard: 1–4 or A–D to choose, Enter to check and to advance.
        </p>
      </div>
    );
  }

  /* ── running ───────────────────────────────────────────────────────────── */
  if (phase === "running" && current) {
    const picked = answers[current.id];
    const isRight = picked === current.answer;

    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-dim">
            {current.section} · {current.skill}
          </span>
          <span className="font-mono text-xs tabular-nums text-fog">{formatClock(elapsed)}</span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-lime transition-[width] duration-300"
            style={{ width: `${((index + (revealed ? 1 : 0)) / order.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-dim">
          {index + 1} of {order.length}
          {retryOf ? " · retrying the ones you missed" : ""}
          {" · "}
          <span className="text-mint">{Object.keys(answers).length} answered</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-panel/70 p-5 sm:p-6">
          {current.context && (
            <p className="mb-4 rounded-xl border border-line bg-ink px-4 py-3 text-sm leading-relaxed text-fog">
              {current.context}
            </p>
          )}
          <p className="whitespace-pre-line text-base leading-relaxed text-paper">{current.prompt}</p>

          <ul className="mt-5 space-y-2">
            {current.choices.map((c, i) => {
              const chosen = picked === c.id;
              const showRight = revealed && c.id === current.answer;
              const showWrong = revealed && chosen && c.id !== current.answer;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={revealed}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: c.id }))}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      showRight
                        ? "border-mint/60 bg-mint/[0.08]"
                        : showWrong
                          ? "border-red/50 bg-red/[0.06]"
                          : chosen
                            ? "border-lime/60 bg-lime/[0.07]"
                            : "border-line bg-ink hover:border-lime/40"
                    } ${revealed ? "cursor-default" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                        showRight
                          ? "border-mint text-mint"
                          : showWrong
                            ? "border-red text-red"
                            : chosen
                              ? "border-lime text-lime"
                              : "border-line2 text-dim"
                      }`}
                    >
                      {c.id}
                    </span>
                    <span className="text-sm leading-relaxed text-fog">{c.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {revealed && (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                isRight ? "border-mint/40 bg-mint/[0.05]" : "border-amber/40 bg-amber/[0.05]"
              }`}
            >
              <p className={`text-xs font-bold ${isRight ? "text-mint" : "text-amber"}`}>
                {isRight ? "correct" : `not quite — the answer is ${current.answer}`}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-fog">{current.explanation}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!revealed ? (
              <button
                type="button"
                disabled={!picked}
                onClick={() => setRevealed(true)}
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
              >
                check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
              >
                {index + 1 < order.length ? "next question →" : "see results →"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPhase("intro")}
              className="link-quiet rounded-lg border border-line2 px-4 py-2.5 text-xs font-bold text-fog"
            >
              leave the set
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── results ───────────────────────────────────────────────────────────── */
  if (phase === "done" && attempt) {
    const pct = attempt.total ? Math.round((attempt.correct / attempt.total) * 100) : 0;
    const missedQuestions = attempt.missed
      .map((id) => byId.get(id))
      .filter((q): q is Question => Boolean(q));

    return (
      <div className="mx-auto max-w-2xl">
        <Eyebrow>{examName} practice · results</Eyebrow>
        <div className="mt-4 flex items-end gap-4">
          <span className="text-5xl font-bold tabular-nums text-paper">
            {attempt.correct}
            <span className="text-2xl text-dim">/{attempt.total}</span>
          </span>
          <span className="pb-1 text-sm text-fog">
            {pct}% · {formatClock(attempt.seconds)}
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {attempt.bySection.map((s) => {
            const sectionPct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <li key={s.section}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-paper">{s.section}</span>
                  <span className="tabular-nums text-dim">
                    {s.correct}/{s.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint to-lime"
                    style={{ width: `${sectionPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {attempt.missed.length > 0 && (
            <button
              type="button"
              onClick={() => start(attempt.missed)}
              className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
            >
              retry the {attempt.missed.length} I missed
            </button>
          )}
          <button
            type="button"
            onClick={() => start()}
            className="rounded-lg border border-line2 px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
          >
            {attempt.missed.length > 0 ? "new full set" : "again"}
          </button>
          <Link
            href={`/exams/${examId}`}
            className="rounded-lg border border-line2 px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
          >
            back to {examName}
          </Link>
        </div>

        {missedQuestions.length > 0 && (
          <section className="mt-10">
            <Eyebrow>what to review</Eyebrow>
            <ul className="mt-4 space-y-4">
              {missedQuestions.map((q) => (
                <li key={q.id} className="rounded-2xl border border-line bg-panel/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-dim">
                    {q.section} · {q.skill}
                  </p>
                  {q.context && (
                    <p className="mt-2 text-xs leading-relaxed text-dim">{q.context}</p>
                  )}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper">{q.prompt}</p>
                  <p className="mt-3 text-xs text-mint">
                    answer: {q.answer} — {q.choices.find((c) => c.id === q.answer)?.text}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-fog">{q.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-xs leading-relaxed text-dim">
          Results are kept in this browser. They are practice attempts, not official scores.
        </p>
      </div>
    );
  }

  return null;
}
