"use client";

import { useState } from "react";
import { HigherLower } from "@/components/play/higher-lower";
import { GuessUniversity } from "@/components/play/guess-university";
import type { PlayUni } from "@/lib/play";

/**
 * The arcade shelf.
 *
 * Both games are the same deck of real universities asked two different ways, and
 * they share nothing but that deck — no score carries between them, because a
 * streak and a running score are not comparable things and pretending otherwise
 * would make the numbers meaningless.
 */

const GAMES = [
  { id: "higher-lower", label: "higher or lower", blurb: "which one costs more per year?" },
  { id: "guess", label: "guess the university", blurb: "three clues, four options" },
] as const;

type GameId = (typeof GAMES)[number]["id"];

export function Arcade({ unis }: { unis: PlayUni[] }) {
  const [game, setGame] = useState<GameId>("higher-lower");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGame(g.id)}
            aria-pressed={game === g.id}
            className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
              game === g.id
                ? "border-lime/50 bg-lime/10"
                : "border-line bg-panel/60 hover:border-lime/40"
            }`}
          >
            <span className={`block text-sm font-bold ${game === g.id ? "text-lime" : "text-fog"}`}>
              {g.label}
            </span>
            <span className="block text-[11px] text-dim">{g.blurb}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {game === "higher-lower" ? <HigherLower unis={unis} /> : <GuessUniversity unis={unis} />}
      </div>
    </div>
  );
}
