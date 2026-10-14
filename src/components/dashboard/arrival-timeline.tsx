"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { buildArrival, type ArrivalStatus } from "@/lib/arrival";
import { statusOf } from "@/lib/applications";
import { countries } from "@/data/countries";
import { Eyebrow } from "@/components/ui";
import type { SlimUni } from "@/lib/match-engine";

/**
 * The arrival timeline — what happens after an offer, dated for this student.
 *
 * The admission timeline dates the eight phases up to "decide offers"; this dates
 * the nine-or-so steps after it, from the same anchor (the student's own enrolment
 * month) with the same rule — every date is an offset the curated data states, and
 * nothing is invented. It appears in the decisions tab only once there is an offer
 * or an enrolment, because until then it is not the student's problem yet.
 *
 * The destination's visa facts are the country guide's own words, shown verbatim:
 * the financial-proof figure and the processing time are the two numbers that
 * actually gate an intake, and a paraphrase of them is worse than useless.
 */

const STATUS_STYLE: Record<ArrivalStatus, { chip: string; dot: string; label: string; card: string }> = {
  past: { chip: "text-dim border-line", dot: "bg-line2", label: "behind you", card: "border-line bg-panel/40" },
  now: { chip: "text-lime border-lime/50", dot: "bg-lime ring-4 ring-lime/20", label: "you are here", card: "border-lime/50 bg-panel/70" },
  later: { chip: "text-fog border-line2", dot: "bg-line2", label: "later", card: "border-line bg-panel/70" },
  info: { chip: "text-dim border-line", dot: "bg-line", label: "undated", card: "border-line bg-panel/40" },
};

export function ArrivalTimeline({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { profile, apps, deadlines, addDeadline } = useStore();
  const [added, setAdded] = useState<string[]>([]);

  const arrival = useMemo(() => buildArrival(profile?.intake ?? ""), [profile?.intake]);

  /** The countries this student has actually got somewhere — offers first, then the list. */
  const destinations = useMemo(() => {
    const names = new Set<string>();
    for (const a of apps) {
      const s = statusOf(a);
      if (s === "offer" || s === "enrolled") {
        const u = uniIndex[a.slug];
        if (u) names.add(u.countryName);
      }
    }
    if (names.size === 0 && profile?.country && !/undecided/i.test(profile.country)) names.add(profile.country);
    return [...names].map((n) => countries.find((c) => c.name === n) ?? null).filter(Boolean);
  }, [apps, uniIndex, profile?.country]);

  const tracked = new Set(deadlines.map((d) => d.title));
  const trackable = arrival.steps.filter((s) => s.status !== "past" && s.windowStart);

  const trackAll = () => {
    const written: string[] = [];
    for (const s of trackable) {
      const title = `${s.title} — start`;
      if (tracked.has(title)) continue;
      addDeadline({ title, date: s.windowStart!.slice(0, 10) });
      written.push(s.slug);
    }
    setAdded(written);
  };

  return (
    <section className="mt-14 border-t border-line pt-10">
      <Eyebrow>after the offer</Eyebrow>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
        An offer is not the finish line. The deposit deadline, the financial statement that has to age in
        the account for weeks, and a residence permit whose window starts the day you land — each of these
        can still cost you the year, and none of them are on the application timeline because they happen
        after it.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-dim">{arrival.anchorLabel}</p>
        {arrival.steps[0].windowStart && (
          <>
            <span className="text-dim">·</span>
            <button
              type="button"
              onClick={trackAll}
              className="rounded-lg border border-line2 bg-panel px-3 py-1.5 text-xs font-bold text-lime transition-colors hover:border-lime/50"
            >
              {added.length > 0 ? `${added.length} added ✓` : `track ${trackable.length} dates`}
            </button>
            <Link href="/arrival" className="text-xs font-bold text-lime/80 transition-colors hover:text-lime">
              → the full guide, country by country
            </Link>
          </>
        )}
      </div>

      <ol className="mt-6 space-y-3">
        {arrival.steps.map((s) => {
          const style = STATUS_STYLE[s.status];
          const isCurrent = s.slug === arrival.currentSlug;
          return (
            <li key={s.slug} className={`rounded-2xl border p-5 ${style.card}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                    <span className="font-bold text-paper">
                      <span className="mr-2 font-mono text-xs text-dim">
                        {String(s.order).padStart(2, "0")}
                      </span>
                      {s.title}
                    </span>
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-dim">{s.windowLabel ?? s.timing}</span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}>
                    {isCurrent ? style.label : s.status === "past" ? style.label : s.timing.replace(/ before enrollment/, " to go")}
                  </span>
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-fog">{s.what}</p>
              <p className="mt-2 text-sm leading-relaxed text-dim">{s.why}</p>

              {s.mistakes.length > 0 && s.status !== "past" && (
                <ul className="mt-3 space-y-1">
                  {s.mistakes.map((m, i) => (
                    <li key={i} className="text-xs leading-relaxed text-amber/90">
                      — {m}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {destinations.length > 0 && (
        <div className="mt-8 space-y-4">
          <Eyebrow>your destination, in the guide&rsquo;s own words</Eyebrow>
          {destinations.map((c) =>
            c ? (
              <div key={c.slug} className="rounded-2xl border border-line bg-panel/70 p-6">
                <h3 className="font-bold text-paper">
                  <span className="mr-2">{c.flag}</span>
                  {c.name}
                </h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-ink p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">visa financial proof</dt>
                    <dd className="mt-1.5 text-xs leading-relaxed text-paper">{c.visaFinancialProof}</dd>
                  </div>
                  <div className="rounded-xl border border-line bg-ink p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">visa processing</dt>
                    <dd className="mt-1.5 text-xs leading-relaxed text-paper">{c.visaProcessing}</dd>
                  </div>
                  <div className="rounded-xl border border-line bg-ink p-3 sm:col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">after graduation</dt>
                    <dd className="mt-1.5 text-xs leading-relaxed text-paper">{c.postStudyWork}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-fog">{c.visaNote}</p>
                <Link href={`/countries/${c.slug}`} className="mt-3 inline-block text-xs font-bold text-lime">
                  the full {c.name} guide →
                </Link>
              </div>
            ) : null,
          )}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-dim">
        These windows are typical ranges, not commitments — visa processing in particular lengthens in
        summer. The figures above are the verified ones from our country guides; confirm anything
        time-critical on the official site before you act.
      </p>
    </section>
  );
}
