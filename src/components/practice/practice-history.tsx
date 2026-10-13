"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { examById } from "@/data/exams";
import { clearAttempts, formatClock, latestPerExam, loadAttempts } from "@/lib/practice";
import type { Attempt } from "@/data/practice/types";
import { Eyebrow } from "@/components/ui";

/**
 * Practice history for this browser.
 *
 * The results screen tells a student their attempts are kept; this is what makes
 * that true rather than a dangling claim. Attempts are local, like the rest of the
 * workspace — they are practice, not official scores, and they are not synced.
 */
export function PracticeHistory() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  if (attempts.length === 0) {
    return (
      <section className="mt-10">
        <Eyebrow>practice</Eyebrow>
        <p className="mt-3 max-w-2xl rounded-2xl border border-dashed border-line2 p-5 text-sm leading-relaxed text-fog">
          No practice attempts yet. Every set is original questions in the exam&apos;s format with an
          explanation for each answer, and your results land here.{" "}
          <Link href="/exams/sat/practice" className="text-lime hover:underline">
            Try the SAT set →
          </Link>
        </p>
      </section>
    );
  }

  const latest = latestPerExam(attempts);
  const totalQuestions = attempts.reduce((n, a) => n + a.total, 0);
  const totalCorrect = attempts.reduce((n, a) => n + a.correct, 0);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>practice</Eyebrow>
        <button
          type="button"
          onClick={() => {
            clearAttempts();
            setAttempts([]);
          }}
          className="text-[11px] font-bold text-dim hover:text-red"
        >
          clear practice history
        </button>
      </div>

      <p className="mt-3 text-xs text-dim">
        {attempts.length} attempt{attempts.length === 1 ? "" : "s"} ·{" "}
        <span className="text-lime">
          {totalCorrect}/{totalQuestions}
        </span>{" "}
        correct overall · kept in this browser
      </p>

      <ul className="mt-4 space-y-3">
        {latest.map((a) => {
          const exam = examById(a.examId);
          const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
          const weak = [...a.bySection].sort(
            (x, y) => x.correct / x.total - y.correct / y.total,
          )[0];
          return (
            <li key={a.examId} className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-paper">
                  {exam?.name ?? a.examId} · {a.setName}
                </span>
                <span className="tabular-nums text-xs text-dim">
                  {a.correct}/{a.total} · {pct}% · {formatClock(a.seconds)}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {a.bySection.map((s) => (
                  <li key={s.section}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-fog">{s.section}</span>
                      <span className="tabular-nums text-dim">
                        {s.correct}/{s.total}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-mint to-lime"
                        style={{ width: `${(s.correct / s.total) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
                {a.missed.length > 0 && weak && (
                  <span className="text-amber">
                    weakest: {weak.section} · {a.missed.length} to review
                  </span>
                )}
                <Link
                  href={`/exams/${a.examId}/practice`}
                  className="font-bold text-lime hover:underline"
                >
                  practise again →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
