"use client";

import { useMemo } from "react";
import { useStore } from "@/components/dashboard/store";
import { requirementsFor, gapsIn, type RequirementItem } from "@/lib/requirements";
import { countries } from "@/data/countries";
import { Eyebrow } from "@/components/ui";
import type { SlimUni } from "@/lib/match-engine";

/**
 * The requirement checker tab.
 *
 * The document checklist answers "what does every applicant need"; this answers
 * "what does *this* application need" — which is a different list in every
 * country, and the one that costs people a season when it surfaces late. The
 * per-country facts are the country guides' own wording, shown verbatim so a
 * figure stays attached to its source.
 *
 * Readiness is derived from the checklist and the exams tab, and the tab says so
 * on every line rather than implying a completeness it cannot see. Anything not
 * observable is listed as context and left out of the count.
 */

const MARK: Record<string, { glyph: string; cls: string }> = {
  true: { glyph: "✓", cls: "text-mint" },
  false: { glyph: "✗", cls: "text-red" },
  unknown: { glyph: "·", cls: "text-dim" },
};

function ItemRow({ item }: { item: RequirementItem }) {
  const key = item.met === true ? "true" : item.met === false ? "false" : "unknown";
  const mark = MARK[key];
  return (
    <li className="flex items-start gap-3 border-b border-line/60 py-3 last:border-0">
      <span className={`mt-0.5 w-4 shrink-0 text-center font-bold ${mark.cls}`} aria-hidden>
        {mark.glyph}
      </span>
      <span className="min-w-0">
        <span className={`text-sm font-bold ${item.met === false ? "text-paper" : "text-paper"}`}>
          {item.label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-fog">{item.detail}</span>
        <span className="mt-1 block text-[10px] uppercase tracking-wider text-dim">
          {item.met === null ? `context · ${item.evidence}` : `read from ${item.evidence}`}
        </span>
      </span>
      {item.met === false && (
        <span className="ml-auto shrink-0 rounded border border-red/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">
          missing
        </span>
      )}
    </li>
  );
}

export function RequirementChecker({
  uniIndex,
  onGo,
}: {
  uniIndex: Record<string, SlimUni>;
  onGo?: (tab: string) => void;
}) {
  const { apps, checklist, exams, profile } = useStore();

  const groups = useMemo(
    () =>
      requirementsFor({
        checklist,
        exams,
        apps: apps.map((a) => ({ slug: a.slug, tier: a.tier })),
        uniBySlug: Object.fromEntries(
          Object.entries(uniIndex).map(([slug, u]) => [slug, { name: u.name, countryName: u.countryName }]),
        ),
        level: profile?.level === "master's" ? "master's" : "bachelor's",
      }),
    [apps, checklist, exams, profile?.level, uniIndex],
  );

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line2 p-8 text-center">
        <Eyebrow>nothing to check yet</Eyebrow>
        <p className="mt-3 text-sm text-fog">
          Add universities to your list and this tab works out what each application asks for — per
          country, including the requirements a generic checklist cannot know about.
        </p>
      </div>
    );
  }

  const gaps = gapsIn(groups);

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        Your document checklist covers what <em>every</em> applicant needs. This covers what{" "}
        <em>each</em> country asks for, which is a different list — and the one that surfaces late. The
        facts on each card are the words of our country guide, not a summary of them.
      </p>

      <p className="mt-3 text-xs text-dim">
        {apps.length} application{apps.length === 1 ? "" : "s"} across {groups.length} countr
        {groups.length === 1 ? "y" : "ies"}
        {gaps > 0 ? (
          <>
            {" · "}
            <span className="text-red">{gaps} item{gaps === 1 ? "" : "s"} missing</span>
          </>
        ) : (
          <>
            {" · "}
            <span className="text-mint">nothing you can tick is missing</span>
          </>
        )}
      </p>

      <div className="mt-8 space-y-6">
        {groups.map((g) => {
          const flag = countries.find((c) => c.name === g.countryName)?.flag ?? "🌍";
          const pct = g.observable ? (g.ready / g.observable) * 100 : 0;
          const missing = g.items.filter((i) => i.met === false).length;
          return (
            <section key={g.countryName} className="rounded-2xl border border-line bg-panel/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-paper">
                    <span className="mr-2">{flag}</span>
                    {g.countryName}
                  </h3>
                  <p className="mt-1 text-xs text-dim">
                    {g.universities.map((u) => u.name).join(" · ")}
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-dim">
                    <span>
                      {g.ready}/{g.observable} ready
                    </span>
                    {missing > 0 && <span className="text-red">{missing} missing</span>}
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? "bg-mint" : "bg-gradient-to-r from-amber to-lime"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {g.facts.length > 0 && (
                <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.facts.map((f) => (
                    <div key={f.label} className="rounded-xl border border-line bg-ink p-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
                        {f.label}
                      </dt>
                      <dd className="mt-1.5 text-xs leading-relaxed text-paper">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {g.facts.length === 0 && (
                <p className="mt-5 rounded-xl border border-dashed border-line2 p-4 text-xs leading-relaxed text-fog">
                  No country guide for {g.countryName} yet, so this card shows the universal
                  requirements only. Check the university&rsquo;s own site for anything local — a
                  certificate or a translation requirement is the usual surprise.
                </p>
              )}

              <ul className="mt-5">
                {g.items.map((i) => (
                  <ItemRow key={i.id} item={i} />
                ))}
              </ul>

              {g.gotchas.length > 0 && (
                <div className="mt-5 rounded-xl border border-amber/30 bg-amber/[0.05] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
                    mistakes people make here
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {g.gotchas.slice(0, 3).map((got, i) => (
                      <li key={i} className="text-xs leading-relaxed text-fog">
                        — {got}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {onGo && (
        <div className="mt-8 rounded-2xl border border-line bg-panel/70 p-5">
          <p className="text-sm leading-relaxed text-fog">
            The ticks this reads live on the documents tab, and the scores on the exams tab. Tick
            something there and the count here moves.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGo("documents")}
              className="rounded-lg border border-line2 bg-panel px-4 py-2 text-xs font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
            >
              documents checklist →
            </button>
            <button
              type="button"
              onClick={() => onGo("exams")}
              className="rounded-lg border border-line2 bg-panel px-4 py-2 text-xs font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
            >
              exams & scores →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
