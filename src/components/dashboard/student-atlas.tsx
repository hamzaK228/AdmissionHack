"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";
import { useReducedMotion } from "motion/react";
import { DeadlineCount } from "@/components/dashboard/deadline-count";
import { Eyebrow } from "@/components/ui";
import { statusOf, statusSpec, summarize, type AppStatus } from "@/lib/applications";

/**
 * One student, drawn.
 *
 * The rest of the dashboard is organised by **task** — here is the list, here are the documents,
 * here are the deadlines — which is right for doing the work and wrong for understanding it. A
 * counselor opening a student, or a parent opening their child, is not doing the work; they are
 * trying to see it whole, and a wall of sections does not do that.
 *
 * So this is the same data as shapes: how the list is balanced across the three tiers, how far
 * each application has got, what the portfolio is made of, which scores exist, how much of the
 * document set is done, what is coming. Proportions first, words second — which is what a person
 * who "understands visually" is actually asking for.
 *
 * It renders from a plain snapshot, so the student's own dashboard and the read-only
 * counselor/parent workspace show the identical picture from one implementation.
 */

export interface AtlasSnapshot {
  name: string;
  /** level · country · intake · budget, already formatted */
  meta: string[];
  apps: { name: string; country: string; tier: string; status: string }[];
  portfolio: { kind: string; title: string }[];
  exams: { id: string; overall: string }[];
  docsDone: number;
  docsTotal: number;
  deadlines: { title: string; date: string }[];
}

const TIER_META: Record<string, { label: string; icon: string; tint: string }> = {
  dream: { label: "Dream", icon: "🏆", tint: "#fbbf24" },
  target: { label: "Target", icon: "🎯", tint: "#c9ff4a" },
  safe: { label: "Safe", icon: "🛡️", tint: "#5eead4" },
};

const KIND_META: Record<string, { label: string; icon: string; tint: string }> = {
  activity: { label: "Activities", icon: "⚡", tint: "#7dd3fc" },
  award: { label: "Awards", icon: "🏅", tint: "#fbbf24" },
  work: { label: "Work", icon: "💼", tint: "#5eead4" },
  volunteering: { label: "Volunteering", icon: "🤝", tint: "#c9ff4a" },
};

const daysAway = (iso: string) =>
  Math.round((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000);

/** A number that counts to its value rather than appearing. */
function Count({ to, className = "" }: { to: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = String(to);
      return;
    }
    const o = { v: 0 };
    const a = animate(o, {
      v: to,
      duration: 720,
      ease: "outQuart",
      onUpdate: () => {
        el.textContent = String(Math.round(o.v));
      },
    });
    return () => {
      a.pause();
    };
  }, [to, reduce]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      0
    </span>
  );
}

function Panel({
  title,
  aside,
  children,
  delay,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  delay: number;
}) {
  return (
    <section
      className="row-in rounded-2xl border border-line bg-panel/70 p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <Eyebrow>{title}</Eyebrow>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StudentAtlas({ snapshot }: { snapshot: AtlasSnapshot }) {
  const { apps, portfolio, exams, docsDone, docsTotal, deadlines } = snapshot;

  const byTier = (t: string) => apps.filter((a) => a.tier === t);
  const statuses: AppStatus[] = apps.map((a) => statusOf({ status: a.status }));
  const sum = summarize(apps.map((a) => ({ slug: a.name, tier: a.tier, status: a.status })));

  // one stacked bar of where every application stands, in lifecycle order
  const ORDER: AppStatus[] = ["planning", "preparing", "submitted", "waitlisted", "offer", "rejected", "enrolled"];
  const stacked = ORDER.map((s) => ({
    status: s,
    spec: statusSpec(s),
    n: statuses.filter((x) => x === s).length,
  })).filter((r) => r.n > 0);

  const kinds = (Object.keys(KIND_META) as string[])
    .map((k) => ({ kind: k, ...KIND_META[k], n: portfolio.filter((p) => p.kind === k).length }))
    .filter((k) => k.n > 0);

  const next = [...deadlines].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const docPct = docsTotal > 0 ? docsDone / docsTotal : 0;

  return (
    <div>
      {/* who this is, and the one sentence that matters about them */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>this student, drawn</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-paper">{snapshot.name || "unnamed applicant"}</h2>
          {snapshot.meta.length > 0 && <p className="mt-1 text-xs text-dim">{snapshot.meta.join(" · ")}</p>}
        </div>
        <p className="text-xs text-fog">
          <Count to={sum.total} className="font-bold text-paper" /> on the list ·{" "}
          <Count to={sum.submitted} className="font-bold text-paper" /> sent ·{" "}
          <Count to={sum.offers} className="font-bold text-mint" /> offer{sum.offers === 1 ? "" : "s"} ·{" "}
          <Count to={sum.open} className="font-bold text-amber" /> still open
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {/* the list, as balance */}
        <Panel
          title="the list, as balance"
          delay={0}
          aside={<span className="text-[11px] font-bold text-dim">{apps.length} universities</span>}
        >
          <div className="space-y-2.5">
            {Object.entries(TIER_META).map(([id, m]) => {
              const list = byTier(id);
              const want = id === "dream" ? 3 : id === "target" ? 4 : 3;
              return (
                <div key={id}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="font-bold" style={{ color: m.tint }}>
                      {m.icon} {m.label}
                    </span>
                    <span className="text-dim">
                      <span className="font-bold text-fog">{list.length}</span> / {want}
                    </span>
                  </div>
                  {/* the bar is the proportion, so the balance is seen before it is read */}
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${Math.min(100, (list.length / want) * 100)}%`, background: m.tint }}
                    />
                  </div>
                  {list.length > 0 && (
                    <p className="mt-1 truncate text-[10px] text-dim">{list.map((a) => a.name).join(" · ")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* every application, as one bar */}
        <Panel
          title="where every application stands"
          delay={60}
          aside={<span className="text-[11px] font-bold text-dim">{apps.length} total</span>}
        >
          {stacked.length === 0 ? (
            <p className="text-xs text-fog">nothing on the list yet.</p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full">
                {stacked.map((r) => (
                  <span
                    key={r.status}
                    title={`${r.n} ${r.spec.short}`}
                    style={{ width: `${(r.n / Math.max(1, apps.length)) * 100}%`, background: r.spec.tone === "good" ? "#5eead4" : r.spec.tone === "work" ? "#c9ff4a" : r.spec.tone === "waiting" ? "#fbbf24" : r.spec.tone === "bad" ? "#f87171" : "#3c5240" }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1">
                {stacked.map((r) => (
                  <li key={r.status} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-fog">{r.spec.short}</span>
                    <span className="font-bold text-paper">{r.n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        {/* the portfolio, as what it is made of */}
        <Panel
          title="what they have done"
          delay={120}
          aside={<span className="text-[11px] font-bold text-dim">{portfolio.length} entries</span>}
        >
          {kinds.length === 0 ? (
            <p className="text-xs text-fog">nothing in the portfolio yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {kinds.map((k) => (
                  <span
                    key={k.kind}
                    className="rounded-lg border px-2 py-1 text-[11px] font-bold"
                    style={{ borderColor: k.tint + "55", color: k.tint }}
                  >
                    {k.icon} {k.label} <Count to={k.n} />
                  </span>
                ))}
              </div>
              <ul className="mt-3 space-y-1">
                {portfolio.slice(0, 4).map((p, i) => (
                  <li key={i} className="truncate text-[11px] text-fog">
                    <span className="text-dim">{KIND_META[p.kind]?.icon ?? "•"}</span> {p.title}
                  </li>
                ))}
                {portfolio.length > 4 && (
                  <li className="text-[10px] text-dim">and {portfolio.length - 4} more</li>
                )}
              </ul>
            </>
          )}
        </Panel>

        {/* scores and paperwork, as two measures */}
        <Panel title="scores and paperwork" delay={180}>
          <div className="flex flex-wrap items-start gap-5">
            <div className="min-w-[120px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-dim">exams</p>
              {exams.length === 0 ? (
                <p className="mt-1.5 text-xs text-fog">none recorded</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {exams.map((e) => (
                    <span key={e.id} className="rounded-lg border border-lime/40 bg-lime/[0.08] px-2 py-1 text-[11px]">
                      <span className="uppercase text-dim">{e.id}</span>{" "}
                      <span className="font-bold text-lime">{e.overall || "—"}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-dim">document set</p>
              <p className="mt-1.5 text-sm font-bold text-paper">
                <Count to={docsDone} /> <span className="text-dim">of {docsTotal}</span>
              </p>
              <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${docPct * 100}%` }} />
              </div>
            </div>
          </div>
        </Panel>

        {/* what is coming */}
        <Panel
          title="what is coming"
          delay={240}
          aside={<span className="text-[11px] font-bold text-dim">{deadlines.length} tracked</span>}
        >
          {next.length === 0 ? (
            <p className="text-xs text-fog">no dates tracked yet.</p>
          ) : (
            <ul className="space-y-2">
              {next.map((d) => {
                const n = daysAway(d.date);
                return (
                  <li key={d.title} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs text-fog">{d.title}</span>
                    <span className={n < 0 ? "text-dim" : n <= 7 ? "text-red" : n <= 30 ? "text-amber" : "text-lime"}>
                      <DeadlineCount days={n} size={34} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* the balance of the whole thing, said in one line */}
        <Panel title="what this adds up to" delay={300}>
          <p className="text-xs leading-relaxed text-fog">
            {sum.total === 0
              ? "No universities on the list yet, so there is nothing to judge the rest against."
              : sum.offers > 0
                ? `${sum.offers} offer${sum.offers === 1 ? "" : "s"} already, with ${sum.open} application${sum.open === 1 ? "" : "s"} still open — the decision work has started.`
                : sum.submitted > 0
                  ? `${sum.submitted} sent and nothing decided yet; ${sum.open} still need work. This is the waiting part.`
                  : `${sum.open} application${sum.open === 1 ? "" : "s"} still to send and nothing decided. The work is all in front of them.`}{" "}
            {docsTotal > 0 && (
              <>
                {docsDone === docsTotal
                  ? "Every document is in."
                  : `${docsTotal - docsDone} document${docsTotal - docsDone === 1 ? "" : "s"} still to gather.`}
              </>
            )}
            {portfolio.length > 0 && ` ${portfolio.length} portfolio entr${portfolio.length === 1 ? "y" : "ies"} to draw on.`}
          </p>
        </Panel>
      </div>
    </div>
  );
}
