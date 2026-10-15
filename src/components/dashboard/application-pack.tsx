"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { statusOf, statusSpec, stepKey, stepProgress } from "@/lib/applications";
import { DOC_FOLDERS } from "@/data/document-folders";
import { CHECKLIST } from "@/data/document-checklist";

/**
 * The application pack, as paper.
 *
 * The one screen in this product whose whole purpose is to **leave the screen**. A student takes
 * it to a counselor meeting, a parent prints it, a school stamps it into a file. So it is
 * rendered as a white sheet from the start — the same choice the CV builder makes — which means
 * printing needs no colour overrides: what is on the sheet is what comes out of the printer.
 *
 * It carries the parts of the workspace that are decisions rather than work: where every
 * application stands and what is outstanding, the scores, the dates, the document checklist and
 * the portfolio. Deliberately not the essay drafts — those are the student's own writing, and a
 * pack that circulates with them in it is a pack a student stops printing.
 */

interface Slim {
  name: string;
  countryName: string;
  qsRank: number | null;
}

const fmt = (iso?: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : null;

export function ApplicationPack({ index }: { index: Record<string, Slim> }) {
  const { ready, profile, apps, exams, deadlines, checklist, portfolio } = useStore();
  const [includePortfolio, setIncludePortfolio] = useState(true);

  const rows = useMemo(
    () =>
      apps
        .map((a) => ({ app: a, uni: index[a.slug] }))
        .filter((r) => Boolean(r.uni))
        .sort((a, b) => (a.uni.qsRank ?? 9999) - (b.uni.qsRank ?? 9999)),
    [apps, index],
  );

  if (!ready) return <p className="p-10 text-sm text-dim">loading workspace…</p>;

  const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      {/* the toolbar is the only thing on this page that does not print */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard" className="text-sm text-fog transition-colors hover:text-lime">
          ← back to the workspace
        </Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-dim">
            <input
              type="checkbox"
              checked={includePortfolio}
              onChange={(e) => setIncludePortfolio(e.target.checked)}
              style={{ accentColor: "#c9ff4a" }}
            />
            include the portfolio
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-lime px-4 py-2.5 text-xs font-bold text-ink press-grow"
          >
            print / save as PDF
          </button>
        </div>
      </div>

      {/* ── the sheet ── */}
      <article className="pack-sheet bg-white p-10 font-sans text-neutral-900 shadow-xl print:shadow-none">
        <header className="border-b-2 border-neutral-900 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">{profile?.name || "Applicant"}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {[profile?.level, profile?.country ? `applying from ${profile.country}` : null, profile?.intake, profile?.budget ? `budget $${profile.budget.toLocaleString()}/yr` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            AdmissionHack application pack · {today} · {rows.length} universities · {rows.filter((r) => ["submitted", "offer", "waitlisted", "rejected", "enrolled"].includes(statusOf(r.app))).length} sent
          </p>
        </header>

        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">applications</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-1.5 pr-3 font-bold">university</th>
                <th className="py-1.5 pr-3 font-bold">country</th>
                <th className="py-1.5 pr-3 font-bold">rank</th>
                <th className="py-1.5 pr-3 font-bold">list</th>
                <th className="py-1.5 pr-3 font-bold">status</th>
                <th className="py-1.5 font-bold">dates</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ app, uni }) => {
                const st = statusOf(app);
                return (
                  <tr key={app.slug} className="border-b border-neutral-200 align-top">
                    <td className="py-2 pr-3 font-semibold">{uni.name}</td>
                    <td className="py-2 pr-3 text-neutral-600">{uni.countryName}</td>
                    <td className="py-2 pr-3 text-neutral-600">{uni.qsRank != null ? `#${uni.qsRank}` : "—"}</td>
                    <td className="py-2 pr-3 capitalize text-neutral-600">{app.tier}</td>
                    <td className="py-2 pr-3">{statusSpec(st).short}</td>
                    <td className="py-2 text-neutral-600">
                      {[app.submittedOn ? `sent ${fmt(app.submittedOn)}` : null, app.decidedOn ? `decided ${fmt(app.decidedOn)}` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-neutral-500">
                    No universities on the list yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* what is outstanding, per application, in the student's own step wording */}
        <section className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">what is outstanding</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {rows.map(({ app, uni }) => {
              const st = statusOf(app);
              const { steps, done, total } = stepProgress(app.slug, st, checklist);
              const left = steps.filter((s) => !checklist[stepKey(app.slug, s.id)]);
              return (
                <li key={app.slug} className="flex gap-3">
                  <span className="w-52 shrink-0 font-semibold">{uni.name}</span>
                  <span className="text-neutral-600">
                    {total === 0 ? (
                      "—"
                    ) : left.length === 0 ? (
                      `all ${total} steps done`
                    ) : (
                      <>
                        {done}/{total} done · still: {left.map((s) => s.label).join("; ")}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-7 grid grid-cols-2 gap-8">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">scores</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {Object.entries(exams).length === 0 && <li className="text-neutral-500">none recorded</li>}
              {Object.entries(exams).map(([id, v]) => (
                <li key={id} className="flex justify-between gap-3">
                  <span className="uppercase text-neutral-600">{id}</span>
                  <span className="font-semibold">
                    {v.overall || "—"}
                    {v.sections && Object.keys(v.sections).length > 0 && (
                      <span className="ml-2 font-normal text-neutral-500">
                        {Object.entries(v.sections).map(([k, s]) => `${k} ${s}`).join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">dates</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {deadlines.length === 0 && <li className="text-neutral-500">none tracked</li>}
              {[...deadlines]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((d) => (
                  <li key={d.id} className="flex justify-between gap-3">
                    <span className="text-neutral-600">{d.title}</span>
                    <span className="font-semibold">{fmt(d.date)}</span>
                  </li>
                ))}
            </ul>
          </section>
        </div>

        <section className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">documents</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {CHECKLIST.map((c) => (
              <li key={c.id} className="flex items-baseline gap-2">
                <span className={checklist[c.id] ? "text-neutral-900" : "text-neutral-400"}>{checklist[c.id] ? "☑" : "☐"}</span>
                <span className={checklist[c.id] ? "" : "text-neutral-500"}>{c.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            Folders in the vault:{" "}
            {DOC_FOLDERS.map((f) => `${f.icon} ${f.label}`).join(" · ")}
          </p>
        </section>

        {includePortfolio && portfolio.length > 0 && (
          <section className="mt-7 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">portfolio</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {portfolio.map((p) => (
                <li key={p.id}>
                  <span className="mr-2 rounded border border-neutral-300 px-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                    {p.kind}
                  </span>
                  <span className="font-semibold">{p.title}</span>
                  {(p.org || p.years || p.hours) && (
                    <span className="ml-2 text-neutral-500">
                      {[p.org, p.years, p.hours ? `${p.hours} hrs/wk` : null].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {p.description && <p className="mt-0.5 text-neutral-600">{p.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-8 border-t border-neutral-300 pt-3 text-[11px] leading-relaxed text-neutral-500">
          Printed from AdmissionHack. Everything here was entered by the student — verify requirements,
          fees and deadlines on each university&rsquo;s own site before relying on them.
        </footer>
      </article>
    </div>
  );
}
