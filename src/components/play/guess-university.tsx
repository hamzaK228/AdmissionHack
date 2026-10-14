"use client";

import { useCallback, useEffect, useState } from "react";
import { moneyK, pick, loadBest, saveBest, type PlayUni } from "@/lib/play";
import { Eyebrow } from "@/components/ui";

/**
 * Guess the university.
 *
 * Three clues, four options, and the score depends on how few clues you needed —
 * so the game rewards knowing the landscape rather than recognising a name. The
 * first distractor is deliberately from the same country when one exists, which
 * makes clue one useless on its own and forces the later clues to do the work.
 *
 * Exhausting the clues without a correct guess ends the run, which is what makes
 * the running score worth protecting.
 */

const BEST_KEY = "ah.play.guess.best";

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const cluesFor = (u: PlayUni): string[] => [
  `It is in ${u.country}.`,
  u.qs != null
    ? `It sits at #${u.qs} in the QS world rankings.`
    : `It is a specialist institution the global rankings do not cover.`,
  `A year of international tuition runs about ${moneyK(u.min)}–${moneyK(u.max)}.`,
];

interface Round {
  target: PlayUni;
  options: PlayUni[];
}

function buildRound(unis: PlayUni[]): Round | null {
  const target = pick(unis);
  if (!target) return null;

  const sameCountry = unis.filter((u) => u.country === target.country && u.slug !== target.slug);
  const anywhere = unis.filter((u) => u.slug !== target.slug);

  const chosen: PlayUni[] = [];
  const first = pick(sameCountry);
  if (first) chosen.push(first);
  while (chosen.length < 3) {
    const next = pick(anywhere, [target.slug, ...chosen.map((c) => c.slug)], (u) => u.slug);
    if (!next) break;
    chosen.push(next);
  }

  return { target, options: shuffle([target, ...chosen]) };
}

export function GuessUniversity({ unis }: { unis: PlayUni[] }) {
  const [round, setRound] = useState<Round | null>(null);
  const [clueIndex, setClueIndex] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<"ask" | "won" | "lost">("ask");

  useEffect(() => setBest(loadBest(BEST_KEY)), []);

  const next = useCallback(
    (reset: boolean) => {
      if (reset) setScore(0);
      setRound(buildRound(unis));
      setClueIndex(0);
      setWrong([]);
      setPhase("ask");
    },
    [unis],
  );

  useEffect(() => {
    if (unis.length >= 4 && !round) next(false);
  }, [unis, round, next]);

  if (!round) return <p className="text-sm text-dim">shuffling the deck…</p>;

  const clues = cluesFor(round.target);
  const revealed = clues.slice(0, clueIndex + 1);
  const worth = 3 - clueIndex;

  const guess = (u: PlayUni) => {
    if (phase !== "ask") return;
    if (u.slug === round.target.slug) {
      const total = score + worth;
      setScore(total);
      if (total > best) {
        setBest(total);
        saveBest(BEST_KEY, total);
      }
      setPhase("won");
      return;
    }
    setWrong((w) => [...w, u.slug]);
    if (clueIndex >= clues.length - 1) {
      setPhase("lost");
      if (score > best) {
        setBest(score);
        saveBest(BEST_KEY, score);
      }
      return;
    }
    setClueIndex((i) => i + 1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>guess the university</Eyebrow>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-dim">
            score <span className="font-mono text-lg font-bold text-lime">{score}</span>
          </span>
          <span className="text-dim">
            best <span className="font-mono font-bold text-fog">{best}</span>
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-fog">
        Read the clue, then guess. You score 3 with one clue, 2 with two, 1 with three — and running out of
        clues ends the run.
      </p>

      <ul className="mt-5 space-y-2">
        {revealed.map((c, i) => (
          <li
            key={i}
            className="rounded-xl border border-line bg-panel/70 px-4 py-3 font-mono text-sm text-paper"
          >
            <span className="mr-2 text-lime">{String(i + 1).padStart(2, "0")}</span>
            {c}
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {round.options.map((u) => {
          const isWrong = wrong.includes(u.slug);
          const isAnswer = phase !== "ask" && u.slug === round.target.slug;
          return (
            <button
              key={u.slug}
              type="button"
              disabled={phase !== "ask" || isWrong}
              onClick={() => guess(u)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
                isAnswer
                  ? "border-mint/60 bg-mint/[0.07] text-mint"
                  : isWrong
                    ? "border-line bg-panel/30 text-dim line-through"
                    : "border-line bg-panel/70 text-paper hover:border-lime/50 hover:text-lime"
              }`}
            >
              {u.name}
            </button>
          );
        })}
      </div>

      {phase === "won" && (
        <div className="mt-4 rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
          <p className="text-sm font-bold text-mint">
            {worth === 3 ? "First clue — instant." : worth === 2 ? "Two clues." : "Got there in the end."}{" "}
            +{worth}
          </p>
          <button
            type="button"
            onClick={() => next(false)}
            className="anim-glow mt-3 rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
          >
            next university →
          </button>
        </div>
      )}

      {phase === "lost" && (
        <div className="mt-4 rounded-2xl border border-line bg-panel/70 p-5">
          <p className="text-sm font-bold text-amber">Out of clues — it was {round.target.name}.</p>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            {round.target.country}
            {round.target.qs != null ? `, QS #${round.target.qs}` : ""} · tuition about{" "}
            {moneyK(round.target.min)}–{moneyK(round.target.max)} a year. Final score {score}.
          </p>
          <button
            type="button"
            onClick={() => next(true)}
            className="anim-glow mt-4 rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
          >
            start a new run
          </button>
        </div>
      )}
    </div>
  );
}
