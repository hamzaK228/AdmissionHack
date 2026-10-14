"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, type Profile, type PortfolioEntry, type PortfolioKind, type Tier } from "@/components/dashboard/store";
import { MatchTab } from "@/components/dashboard/match-tab";
import { CollegeList } from "@/components/dashboard/college-list";
import { RoadmapTab } from "@/components/dashboard/roadmap-tab";
import { ScoreReportUpload } from "@/components/dashboard/score-report-upload";
import { CloudSync } from "@/components/dashboard/cloud-sync";
import { PracticeHistory } from "@/components/practice/practice-history";
import { AuthPanel } from "@/components/account/auth-panel";
import { CounselorView } from "@/components/account/counselor-view";
import { OfferComparison } from "@/components/dashboard/offer-comparison";
import { WritingCoach } from "@/components/dashboard/writing-coach";
import { downloadIcs } from "@/lib/calendar-export";
import { motion, AnimatePresence } from "motion/react";
import { CountUp } from "@/components/motion/count-up";
import type { SlimUni } from "@/lib/match-engine";
import { DocumentFolders } from "@/components/dashboard/document-folders";
import { countries } from "@/data/countries";
import { Eyebrow } from "@/components/ui";

const DOCS = [
  { id: "passport", label: "Passport (valid 6+ months beyond enrollment)" },
  { id: "transcripts", label: "Official school transcripts (sealed)" },
  { id: "diploma", label: "Diploma / completion certificate" },
  { id: "translations", label: "Sworn/notarized translations" },
  { id: "english", label: "English test certificate (IELTS/TOEFL/DET)" },
  { id: "lor", label: "Recommendation letters ×2–3 (requested early!)" },
  { id: "sop", label: "Personal statement / motivation letter draft" },
  { id: "cv", label: "CV (academic format)" },
  { id: "financial", label: "Financial proof documents (bank/GIC/blocked account)" },
  { id: "aps", label: "APS / equivalency certificate (DE·CN·IN·AE if applicable)" },
];

const DEMO_DEADLINES = [
  { title: "IELTS exam date", date: "2027-01-16" },
  { title: "UCAS equal-consideration deadline", date: "2027-01-14" },
  { title: "TU Delft application closes", date: "2027-02-01" },
  { title: "Send transcripts to shortlist", date: "2026-12-10" },
];

const PORTFOLIO_KINDS: { id: PortfolioKind; label: string }[] = [
  { id: "activity", label: "Extracurricular activity" },
  { id: "award", label: "Award / honor" },
  { id: "work", label: "Work / internship" },
  { id: "volunteering", label: "Volunteering" },
];

const TIERS: { id: Tier; label: string; icon: string; hint: string }[] = [
  { id: "dream", label: "Dream", icon: "🏆", hint: "ambitious reaches" },
  { id: "target", label: "Target", icon: "🎯", hint: "realistic matches" },
  { id: "safe", label: "Safe", icon: "🛡️", hint: "very likely admits" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";

function daysUntil(date: string): number {
  const diff = new Date(date + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function deadlineTone(days: number): string {
  if (days < 0) return "border-line bg-panel/40 text-dim";
  if (days <= 30) return "border-red/40 bg-red/[0.07]";
  if (days <= 90) return "border-amber/40 bg-amber/[0.06]";
  return "border-line bg-panel/70";
}

/* ── Profile wizard ──────────────────────────────────────── */
function ProfileWizard({
  initial,
  onDone,
  onCancel,
}: {
  initial: Profile | null;
  onDone: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Profile>(
    initial ?? { name: "", level: "bachelor's", country: "undecided", intake: "Fall 2027", budget: 25000 },
  );
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="term mx-auto w-full max-w-2xl">
      <div className="term-bar">
        <span className="h-3 w-3 rounded-full bg-red/80" />
        <span className="h-3 w-3 rounded-full bg-amber/80" />
        <span className="h-3 w-3 rounded-full bg-mint/80" />
        <span className="ml-2 text-xs text-fog">admissionhack --setup {step}/3</span>
      </div>
      <div className="space-y-5 px-5 py-6 sm:px-7">
        {step === 1 && (
          <>
            <p className="text-sm text-fog">
              <span className="text-lime">&gt;</span> who are you, and what level are you applying for?
            </p>
            <div>
              <label className={labelCls} htmlFor="wiz-name">your name</label>
              <input id="wiz-name" className={inputCls} value={form.name} placeholder="e.g. Aisultan"
                onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <span className={labelCls}>level</span>
              <div className="flex gap-2">
                {(["bachelor's", "master's"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => set("level", l)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                      form.level === l ? "border-lime/60 bg-lime/10 text-lime" : "border-line bg-ink text-fog hover:border-lime/30"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p className="text-sm text-fog">
              <span className="text-lime">&gt;</span> where and when do you want to start?
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="wiz-country">target country</label>
                <select id="wiz-country" className={`${inputCls} [&>option]:bg-ink`} value={form.country}
                  onChange={(e) => set("country", e.target.value)}>
                  <option value="undecided">undecided</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="wiz-intake">intake</label>
                <select id="wiz-intake" className={`${inputCls} [&>option]:bg-ink`} value={form.intake}
                  onChange={(e) => set("intake", e.target.value)}>
                  {["Fall 2026", "Spring 2027", "Fall 2027", "Fall 2028"].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p className="text-sm text-fog">
              <span className="text-lime">&gt;</span> budget and current scores — used to match universities
            </p>
            <div>
              <label className={labelCls} htmlFor="wiz-budget">budget — tuition per year (USD)</label>
              <input id="wiz-budget" type="range" min={0} max={70000} step={1000} value={form.budget}
                onChange={(e) => set("budget", Number(e.target.value))} className="w-full accent-lime" />
              <p className="mt-1 text-sm font-bold text-lime">
                ≈ ${form.budget.toLocaleString()} / year
                {form.budget === 0 && <span className="ml-2 text-xs text-fog">(free options only)</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([["ielts", "IELTS"], ["toefl", "TOEFL"], ["sat", "SAT"], ["gpa", "GPA"]] as const).map(([k, label]) => (
                <div key={k}>
                  <label className={labelCls} htmlFor={`wiz-${k}`}>{label}</label>
                  <input id={`wiz-${k}`} className={inputCls} placeholder="—" value={form[k] ?? ""}
                    onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-dim">
              stored privately in your browser (localStorage) — no account, no server, no tracking.
            </p>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-lime" : "bg-line"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel}
                className="rounded-lg border border-line bg-ink px-4 py-2.5 text-sm text-fog hover:text-paper">
                cancel
              </button>
            )}
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-line bg-ink px-4 py-2.5 text-sm font-bold text-fog hover:text-paper">
                ← back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)}
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink">
                next →
              </button>
            ) : (
              <button type="button" onClick={() => onDone(form)}
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink">
                save profile ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Documents tab now lives in document-folders.tsx ─────── */

/* ── Exams tab ───────────────────────────────────────────── */
function ExamsTab({ ieltsMinimums }: { ieltsMinimums: { destination: string; scores: string }[] }) {
  const { exams, saveExams } = useStore();
  const [form, setForm] = useState(exams);
  useEffect(() => setForm(exams), [exams]);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const overall = parseFloat(form.ieltsOverall ?? "");
  const meets = ieltsMinimums.filter((m) => {
    const low = parseFloat(m.scores);
    return Number.isFinite(overall) && Number.isFinite(low) && overall >= low;
  });
  const satTotal =
    parseInt(form.satEbrw ?? "", 10) + parseInt(form.satMath ?? "", 10);

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        Record your official results once — they appear across your workspace and show which
        destinations you already qualify for.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form
          onSubmit={(e) => { e.preventDefault(); saveExams(form); }}
          className="space-y-5 rounded-2xl border border-line bg-panel/70 p-6"
        >
          <div>
            <Eyebrow>IELTS</Eyebrow>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {([["ieltsOverall", "overall"], ["ieltsL", "L"], ["ieltsR", "R"], ["ieltsW", "W"], ["ieltsS", "S"]] as const).map(([k, l]) => (
                <div key={k}>
                  <label className={labelCls} htmlFor={`ex-${k}`}>{l}</label>
                  <input id={`ex-${k}`} className={inputCls} placeholder="0–9" value={form[k] ?? ""}
                    onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={labelCls} htmlFor="ex-toefl">TOEFL</label>
              <input id="ex-toefl" className={inputCls} placeholder="0–120" value={form.toefl ?? ""}
                onChange={(e) => set("toefl", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-satE">SAT EBRW</label>
              <input id="ex-satE" className={inputCls} placeholder="200–800" value={form.satEbrw ?? ""}
                onChange={(e) => set("satEbrw", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-satM">SAT Math</label>
              <input id="ex-satM" className={inputCls} placeholder="200–800" value={form.satMath ?? ""}
                onChange={(e) => set("satMath", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-gpa">GPA</label>
              <div className="flex gap-1.5">
                <input id="ex-gpa" className={inputCls} placeholder="e.g. 3.8" value={form.gpa ?? ""}
                  onChange={(e) => set("gpa", e.target.value)} />
                <select aria-label="GPA scale" className={`${inputCls} w-20 [&>option]:bg-ink`}
                  value={form.gpaScale ?? "4"} onChange={(e) => set("gpaScale", e.target.value)}>
                  {["4", "5", "10", "100"].map((s) => (
                    <option key={s} value={s}>/{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button type="submit" className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow">
            save results ✓
          </button>
        </form>

        <div className="space-y-4">
          <ScoreReportUpload examId="ielts" examName="IELTS" />
          <ScoreReportUpload examId="toefl" examName="TOEFL" />
          <ScoreReportUpload examId="sat" examName="SAT" />

          {overall > 0 && (
            <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-5">
              <Eyebrow>ielts {overall.toFixed(1)} — destination check</Eyebrow>
              <ul className="mt-3 space-y-1.5 text-sm">
                {ieltsMinimums.map((m) => {
                  const low = parseFloat(m.scores);
                  const ok = Number.isFinite(low) && overall >= low;
                  return (
                    <li key={m.destination} className="flex items-center justify-between gap-2 text-fog">
                      <span>{m.destination}</span>
                      <span className={ok ? "font-bold text-lime" : "text-dim"}>
                        {ok ? "meets ✓" : `needs ${m.scores}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {Number.isFinite(satTotal) && satTotal >= 400 && satTotal <= 1600 && (
            <div className="rounded-2xl border border-line bg-panel/70 p-5">
              <Eyebrow>SAT total</Eyebrow>
              <p className="mt-2 text-2xl font-bold text-lime">{satTotal}<span className="text-sm text-dim"> / 1600</span></p>
            </div>
          )}
        </div>
      </div>

      <PracticeHistory />
    </div>
  );
}

/* ── Portfolio tab ───────────────────────────────────────── */
function PortfolioTab() {
  const { portfolio, addPortfolio, removePortfolio } = useStore();
  const [form, setForm] = useState<Omit<PortfolioEntry, "id">>({
    kind: "activity", title: "", org: "", description: "", years: "", hours: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        Build your Common App-style portfolio: activities, awards, work and volunteering. Write it
        once here — reuse it in every application and essay.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          addPortfolio(form);
          setForm({ kind: "activity", title: "", org: "", description: "", years: "", hours: "" });
        }}
        className="mt-6 space-y-4 rounded-2xl border border-line bg-panel/70 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="pf-kind">type</label>
            <select id="pf-kind" className={`${inputCls} [&>option]:bg-ink`} value={form.kind}
              onChange={(e) => set("kind", e.target.value as PortfolioKind)}>
              {PORTFOLIO_KINDS.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-title">position / title *</label>
            <input id="pf-title" className={inputCls} placeholder="e.g. Debate club president" value={form.title}
              onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-org">organization / school</label>
            <input id="pf-org" className={inputCls} placeholder="e.g. NIS Astana" value={form.org}
              onChange={(e) => set("org", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="pf-years">years active</label>
              <input id="pf-years" className={inputCls} placeholder="2023–2026" value={form.years}
                onChange={(e) => set("years", e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-hours">hours / week</label>
              <input id="pf-hours" className={inputCls} placeholder="6" value={form.hours}
                onChange={(e) => set("hours", e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-desc">what did you do? (describe like in Common App)</label>
          <textarea id="pf-desc" rows={3} className={inputCls} value={form.description}
            placeholder="Organized 12 regional tournaments, led a team of 15, grew membership by 40%…"
            onChange={(e) => set("description", e.target.value)} />
        </div>
        <button type="submit" className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink">
          + add to portfolio
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {portfolio.length === 0 && (
          <p className="rounded-xl border border-dashed border-line2 p-6 text-sm text-fog">
            no entries yet — admissions officers love depth over breadth: 6–10 meaningful activities
            beat 25 shallow ones.
          </p>
        )}
        {portfolio.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-panel/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-paper">
                  <span className="mr-2 rounded border border-lime/30 bg-lime/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime">
                    {p.kind}
                  </span>
                  {p.title}
                </p>
                <p className="mt-0.5 text-[11px] text-dim">
                  {[p.org, p.years, p.hours && `${p.hours} hrs/wk`].filter(Boolean).join(" · ")}
                </p>
                {p.description && (
                  <p className="mt-2 text-sm leading-relaxed text-fog">{p.description}</p>
                )}
              </div>
              <button type="button" onClick={() => removePortfolio(p.id)}
                aria-label={`Remove ${p.title}`}
                className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-dim hover:border-red/50 hover:text-red">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Overview tab ────────────────────────────────────────── */
function OverviewTab({ uniIndex, onGo }: { uniIndex: Record<string, SlimUni>; onGo: (tab: string) => void }) {
  const store = useStore();
  const { apps, portfolio, deadlines, checklist, profile } = store;
  const docsDone = DOCS.filter((d) => checklist[d.id]).length;
  const next = deadlines.find((d) => daysUntil(d.date) >= 0);
  const count = (t: Tier) => apps.filter((a) => a.tier === t).length;
  const target = countries.find((c) => c.name === profile?.country);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { v: count("dream"), l: "🏆 dream" },
          { v: count("target"), l: "🎯 target" },
          { v: count("safe"), l: "🛡️ safe" },
          { v: deadlines.length, l: "deadlines" },
          { v: portfolio.length, l: "portfolio" },
          { v: docsDone, l: "docs ready" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-line bg-panel/70 p-4 text-center">
            <p className="text-2xl font-bold text-lime"><CountUp to={s.v} duration={900} /></p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-dim">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <button type="button" onClick={() => onGo("deadlines")} className="rounded-2xl border border-line bg-panel/70 p-5 text-left transition-colors hover:border-lime/40">
          <Eyebrow>next deadline</Eyebrow>
          {next ? (
            <>
              <p className="mt-3 text-sm font-bold text-paper">{next.title}</p>
              <p className="mt-1 text-sm text-lime">
                {daysUntil(next.date)} days ·{" "}
                {new Date(next.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-fog">nothing tracked — add exam and application dates</p>
          )}
        </button>

        {target ? (
          <Link href={`/countries/${target.slug}`} className="rounded-2xl border border-line bg-panel/70 p-5 transition-colors hover:border-lime/40">
            <Eyebrow>target country</Eyebrow>
            <p className="mt-3 text-sm font-bold text-paper">
              {target.flag} {target.name}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dim">{target.englishRequirement}</p>
            <p className="mt-2 text-xs font-bold text-lime">open guide →</p>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-line2 p-5">
            <Eyebrow>target country</Eyebrow>
            <p className="mt-3 text-sm text-fog">undecided — explore the country guides</p>
          </div>
        )}

        <button type="button" onClick={() => onGo("documents")} className="rounded-2xl border border-line bg-panel/70 p-5 text-left transition-colors hover:border-lime/40">
          <Eyebrow>documents</Eyebrow>
          <p className="mt-3 text-sm font-bold text-paper">{docsDone} of {DOCS.length} requirements ready</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${(docsDone / DOCS.length) * 100}%` }} />
          </div>
        </button>
      </div>

      {apps.length === 0 && (
        <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
          <Eyebrow>start here</Eyebrow>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Browse the directory and hit <span className="font-bold text-lime">+</span> on universities
            you like — they land here as <span className="text-amber">Target</span>. Then move your
            favorites into <span className="text-amber">Dream</span> and make sure you have at least
            two <span className="text-mint">Safe</span> choices.
          </p>
          <Link href="/universities" className="mt-4 inline-block rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink">
            browse universities →
          </Link>
        </div>
      )}

      {/* recent deadlines mini */}
      {deadlines.length > 0 && (
        <div>
          <Eyebrow>deadline radar</Eyebrow>
          <div className="mt-4 space-y-2">
            {deadlines.filter((d) => daysUntil(d.date) >= 0).slice(0, 4).map((d) => (
              <div key={d.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${deadlineTone(daysUntil(d.date))}`}>
                <span className="truncate text-sm font-bold text-paper">{d.title}</span>
                <span className={`shrink-0 text-xs font-bold ${daysUntil(d.date) <= 30 ? "text-red" : "text-lime"}`}>
                  {daysUntil(d.date)}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Dashboard shell ─────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "overview" },
  { id: "match", label: "match ⚡" },
  { id: "universities", label: "universities" },
  { id: "deadlines", label: "deadlines" },
  { id: "roadmap", label: "timeline ⏱" },
  { id: "offers", label: "decisions 🎓" },
  { id: "documents", label: "documents" },
  { id: "exams", label: "exams" },
  { id: "portfolio", label: "portfolio" },
  { id: "writing", label: "writing ✍" },
  { id: "who", label: "account" },
  { id: "counselor", label: "counselor" },
  { id: "profile", label: "profile" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function DashboardClient({
  uniIndex,
  ieltsMinimums,
}: {
  uniIndex: Record<string, SlimUni>;
  ieltsMinimums: { destination: string; scores: string }[];
}) {
  const store = useStore();
  const { ready, profile, deadlines, checklist, apps, portfolio } = store;
  const [tab, setTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const [dlTitle, setDlTitle] = useState("");
  const [dlDate, setDlDate] = useState("");

  const docsDone = DOCS.filter((d) => checklist[d.id]).length;
  const nextDeadline = deadlines.find((d) => daysUntil(d.date) >= 0);
  const urgent = deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 30).length;

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-dim">
        <span className="anim-blink text-lime">▌</span> loading workspace…
      </div>
    );
  }

  if (!profile && !editing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Eyebrow>personal workspace · no account needed</Eyebrow>
        <h1 className="headline-gradient mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Your admission command center.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
          Tiered university lists (dream · target · safe), a private document vault, exam results,
          a Common App-style portfolio and deadline countdowns — stored in your browser. Setup takes
          30 seconds.
        </p>
        <div className="mt-10">
          <ProfileWizard initial={null} onDone={store.saveProfile} />
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <ProfileWizard
          initial={profile}
          onDone={(p) => { store.saveProfile(p); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>personal workspace</Eyebrow>
          <h1 className="headline-gradient mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-lime/60">&gt;</span> whoami
          </h1>
          <p className="mt-2 text-lg font-bold text-paper">
            {profile!.name || "applicant"}{" "}
            <span className="text-sm font-normal text-fog">
              · {profile!.level} · {profile!.country} · {profile!.intake}
            </span>
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)}
          className="rounded-lg border border-line bg-panel px-4 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/40 hover:text-lime">
          edit profile
        </button>
      </div>

      {/* tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? "border-b-2 border-lime bg-lime/[0.06] font-bold text-lime"
                : "text-fog hover:text-paper"
            }`}>
            {t.label}
            {t.id === "universities" && apps.length > 0 && (
              <span className="ml-1.5 rounded-full bg-lime px-1.5 text-[10px] font-bold text-ink">{apps.length}</span>
            )}
            {t.id === "portfolio" && portfolio.length > 0 && (
              <span className="ml-1.5 rounded-full bg-lime px-1.5 text-[10px] font-bold text-ink">{portfolio.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
        {tab === "overview" && <OverviewTab uniIndex={uniIndex} onGo={(t) => setTab(t as TabId)} />}
        {tab === "match" && <MatchTab uniIndex={uniIndex} onGo={(t) => setTab(t as TabId)} />}
        {tab === "universities" && <CollegeList uniIndex={uniIndex} />}
        {tab === "roadmap" && <RoadmapTab onGo={(t) => setTab(t as TabId)} />}
        {tab === "offers" && <OfferComparison uniIndex={uniIndex} />}
        {tab === "deadlines" && (
          <div className="max-w-3xl">
            {nextDeadline && (
              <p className="text-sm text-fog">
                next: <span className="font-bold text-paper">{nextDeadline.title}</span> in{" "}
                <span className="font-bold text-lime">{daysUntil(nextDeadline.date)} days</span>
              </p>
            )}
            <div className="mt-4 space-y-2">
              {deadlines.length === 0 && (
                <p className="rounded-xl border border-dashed border-line2 p-6 text-sm text-fog">
                  no deadlines yet — add exam dates, application closes, visa appointments…
                </p>
              )}
              {deadlines.map((d) => {
                const n = daysUntil(d.date);
                return (
                  <div key={d.id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${deadlineTone(n)}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-paper">{d.title}</p>
                      <p className="text-xs text-dim">
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {" · "}
                        {n < 0 ? "passed" : n === 0 ? "TODAY" : `${n} days left`}
                      </p>
                    </div>
                    <button type="button" onClick={() => store.removeDeadline(d.id)}
                      aria-label={`Remove ${d.title}`}
                      className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-dim transition-colors hover:border-red/50 hover:text-red">
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input className={inputCls} placeholder="deadline title — e.g. UCAS deadline" value={dlTitle}
                onChange={(e) => setDlTitle(e.target.value)} />
              <input type="date" className={`${inputCls} sm:w-40`} value={dlDate} onChange={(e) => setDlDate(e.target.value)} />
              <button type="button" disabled={!dlTitle || !dlDate}
                onClick={() => { store.addDeadline({ title: dlTitle, date: dlDate }); setDlTitle(""); setDlDate(""); }}
                className="rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-ink transition-opacity disabled:opacity-30">
                + add
              </button>
            </div>
            {deadlines.length === 0 && (
              <button type="button"
                onClick={() => DEMO_DEADLINES.forEach((d) => store.addDeadline(d))}
                className="mt-3 text-xs font-bold text-lime/70 hover:text-lime">
                → or load an example plan to see how it works
              </button>
            )}
            {deadlines.length > 0 && (
              <button type="button"
                onClick={() => downloadIcs(deadlines.map((d) => ({ title: d.title, date: d.date })))}
                className="mt-3 text-xs font-bold text-lime/70 hover:text-lime">
                → export to calendar (.ics)
              </button>
            )}
          </div>
        )}
        {tab === "documents" && (
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <DocumentFolders />
            <aside>
              <Eyebrow>application requirements</Eyebrow>
              <p className="mt-3 text-xs leading-relaxed text-dim">
                Two different things live on this tab. The folders on the left are where the{" "}
                <em>files</em> go; this list is the application&rsquo;s own checklist — tick an item
                once it is genuinely ready. Some items are a process rather than a document, like the
                APS certificate, so they have no folder of their own.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime transition-[width] duration-500"
                  style={{ width: `${(docsDone / DOCS.length) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-dim">{docsDone} of {DOCS.length} ready</p>
              <ul className="mt-4 space-y-2">
                {DOCS.map((d) => {
                  const done = !!checklist[d.id];
                  return (
                    <li key={d.id}>
                      <button type="button" onClick={() => store.toggleDoc(d.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-[color,border-color,background-color] ${
                          done ? "border-lime/30 bg-lime/[0.05] text-lime" : "border-line bg-panel/70 text-fog hover:border-line2"
                        }`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                          done ? "border-lime bg-lime/20 text-lime" : "border-line2 text-transparent"
                        }`}>✓</span>
                        <span className={done ? "line-through opacity-70" : ""}>{d.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        )}
        {tab === "exams" && <ExamsTab ieltsMinimums={ieltsMinimums} />}
        {tab === "portfolio" && <PortfolioTab />}
        {tab === "writing" && <WritingCoach />}
        {tab === "who" && (
          <div className="space-y-8">
            <AuthPanel />
            <CloudSync />
          </div>
        )}
        {tab === "counselor" && <CounselorView />}
        {tab === "profile" && (
          <div className="max-w-2xl">
            <ProfileWizard initial={profile} onDone={store.saveProfile} />
            <div className="mt-8 rounded-2xl border border-red/25 bg-red/[0.05] p-5">
              <Eyebrow>danger zone</Eyebrow>
              <p className="mt-2 text-xs leading-relaxed text-fog">
                wipe everything stored in this browser: profile, university lists, deadlines,
                checklist. Files in the vault are separate.
              </p>
              <button type="button"
                onClick={() => {
                  ["ah.profile", "ah.apps", "ah.portfolio", "ah.exams", "ah.deadlines", "ah.checklist", "ah.shortlist", "ah.essayDraft"].forEach((k) =>
                    window.localStorage.removeItem(k),
                  );
                  window.location.reload();
                }}
                className="mt-3 rounded-lg border border-red/40 px-4 py-2 text-xs font-bold text-red transition-colors hover:bg-red/10">
                reset all workspace data
              </button>
            </div>
          </div>
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
