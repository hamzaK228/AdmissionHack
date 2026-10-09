"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/components/dashboard/store";
import { matchUniversities, type SlimUni } from "@/lib/match-engine";
import { countries } from "@/data/countries";
import { Eyebrow } from "@/components/ui";
import { Stagger, MotionItem } from "@/components/motion/reveal";

const TIERS = [
  { id: "dream", label: "Dream", icon: "🏆", hint: "reaches — worth the shot" },
  { id: "target", label: "Target", icon: "🎯", hint: "realistic matches" },
  { id: "safe", label: "Safe", icon: "🛡️", hint: "strong admits" },
] as const;

const chanceColor = (c: number) => (c >= 0.65 ? "text-lime" : c >= 0.35 ? "text-paper" : "text-amber");

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-dim";

export function MatchTab({
  uniIndex,
  onGo,
}: {
  uniIndex: Record<string, SlimUni>;
  onGo: (tab: string) => void;
}) {
  const store = useStore();
  const { profile, exams, saveProfile, apps, toggleShortlist, isSaved } = store;
  const [budget, setBudget] = useState(profile?.budget ?? 25000);
  const [ielts, setIelts] = useState(exams.ieltsOverall ?? profile?.ielts ?? "");
  const [country, setCountry] = useState(profile?.country ?? "undecided");
  const [onlyTarget, setOnlyTarget] = useState(false);
  const [hideOverBudget, setHideOverBudget] = useState(true);
  const [showCounts, setShowCounts] = useState<Record<string, number>>({});

  const unis = useMemo(() => Object.values(uniIndex), [uniIndex]);
  const effectiveProfile = useMemo(
    () => ({
      ...(profile ?? { name: "", level: "bachelor's" as const, country, intake: "", budget }),
      budget,
      country,
    }),
    [profile, budget, country],
  );
  const effectiveExams = useMemo(
    () => ({ ...exams, ieltsOverall: ielts || exams.ieltsOverall }),
    [exams, ielts],
  );

  const result = useMemo(
    () => matchUniversities(unis, effectiveProfile, effectiveExams, { onlyTargetCountry: onlyTarget, hideOverBudget }),
    [unis, effectiveProfile, effectiveExams, onlyTarget, hideOverBudget],
  );

  const hasScores = result.academic != null;
  const dirty =
    budget !== (profile?.budget ?? 25000) ||
    ielts !== (exams.ieltsOverall ?? profile?.ielts ?? "") ||
    country !== (profile?.country ?? "undecided");

  const showMore = (tier: string) =>
    setShowCounts((c) => ({ ...c, [tier]: (c[tier] ?? 8) + 8 }));

  return (
    <div>
      {/* controls */}
      <div className="term">
        <div className="term-bar">
          <span className="h-3 w-3 rounded-full bg-red/80" />
          <span className="h-3 w-3 rounded-full bg-amber/80" />
          <span className="h-3 w-3 rounded-full bg-mint/80" />
          <span className="ml-2 text-xs text-fog">admissionhack --match --v1</span>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="m-budget">budget / year</label>
            <input id="m-budget" type="range" min={0} max={70000} step={1000} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-lime" />
            <p className="text-sm font-bold text-lime">≈ ${budget.toLocaleString()}</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="m-ielts">IELTS overall</label>
            <input id="m-ielts" className={inputCls} placeholder="e.g. 7.0" value={ielts}
              onChange={(e) => setIelts(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="m-country">target country</label>
            <select id="m-country" className={`${inputCls} [&>option]:bg-ink`} value={country}
              onChange={(e) => setCountry(e.target.value)}>
              <option value="undecided">all countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-fog">
              <input type="checkbox" checked={onlyTarget} onChange={(e) => setOnlyTarget(e.target.checked)}
                className="accent-lime" />
              target country only
            </label>
            <label className="flex items-center gap-2 text-xs text-fog">
              <input type="checkbox" checked={hideOverBudget} onChange={(e) => setHideOverBudget(e.target.checked)}
                className="accent-lime" />
              hide unaffordable
            </label>
            {dirty && (
              <button type="button"
                onClick={() => profile && saveProfile({ ...profile, budget, country, ielts: ielts || profile.ielts })}
                className="w-full rounded-lg bg-lime px-3 py-2 text-xs font-bold text-ink">
                save to profile ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* honesty + academics banner */}
      <div className="mt-4 rounded-xl border border-line bg-panel/70 p-4 text-xs leading-relaxed text-dim">
        <span className="text-lime">how this works:</span> heuristic v1 — estimated admit chance from
        each university&apos;s selectivity and QS/ARWU position, adjusted by your academic strength
        ({result.academic != null ? `${Math.round(result.academic * 100)}/100` : "not provided"}),
        budget and English scores. Transparent, not a guarantee — always verify with the university.
        {!hasScores && (
          <>
            {" "}
            <button type="button" onClick={() => onGo("exams")} className="font-bold text-lime hover:underline">
              add your GPA or exam scores →
            </button>{" "}
            for personal chances (currently ranking by selectivity only).
          </>
        )}
      </div>

      <p className="mt-4 text-xs uppercase tracking-widest text-dim">
        <span className="text-lime">{result.dream.length + result.target.length + result.safe.length}</span>{" "}
        universities matched from {unis.length}
      </p>

      {/* results */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const list = result[tier.id];
          const cap = showCounts[tier.id] ?? 8;
          return (
            <div key={tier.id} className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-paper">{tier.icon} {tier.label}</h3>
                <span className="text-xs font-bold text-lime">{list.length}</span>
              </div>
              <p className="mt-1 text-[11px] text-dim">{tier.hint}</p>
              <Stagger className="mt-4 space-y-2" delay={0.05}>
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line2 p-4 text-xs text-fog">none — loosen the filters</p>
                )}
                {list.slice(0, cap).map((c) => {
                  const saved = isSaved(c.uni.slug);
                  return (
                    <MotionItem key={c.uni.slug} className="rounded-xl border border-line bg-ink p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/universities/${c.uni.slug}`} className="group min-w-0">
                          <span className="block truncate text-sm font-bold text-paper group-hover:text-lime">
                            {c.uni.name}
                          </span>
                          <span className="text-[11px] text-dim">
                            {c.uni.countryName}{c.uni.qsRank != null ? ` · QS #${c.uni.qsRank}` : ""}
                          </span>
                        </Link>
                        <span className={`shrink-0 text-lg font-bold ${chanceColor(c.chance)}`}>
                          {Math.round(c.chance * 100)}%
                        </span>
                      </div>
                      {/* why factors */}
                      <div className="mt-2 space-y-1">
                        {c.reasons.map((r, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-fog">
                            <span className={r.ok === true ? "text-lime" : r.ok === false ? "text-red" : "text-dim"}>
                              {r.ok === true ? "✓" : r.ok === false ? "!" : "·"}
                            </span>
                            <span><span className="text-dim">{r.label}:</span> {r.detail}</span>
                          </p>
                        ))}
                      </div>
                      <div className="mt-2.5">
                        {saved ? (
                          <Link href="/dashboard" className="text-[11px] font-bold text-lime">
                            on your list ✓
                          </Link>
                        ) : (
                          <button type="button" onClick={() => toggleShortlist(c.uni.slug)}
                            className="rounded-lg border border-lime/40 bg-lime/10 px-2.5 py-1 text-[11px] font-bold text-lime transition-colors hover:bg-lime/20">
                            + add to {tier.id} list
                          </button>
                        )}
                      </div>
                    </MotionItem>
                  );
                })}
                {list.length > cap && (
                  <button type="button" onClick={() => showMore(tier.id)}
                    className="w-full rounded-xl border border-line2 px-3 py-2 text-[11px] font-bold text-lime hover:border-lime/40">
                    show {Math.min(8, list.length - cap)} more ↓
                  </button>
                )}
              </Stagger>
            </div>
          );
        })}
      </div>
    </div>
  );
}
