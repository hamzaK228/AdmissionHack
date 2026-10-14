"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/lib/supabase";
import { statusOf, statusSpec } from "@/lib/applications";
import { buildRoadmap } from "@/lib/roadmap";
import { requirementsFor, gapsIn } from "@/lib/requirements";
import { CHECKLIST } from "@/data/document-checklist";
import { aiError } from "@/lib/ai-errors";
import type { Advice } from "@/app/api/advisor/route";
import { Eyebrow } from "@/components/ui";
import type { SlimUni } from "@/lib/match-engine";

/**
 * The advisor — the one thing the dashboard could not do.
 *
 * Everything needed to answer "what should I do this week" is already in the
 * workspace: the list and its statuses, the checklist, the deadlines, and the app's
 * own assessments from the timeline and the requirement checker. This builds a
 * compact summary of exactly that and asks a model to prioritise it.
 *
 * The snapshot is built here rather than on the server on purpose: the server has no
 * access to an offline-first workspace that may never have been synced, and this way
 * what gets sent is visible in one function — which matters, because it leaves the
 * device.
 */

const days = (iso: string) =>
  Math.ceil((+new Date(iso + "T00:00:00") - Date.now()) / 86_400_000);

function Snapshot({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { profile, exams, apps, checklist, deadlines, portfolio } = useStore();

  return useMemo(() => {
    const lines: string[] = [];
    if (profile) {
      lines.push(
        `Profile: ${profile.name || "(no name)"} · applying at ${profile.level} level · target destination ${
          profile.country || "undecided"
        } · intake ${profile.intake || "unset"} · budget about $${(profile.budget || 0).toLocaleString()}/year`,
      );
    } else {
      lines.push("Profile: not filled in.");
    }

    const scores: string[] = [];
    if (exams.ieltsOverall) scores.push(`IELTS ${exams.ieltsOverall}`);
    if (exams.toefl) scores.push(`TOEFL ${exams.toefl}`);
    const sat = (parseInt(exams.satEbrw ?? "", 10) || 0) + (parseInt(exams.satMath ?? "", 10) || 0);
    if (sat >= 400) scores.push(`SAT ${sat}`);
    const gpa = exams.gpa ?? profile?.gpa;
    if (gpa) scores.push(`GPA ${gpa}${exams.gpaScale ? `/${exams.gpaScale}` : ""}`);
    lines.push(scores.length ? `Scores recorded: ${scores.join(", ")}` : "Scores recorded: none.");

    if (apps.length === 0) {
      lines.push("University list: empty.");
    } else {
      lines.push(`University list (${apps.length}):`);
      for (const a of apps.slice(0, 12)) {
        const u = uniIndex[a.slug];
        const spec = statusSpec(statusOf(a));
        const stamps = [a.submittedOn && `submitted ${a.submittedOn}`, a.decidedOn && `decided ${a.decidedOn}`]
          .filter(Boolean)
          .join(", ");
        lines.push(
          `  - ${u?.name ?? a.slug}${u?.countryName ? ` (${u.countryName})` : ""} · ${a.tier} · ${spec.short}${
            stamps ? ` · ${stamps}` : ""
          }`,
        );
      }
      if (apps.length > 12) lines.push(`  … and ${apps.length - 12} more`);
    }

    const missingDocs = CHECKLIST.filter((c) => !checklist[c.id]).map((c) => c.id);
    lines.push(
      `Documents: ${CHECKLIST.length - missingDocs.length} of ${CHECKLIST.length} ticked.${
        missingDocs.length ? ` Missing: ${missingDocs.join(", ")}.` : ""
      }`,
    );

    if (deadlines.length === 0) {
      lines.push("Deadlines tracked: none.");
    } else {
      const upcoming = [...deadlines]
        .filter((d) => days(d.date) >= 0)
        .sort((a, b) => days(a.date) - days(b.date))
        .slice(0, 5);
      lines.push(
        `Deadlines tracked: ${deadlines.length}. Next: ${
          upcoming.length
            ? upcoming.map((d) => `${d.title} in ${days(d.date)} days (${d.date})`).join("; ")
            : "all are in the past"
        }.`,
      );
    }

    lines.push(`Portfolio entries: ${portfolio.length}.`);

    // the app's own assessments — the part that makes the advice grounded rather
    // than generic, because they are derived from this student's own data
    const roadmap = buildRoadmap({
      intake: profile?.intake ?? "",
      deadlines: deadlines.map((d) => d.date),
      apps: apps.map((a) => ({ slug: a.slug, tier: a.tier })),
      checklist,
      exams,
      level: profile?.level ?? "bachelor's",
      country: profile?.country ?? "",
    });
    const behind = roadmap.phases.filter((p) => p.status === "overdue").map((p) => p.title);
    const open = roadmap.phases.filter((p) => p.status === "active" || p.status === "todo").map((p) => p.title);
    lines.push(
      `Journey phases: ${behind.length ? `BEHIND on ${behind.join(", ")}.` : "nothing overdue."}${
        open.length ? ` Still open: ${open.join(", ")}.` : ""
      }`,
    );

    const reqs = requirementsFor({
      checklist,
      exams,
      apps: apps.map((a) => ({ slug: a.slug, tier: a.tier })),
      uniBySlug: Object.fromEntries(
        Object.entries(uniIndex).map(([slug, u]) => [slug, { name: u.name, countryName: u.countryName }]),
      ),
      level: profile?.level === "master's" ? "master's" : "bachelor's",
    });
    if (reqs.length) {
      lines.push(
        `Per-country requirement gaps: ${reqs
          .map((g) => `${g.countryName} — ${g.items.filter((i) => i.met === false).length} missing`)
          .join("; ")}. Total ${gapsIn(reqs)}.`,
      );
    }

    return lines.join("\n");
  }, [profile, exams, apps, checklist, deadlines, portfolio, uniIndex]);
}

export function Advisor({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const snapshot = Snapshot({ uniIndex });
  const { user } = useAuth();
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const ask = useCallback(async () => {
    setBusy(true);
    setError(null);
    setAdvice(null);
    try {
      const sb = supabase();
      const session = sb ? (await sb.auth.getSession()).data.session : null;
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ snapshot, question }),
      });
      const data = (await res.json()) as { ok?: boolean; advice?: Advice; error?: string; model?: string };
      if (!res.ok || !data.ok || !data.advice) setError(aiError(data.error));
      else {
        setAdvice(data.advice);
        if (data.model) setModel(data.model);
      }
    } catch {
      setError(aiError("network"));
    } finally {
      setBusy(false);
    }
  }, [snapshot, question]);

  return (
    <section className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>what should I do next?</Eyebrow>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Everything you have filled in — your list and its statuses, your documents, your deadlines, and
            where the timeline already says you are behind — read together and turned into an order to do it
            in.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="anim-glow shrink-0 rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
          >
            read my workspace →
          </button>
        )}
      </div>

      {open && (
        <>
          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim" htmlFor="adv-q">
              anything specific? (optional)
            </label>
            <input
              id="adv-q"
              className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60"
              placeholder="e.g. is my list balanced enough, or should I add another safe choice?"
              value={question}
              maxLength={400}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={ask}
              disabled={busy}
              className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
            >
              {busy ? "reading…" : advice ? "ask again" : "advise me"}
            </button>
            {advice && (
              <button
                type="button"
                onClick={() => {
                  setAdvice(null);
                  setOpen(false);
                }}
                className="link-quiet text-xs font-bold text-dim hover:text-fog"
              >
                close
              </button>
            )}
            {!user && (
              <span className="text-xs text-amber">sign in on the account tab — this costs money to run</span>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-dim">
            Your summary — profile, scores, list, documents, deadlines — is sent to the model provider
            {model ? ` (${model})` : ""} to produce this, once, for this request. It is not stored by this
            app. It is advice, not a decision, and it has read your workspace rather than your file.
          </p>

          {error && (
            <p className="mt-3 rounded-lg border border-amber/40 bg-amber/5 px-3.5 py-2.5 text-xs leading-relaxed text-amber">
              {error}
            </p>
          )}

          {busy && <p className="mt-4 text-sm text-fog"><span className="anim-blink text-lime">▌</span> reading your workspace…</p>}
        </>
      )}

      {advice && (
        <div className="mt-6 space-y-4">
          {advice.read && (
            <div className="rounded-xl border border-line bg-ink p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">where you stand</p>
              <p className="mt-2 text-sm leading-relaxed text-paper">{advice.read}</p>
            </div>
          )}

          {advice.priorities.length > 0 && (
            <div className="rounded-xl border border-line bg-ink p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">in this order</p>
              <ol className="mt-3 space-y-4">
                {advice.priorities.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 font-mono text-sm font-bold text-lime">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-paper">{p.action}</span>
                      {p.why && <span className="mt-1 block text-sm leading-relaxed text-fog">{p.why}</span>}
                      {p.by && (
                        <span className="mt-1 block text-[11px] font-bold uppercase tracking-wider text-lime/80">
                          by · {p.by}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {advice.risks.length > 0 && (
            <div className="rounded-xl border border-amber/30 bg-amber/[0.05] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
                what this costs you if you leave it
              </p>
              <ul className="mt-2 space-y-1.5">
                {advice.risks.map((r, i) => (
                  <li key={i} className="text-sm leading-relaxed text-fog">
                    — {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {advice.firstStep && (
            <div className="rounded-xl border border-mint/30 bg-mint/[0.05] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mint">
                start here, in the next hour
              </p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-paper">{advice.firstStep}</p>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-dim">
            Generated by {model ?? "a language model"} from your own workspace. It can be wrong. It is a
            second opinion, not a counsellor — and the{" "}
            <Link href="/arrival" className="font-bold text-lime/80 hover:text-lime">
              timeline
            </Link>{" "}
            and{" "}
            <Link href="/dashboard" className="font-bold text-lime/80 hover:text-lime">
              requirement checker
            </Link>{" "}
            are the parts that are computed rather than estimated.
          </p>
        </div>
      )}
    </section>
  );
}
