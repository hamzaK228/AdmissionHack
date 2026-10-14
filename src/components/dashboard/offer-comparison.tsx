"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { APP_STATUSES, statusOf, statusSpec, summarize, type AppStatus } from "@/lib/applications";
import type { SlimUni } from "@/lib/match-engine";
import { Eyebrow } from "@/components/ui";

/**
 * Offer comparison — the decision-moment view.
 *
 * When multiple offers land, the question is no longer "will I get in?" but
 * "what does it cost, where does it take me, and which one is the best value?"
 * This tab answers that using data the directory already holds: tuition,
 * rankings, location and selectivity.
 */

const OUTCOME_ORDER: AppStatus[] = ["offer", "waitlisted", "rejected", "enrolled"];

function fmt$(n: number | null) {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

function rankStr(qs: number | null, arwu: number | string | null | undefined) {
  if (qs != null) return `QS #${qs}`;
  if (arwu != null) return `ARWU #${arwu}`;
  return "unranked";
}

/** Higher = better value: cheap and highly ranked. */
function valueScore(uni: SlimUni, budget: number): number | null {
  if (uni.qsRank == null || uni.tuitionMax == null) return null;
  // Normalise: 1.0 = free + #1 rank. 0.0 = budget + rank 1000.
  const costBonus = Math.max(0, (budget - uni.tuitionMax) / budget);
  const rankBonus = Math.max(0, 1 - uni.qsRank / 500);
  return costBonus * 0.5 + rankBonus * 0.5;
}

function ComparisonTable({
  offers,
  budget,
}: {
  offers: { uni: SlimUni; submittedOn?: string; decidedOn?: string }[];
  budget: number;
}) {
  const maxTuition = Math.max(...offers.map((o) => o.uni.tuitionMax ?? 0), 1);

  const ranked = useMemo(() => {
    return [...offers]
      .map((o) => ({ ...o, score: valueScore(o.uni, budget) }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [offers, budget]);

  const bestSlug = ranked[0]?.uni.slug;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-dim">
            <th className="pb-3 pr-4 font-bold">university</th>
            <th className="pb-3 pr-4 font-bold">ranking</th>
            <th className="pb-3 pr-4 font-bold">tuition / yr</th>
            <th className="pb-3 pr-4 font-bold">vs your budget</th>
            <th className="pb-3 pr-4 font-bold">value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {ranked.map(({ uni, score }) => {
            const over = uni.tuitionMax != null && uni.tuitionMax > budget;
            const isBest = uni.slug === bestSlug && score != null;
            return (
              <tr key={uni.slug} className={isBest ? "bg-mint/[0.04]" : ""}>
                <td className="py-3 pr-4">
                  <Link href={`/universities/${uni.slug}`} className="font-bold text-paper hover:text-lime">
                    {uni.name}
                  </Link>
                  <span className="block text-[11px] text-dim">
                    {uni.countryName}
                    {uni.selectivity !== "unknown" ? ` · ${uni.selectivity}` : ""}
                  </span>
                </td>
                <td className="py-3 pr-4 text-fog">{rankStr(uni.qsRank, uni.arwuRank)}</td>
                <td className="py-3 pr-4 text-fog">
                  {uni.tuitionMin != null && uni.tuitionMax != null ? (
                    <>
                      {fmt$(uni.tuitionMin)} – {fmt$(uni.tuitionMax)}
                    </>
                  ) : (
                    "not published"
                  )}
                </td>
                <td className="py-3 pr-4">
                  {uni.tuitionMax != null ? (
                    <div className="w-32">
                      <div className="flex justify-between text-[10px] text-dim">
                        <span>$0</span>
                        <span className={over ? "text-red" : "text-mint"}>
                          {over ? `$${(uni.tuitionMax - budget).toLocaleString()} over` : "within budget"}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full rounded-full ${over ? "bg-red" : "bg-mint"}`}
                          style={{ width: `${Math.min(100, (uni.tuitionMax / maxTuition) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {score != null ? (
                    <span className={`text-xs font-bold ${isBest ? "text-mint" : "text-fog"}`}>
                      {Math.round(score * 100)} / 100
                      {isBest && " ★ best value"}
                    </span>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OfferComparison({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { apps, profile } = useStore();
  const budget = profile?.budget ?? 25000;

  const byStatus = useMemo(() => {
    const map = new Map<AppStatus, { uni: SlimUni; app: (typeof apps)[number] }[]>();
    for (const app of apps) {
      const s = statusOf(app);
      if (!OUTCOME_ORDER.includes(s)) continue;
      const uni = uniIndex[app.slug];
      if (!uni) continue;
      const list = map.get(s) ?? [];
      list.push({ uni, app });
      map.set(s, list);
    }
    return map;
  }, [apps, uniIndex]);

  const offers = byStatus.get("offer") ?? [];
  const enrolled = byStatus.get("enrolled") ?? [];
  const waitlisted = byStatus.get("waitlisted") ?? [];
  const rejected = byStatus.get("rejected") ?? [];

  const sum = summarize(apps);

  if (sum.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line2 p-8 text-center">
        <Eyebrow>no applications yet</Eyebrow>
        <p className="mt-3 text-sm text-fog">
          Add universities to your list and track their statuses. When offers arrive, this tab
          compares cost, ranking and value side by side.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Offers comparison */}
      {offers.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <Eyebrow>
              {offers.length} offer{offers.length === 1 ? "" : "s"}
            </Eyebrow>
            {offers.length > 1 && (
              <span className="text-xs text-dim">sorted by cost-rank value score</span>
            )}
          </div>
          {offers.length === 1 ? (
            <div className="mt-4 rounded-2xl border border-mint/25 bg-mint/[0.06] p-5">
              <p className="text-sm font-bold text-paper">{offers[0].uni.name}</p>
              <p className="mt-1 text-xs text-fog">
                {rankStr(offers[0].uni.qsRank, offers[0].uni.arwuRank)} · {offers[0].uni.countryName}
                {offers[0].uni.tuitionMax != null && (
                  <>
                    {" · "}
                    tuition {fmt$(offers[0].uni.tuitionMin)} – {fmt$(offers[0].uni.tuitionMax)}
                  </>
                )}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-dim">
                One offer is a start — but you can’t compare a single data point. If you are still
                waiting on other decisions, keep this tab open.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-line bg-panel/70 p-5">
              <ComparisonTable
                offers={offers.map((o) => ({
                  uni: o.uni,
                  submittedOn: o.app.submittedOn,
                  decidedOn: o.app.decidedOn,
                }))}
                budget={budget}
              />
            </div>
          )}
        </section>
      )}

      {/* Enrolled */}
      {enrolled.length > 0 && (
        <section>
          <Eyebrow>enrolled</Eyebrow>
          <ul className="mt-4 space-y-2">
            {enrolled.map(({ uni }) => (
              <li
                key={uni.slug}
                className="flex items-center justify-between rounded-xl border border-mint/30 bg-mint/[0.06] px-4 py-3"
              >
                <span className="text-sm font-bold text-paper">{uni.name}</span>
                <span className="text-xs text-mint">you are going here 🎓</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Waitlisted */}
      {waitlisted.length > 0 && (
        <section>
          <Eyebrow>waitlisted</Eyebrow>
          <p className="mt-2 text-xs text-fog">
            A waitlist is not a rejection — places open up. Send a short letter of continued interest
            if the university allows one.
          </p>
          <ul className="mt-3 space-y-2">
            {waitlisted.map(({ uni, app }) => (
              <li
                key={uni.slug}
                className="flex items-center justify-between rounded-xl border border-amber/30 bg-amber/[0.05] px-4 py-3"
              >
                <span className="text-sm font-bold text-paper">{uni.name}</span>
                <span className="text-xs text-amber">waitlisted · still possible</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <Eyebrow>not this time</Eyebrow>
          <p className="mt-2 text-xs text-fog">
            Rejections are data, not verdicts. Move the effort to the applications still open.
          </p>
          <ul className="mt-3 space-y-2">
            {rejected.map(({ uni }) => (
              <li
                key={uni.slug}
                className="flex items-center justify-between rounded-xl border border-line bg-panel/40 px-4 py-3 opacity-60"
              >
                <span className="text-sm text-paper">{uni.name}</span>
                <span className="text-xs text-dim">rejected</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nothing with a decision yet */}
      {offers.length === 0 && enrolled.length === 0 && waitlisted.length === 0 && rejected.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line2 p-8 text-center">
          <Eyebrow>decisions pending</Eyebrow>
          <p className="mt-3 text-sm text-fog">
            None of your applications have reached an outcome yet. When offers, waitlists or
            rejections arrive, mark them on the <strong>universities</strong> tab and they will
            appear here for comparison.
          </p>
        </div>
      )}
    </div>
  );
}
