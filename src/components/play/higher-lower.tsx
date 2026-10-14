"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { money, moneyK, pick, loadBest, saveBest, type PlayUni } from "@/lib/play";
import { Eyebrow } from "@/components/ui";

/**
 * Higher or lower — tuition.
 *
 * The whole game is one question asked over and over: of these two, which costs
 * more per year? It uses sticker price (`max`) because that is the number a student
 * is actually quoted, and because a range-versus-range comparison has no clean
 * answer to be right about.
 *
 * The winner stays on as the champion, so the streak is a fair test of how much you
 * know rather than of how lucky your first pair was — and a wrong answer still
 * teaches the real figure before it ends the run.
 */

const BEST_KEY = "ah.play.hl.best";

function Card({
  uni,
  revealed,
  highlight,
  onPick,
  label,
}: {
  uni: PlayUni;
  revealed: boolean;
  highlight: boolean;
  onPick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={revealed}
      className={`flex-1 rounded-2xl border p-5 text-left transition-[border-color,background-color,transform] duration-200 ${
        revealed
          ? highlight
            ? "border-mint/60 bg-mint/[0.07]"
            : "border-line bg-panel/50 opacity-70"
          : "border-line bg-panel/70 hover:-translate-y-0.5 hover:border-lime/50"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">{label}</span>
      <span className="mt-2 block font-bold leading-snug text-paper">{uni.name}</span>
      <span className="mt-1 block text-xs text-dim">
        {uni.country}
        {uni.qs != null ? ` · QS #${uni.qs}` : ""}
      </span>
      <span
        className={`mt-4 block font-mono text-lg font-bold ${
          revealed ? (highlight ? "text-mint" : "text-fog") : "text-line2"
        }`}
      >
        {revealed ? `${moneyK(uni.max)}/yr` : "?"}
      </span>
      {revealed && (
        <span className="mt-0.5 block text-[11px] text-dim">
          {money(uni.min)}–{money(uni.max)}
        </span>
      )}
    </button>
  );
}

export function HigherLower({ unis }: { unis: PlayUni[] }) {
  const [champion, setChampion] = useState<PlayUni | null>(null);
  const [challenger, setChallenger] = useState<PlayUni | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<"ask" | "reveal" | "over">("ask");
  const [right, setRight] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setBest(loadBest(BEST_KEY)), []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const deal = useCallback(
    (keep: PlayUni | null) => {
      const a = keep ?? pick(unis, [], (u) => u.slug);
      const b = a ? pick(unis, [a.slug], (u) => u.slug) : null;
      setChampion(a);
      setChallenger(b);
      setPhase("ask");
    },
    [unis],
  );

  useEffect(() => {
    if (unis.length >= 2 && !champion) deal(null);
  }, [unis, champion, deal]);

  const start = () => {
    setStreak(0);
    deal(null);
  };

  const choose = (side: "champion" | "challenger") => {
    if (!champion || !challenger || phase !== "ask") return;
    const winner = champion.max >= challenger.max ? "champion" : "challenger";
    const correct = side === winner;
    const higher = winner === "champion" ? champion : challenger;

    setPhase("reveal");
    setRight(correct);

    if (!correct) {
      setPhase("over");
      if (streak > best) {
        setBest(streak);
        saveBest(BEST_KEY, streak);
      }
      return;
    }

    const next = streak + 1;
    setStreak(next);
    if (next > best) {
      setBest(next);
      saveBest(BEST_KEY, next);
    }
    // the winner stays on; a beat to read the real numbers first
    timer.current = setTimeout(() => deal(higher), 1200);
  };

  if (!champion || !challenger) {
    return <p className="text-sm text-dim">shuffling the deck…</p>;
  }

  const revealed = phase !== "ask";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>higher or lower · tuition</Eyebrow>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-dim">
            streak <span className="font-mono text-lg font-bold text-lime">{streak}</span>
          </span>
          <span className="text-dim">
            best <span className="font-mono font-bold text-fog">{best}</span>
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-fog">
        Which university charges more for a year of international tuition? The winner stays on, so the
        streak is about how much you actually know.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Card
          uni={champion}
          revealed={revealed}
          highlight={revealed && champion.max >= challenger.max}
          onPick={() => choose("champion")}
          label="the champion"
        />
        <Card
          uni={challenger}
          revealed={revealed}
          highlight={revealed && challenger.max > champion.max}
          onPick={() => choose("challenger")}
          label="the challenger"
        />
      </div>

      {phase === "reveal" && (
        <p className="mt-4 text-sm font-bold text-mint">correct — {champion.max >= challenger.max ? champion.name : challenger.name} costs more</p>
      )}

      {phase === "over" && (
        <div className="mt-4 rounded-2xl border border-line bg-panel/70 p-5">
          <p className="text-sm font-bold text-amber">
            {champion.max >= challenger.max ? champion.name : challenger.name} was the pricier one.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            {streak === 0
              ? "That was the first pair — the range above is the sticker price, and it is worth knowing what a year actually costs before you fall in love with a name."
              : `You got ${streak} in a row.`}
          </p>
          <button
            type="button"
            onClick={start}
            className="anim-glow mt-4 rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
          >
            play again
          </button>
        </div>
      )}
    </div>
  );
}
