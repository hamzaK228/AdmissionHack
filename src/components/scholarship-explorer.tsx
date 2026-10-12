"use client";

import { useMemo, useState } from "react";
import type { Scholarship, CompetitionLevel } from "@/data/scholarships";
import { competitionLabel } from "@/data/scholarships";
import { Badge } from "@/components/ui";

const competitionTone: Record<CompetitionLevel, "lime" | "amber" | "cyan"> = {
  "extremely-competitive": "amber",
  competitive: "lime",
  moderate: "cyan",
};

const levels = ["all", "bachelor's", "master's", "PhD"] as const;

export function ScholarshipExplorer({ items }: { items: Scholarship[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("all");

  const filtered = useMemo(
    () =>
      items.filter((s) => {
        if (level !== "all" && !(s.levels as readonly string[]).includes(level)) return false;
        if (query && !`${s.name} ${s.provider} ${s.host}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [items, query, level],
  );

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-line bg-panel/70 p-4 sm:grid-cols-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="$ grep scholarships…"
          className="rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as (typeof levels)[number])}
          className="rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors focus:border-lime/60 [&>option]:bg-ink"
        >
          {levels.map((l) => (
            <option key={l} value={l}>
              {l === "all" ? "all levels" : l}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-5 text-xs uppercase tracking-widest text-dim">
        <span className="text-lime">{String(filtered.length).padStart(2, "0")}</span> / {items.length}{" "}
        programs
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {filtered.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl border border-line bg-panel/70 p-5 card-interactive"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold leading-snug text-paper transition-colors group-hover:text-lime">
                  {s.name}
                </h3>
                <p className="mt-1 text-[11px] text-dim">
                  {s.provider} · {s.host}
                </p>
              </div>
              <Badge tone={competitionTone[s.competition]}>{competitionLabel[s.competition]}</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              <span className="text-mint">covers:</span> {s.covers}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-dim">
              <span className="text-fog">eligibility:</span> {s.eligibility}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
              {s.levels.map((l) => (
                <Badge key={l}>{l}</Badge>
              ))}
              <Badge tone="lime">apply: {s.window}</Badge>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line2 p-10 text-center">
          <p className="font-bold text-paper">grep: no matches found</p>
        </div>
      )}
    </div>
  );
}
