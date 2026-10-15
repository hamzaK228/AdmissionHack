"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useStore, type AppEntry, type Tier } from "@/components/dashboard/store";
import {
  APP_OUTCOMES,
  APP_PHASES,
  isOpen,
  statusOf,
  statusRank,
  statusSpec,
  stepKey,
  stepProgress,
  summarize,
  type AppStatus,
  type StatusTone,
} from "@/lib/applications";
import type { SlimUni } from "@/lib/match-engine";

/**
 * The college list — Dream / Target / Safe, and where each application stands.
 *
 * Two jobs in one place because they share a key: the tier is how the student
 * balances risk, the status is how far the application has got, and both hang
 * off (student, university). Splitting them into two screens would make the
 * student maintain the same list twice.
 *
 * Moving a card between columns is animated with a shared `layoutId`, so the
 * school visibly travels rather than teleporting — the move is the point of the
 * control, and motion makes it land. Under `reducedMotion="user"` it simply
 * arrives.
 */

const TIERS: { id: Tier; label: string; icon: string; want: string; wantMax: number; accent: string; hint: string }[] = [
  { id: "dream", label: "Dream", icon: "🏆", want: "2–3", wantMax: 3, accent: "text-amber", hint: "ambitious reaches" },
  { id: "target", label: "Target", icon: "🎯", want: "3–4", wantMax: 4, accent: "text-lime", hint: "realistic matches" },
  { id: "safe", label: "Safe", icon: "🛡️", want: "2", wantMax: 3, accent: "text-mint", hint: "very likely admits" },
];

/**
 * Status colour, one place, so the card edge, the control and the summary agree —
 * and the counselor's screen imports this same map instead of inventing a second
 * palette for the same seven states.
 */
export const STATUS_TONE: Record<StatusTone, { edge: string; text: string }> = {
  idle: { edge: "border-line", text: "text-dim" },
  work: { edge: "border-lime/40", text: "text-lime" },
  waiting: { edge: "border-amber/40", text: "text-amber" },
  good: { edge: "border-mint/40", text: "text-mint" },
  bad: { edge: "border-red/40", text: "text-red" },
};

const fmt = (iso?: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;

function AppCard({ u, app }: { u: SlimUni; app: AppEntry }) {
  const { setTier, setStatus, removeApp, checklist, toggleDoc } = useStore();
  const status = statusOf(app);
  const spec = statusSpec(status);
  const needsYou = isOpen(status);

  /** the stage the student is in; an outcome implies the application has been sent */
  const phase: AppStatus = APP_PHASES.some((p) => p.id === status) ? status : "submitted";
  const outcome = APP_OUTCOMES.includes(status) ? status : null;
  const { steps, done, total, allDone } = stepProgress(app.slug, status, checklist);

  return (
    <motion.div
      layout
      layoutId={app.slug}
      data-app={app.slug}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={`rounded-xl border bg-ink p-3 ${STATUS_TONE[spec.tone].edge}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/universities/${u.slug}`} className="min-w-0 group">
          <span className="block truncate text-sm font-bold text-paper group-hover:text-lime">{u.name}</span>
          <span className="text-[11px] text-dim">
            {u.countryName}
            {u.qsRank != null ? ` · QS #${u.qsRank}` : ""}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => removeApp(u.slug)}
          aria-label={`Remove ${u.name} from your list`}
          className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-dim transition-colors hover:border-red/50 hover:text-red"
        >
          ✕
        </button>
      </div>

      {/* move between tiers — full words, and the current one is marked */}
      <div className="mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-dim">which list</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {TIERS.map((t) => {
            const here = app.tier === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={here}
                disabled={here}
                onClick={() => setTier(u.slug, t.id)}
                className={`rounded border px-2 py-1 text-[11px] font-bold transition-colors ${
                  here
                    ? "border-lime/50 bg-lime/15 text-lime"
                    : "border-line text-fog hover:border-lime/40 hover:text-lime"
                }`}
              >
                {t.icon} {here ? t.label : `move to ${t.label}`}
              </button>
            );
          })}
        </div>
      </div>

      {/**
       * Where it stands — three stages, not a dropdown of seven states.
       *
       * The statuses are a journey with an outcome at the end, and a `<select>` hid that:
       * you opened it, read seven lowercase words and worked out which one described you.
       * The stages are always visible, the current one is lit, the ones behind you are
       * ticked, and the outcomes appear as their own row only once the application has
       * actually been sent — which is when they become a real question rather than noise.
       */}
      <div className="mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-dim">where it stands</span>
        <div className="mt-1 grid grid-cols-3 gap-1" role="group" aria-label="application stage">
          {APP_PHASES.map((ph) => {
            const here = phase === ph.id && !outcome;
            const passed = statusRank(ph.id) < statusRank(phase);
            const tone = STATUS_TONE[statusSpec(ph.id).tone];
            return (
              <button
                key={ph.id}
                type="button"
                aria-pressed={here}
                title={ph.blurb}
                onClick={() => setStatus(u.slug, ph.id)}
                className={`rounded border px-1.5 py-1.5 text-[11px] font-bold transition-colors ${
                  here
                    ? `${tone.edge} bg-panel ${tone.text}`
                    : passed
                      ? "border-line2 text-fog hover:border-amber/40 hover:text-amber"
                      : "border-line text-dim hover:border-lime/40 hover:text-lime"
                }`}
              >
                {here ? "● " : passed ? "✓ " : ""}
                {ph.label}
              </button>
            );
          })}
        </div>

        {phase === "submitted" && (
          <>
            <span className="mt-2.5 block text-[10px] font-bold uppercase tracking-wider text-dim">
              how it ended
            </span>
            <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label="application outcome">
              {APP_OUTCOMES.map((o) => {
                const sp = statusSpec(o);
                const here = status === o;
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={here}
                    onClick={() => setStatus(u.slug, o)}
                    className={`rounded border px-2 py-1 text-[11px] font-bold transition-colors ${
                      here
                        ? `${STATUS_TONE[sp.tone].edge} bg-panel ${STATUS_TONE[sp.tone].text}`
                        : "border-line text-dim hover:border-lime/40 hover:text-fog"
                    }`}
                  >
                    {sp.short}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className={`mt-2 text-[11px] leading-relaxed ${needsYou ? "text-fog" : "text-dim"}`}>{spec.next}</p>
      </div>

      {/* The steps for this stage — tickable, and counted. */}
      {steps.length > 0 && (
        <div className="mt-3 rounded-lg border border-line bg-panel/60 p-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
              {status === "planning" ? "before you decide" : status === "preparing" ? "what it asks for" : "what is left"}
            </span>
            <span className={`shrink-0 text-[10px] font-bold ${allDone ? "text-mint" : "text-fog"}`}>
              {done}/{total}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {steps.map((st) => {
              const checked = Boolean(checklist[stepKey(app.slug, st.id)]);
              return (
                <li key={st.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDoc(stepKey(app.slug, st.id))}
                      style={{ accentColor: "#c9ff4a" }}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer"
                    />
                    <span className={checked ? "text-dim line-through" : "text-fog"}>{st.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {allDone && phase === "preparing" && (
            <p className="mt-2 text-[11px] leading-relaxed text-mint">
              every step is ticked — move it to <span className="font-bold">sent</span> when it is actually in.
            </p>
          )}
        </div>
      )}

      {u.tuitionMax != null && (
        <p className="mt-2 text-[11px] text-dim">
          ≈ ${u.tuitionMin != null ? `${Math.round(u.tuitionMin / 1000)}k` : "—"} –{" "}
          {Math.round(u.tuitionMax / 1000)}k / yr · {u.countryName}
        </p>
      )}

      {(app.submittedOn || app.decidedOn) && (
        <p className="mt-2 text-[11px] text-dim">
          {app.submittedOn && <>submitted {fmt(app.submittedOn)}</>}
          {app.submittedOn && app.decidedOn && " · "}
          {app.decidedOn && <>decided {fmt(app.decidedOn)}</>}
        </p>
      )}
    </motion.div>
  );
}

export function CollegeList({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { apps } = useStore();
  const byTier = (t: Tier) =>
    apps
      .filter((a) => a.tier === t)
      .map((a) => ({ app: a, uni: uniIndex[a.slug] }))
      .filter((x) => Boolean(x.uni));

  const sum = summarize(apps);

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        Aim for 2–3 <span className="text-amber">dream</span>, 3–4 <span className="text-lime">target</span> and 2{" "}
        <span className="text-mint">safe</span> — the counts above each column say where you stand.{" "}
        <span className="text-lime">move to…</span> shifts a school between columns, and the dropdown tracks the
        application itself.
      </p>

      {sum.total > 0 && (
        <p className="mt-3 text-xs text-dim">
          {sum.total} on your list
          {sum.open > 0 && <> · <span className="text-fog">{sum.open} still need you</span></>}
          {sum.submitted > 0 && <> · {sum.submitted} submitted</>}
          {sum.offers > 0 && <> · <span className="text-mint">{sum.offers} offer{sum.offers === 1 ? "" : "s"}</span></>}
          {sum.enrolled > 0 && <> · {sum.enrolled} enrolled</>}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const list = byTier(tier.id);
          const over = list.length > tier.wantMax;
          return (
            <div key={tier.id} className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-paper">
                  {tier.icon} {tier.label}
                </h3>
                <span className={`text-xs font-bold ${over ? "text-amber" : "text-lime"}`}>
                  {list.length}
                  <span className="text-dim"> / {tier.want}</span>
                </span>
              </div>
              <p className="mt-1 text-[11px] text-dim">{tier.hint}</p>

              <div className="mt-4 space-y-2">
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line2 p-4 text-xs text-fog">
                    empty — add from the directory, then move it here
                  </p>
                )}
                {list.map(({ app, uni }) => (
                  <AppCard key={app.slug} u={uni} app={app} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/universities"
        className="mt-6 inline-block rounded-xl border border-line2 bg-panel px-4 py-2.5 text-sm font-bold text-lime transition-colors hover:border-lime/50"
      >
        browse 1500+ universities →
      </Link>
    </div>
  );
}
