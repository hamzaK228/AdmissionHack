"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { CvDocument, type CvDetails, type CvEducation, type CvEntry, type CvScore } from "@/components/cv/cv-document";
import { Eyebrow } from "@/components/ui";

/**
 * The CV builder.
 *
 * Half of a CV already exists in this workspace — the scores on the exams tab and the
 * activities, awards and work on the portfolio tab — so this page asks only for what
 * is genuinely missing (contact details, education, skills) and assembles the rest.
 * Nothing here duplicates an entry the student has already written: the portfolio's
 * own words are the CV's words.
 *
 * The details are kept in this browser. That is stated on the page rather than
 * implied, because the profile and portfolio *do* sync when signed in, and it would
 * be easy to assume everything does.
 */

const CV_KEY = "ah.cv";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";

const EMPTY_EDU: CvEducation = { school: "", qualification: "", years: "", grade: "" };

const EMPTY: CvDetails = {
  email: "",
  phone: "",
  city: "",
  summary: "",
  education: [{ ...EMPTY_EDU }],
  skills: "",
  languages: "",
};

export default function CvPage() {
  const { profile, exams, portfolio, ready } = useStore();
  const [details, setDetails] = useState<CvDetails>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CvDetails>;
        setDetails({
          ...EMPTY,
          ...parsed,
          education: parsed.education?.length ? parsed.education : [{ ...EMPTY_EDU }],
        });
      }
    } catch {
      /* private mode, or corrupt — start from empty rather than crash */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(CV_KEY, JSON.stringify(details));
    } catch {
      /* ignore */
    }
  }, [details, loaded]);

  const set = <K extends keyof CvDetails>(k: K, v: CvDetails[K]) => setDetails((d) => ({ ...d, [k]: v }));

  const setEdu = (i: number, k: keyof CvEducation, v: string) =>
    setDetails((d) => ({
      ...d,
      education: d.education.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)),
    }));

  const scores: CvScore[] = useMemo(() => {
    const out: CvScore[] = [];
    if (exams.ieltsOverall) out.push({ label: "IELTS", value: exams.ieltsOverall });
    if (exams.toefl) out.push({ label: "TOEFL", value: exams.toefl });
    const sat = (parseInt(exams.satEbrw ?? "", 10) || 0) + (parseInt(exams.satMath ?? "", 10) || 0);
    if (sat >= 400) out.push({ label: "SAT", value: String(sat) });
    const gpa = exams.gpa ?? profile?.gpa;
    if (gpa) out.push({ label: "GPA", value: `${gpa}${exams.gpaScale ? `/${exams.gpaScale}` : ""}` });
    return out;
  }, [exams, profile?.gpa]);

  const entries: CvEntry[] = useMemo(
    () =>
      portfolio.map((p) => ({
        kind: p.kind,
        title: p.title,
        org: p.org,
        years: p.years,
        hours: p.hours,
        description: p.description,
      })),
    [portfolio],
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-dim">
        <span className="anim-blink text-lime">▌</span> loading your workspace…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Eyebrow>your CV</Eyebrow>
          <h1 className="headline-gradient mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A CV built from what you have already written.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Your scores and your portfolio come across automatically — the words here are the words you
            already wrote. Fill in what is missing, then print it or save it as a PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
        >
          print / save as PDF
        </button>
      </div>

      {!profile && (
        <p className="mt-6 rounded-2xl border border-amber/40 bg-amber/5 p-5 text-sm leading-relaxed text-amber print:hidden">
          You have not filled in a profile yet, so the CV will be mostly empty.{" "}
          <Link href="/dashboard" className="font-bold underline">
            Set up your workspace first →
          </Link>
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ── the form: what a CV needs that the workspace does not hold ──── */}
        <div className="space-y-6 print:hidden">
          <section className="rounded-2xl border border-line bg-panel/70 p-5">
            <Eyebrow>contact</Eyebrow>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls} htmlFor="cv-email">email</label>
                <input id="cv-email" className={inputCls} value={details.email}
                  onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelCls} htmlFor="cv-phone">phone</label>
                <input id="cv-phone" className={inputCls} value={details.phone}
                  onChange={(e) => set("phone", e.target.value)} placeholder="+7 ___ ___ ____" />
              </div>
              <div>
                <label className={labelCls} htmlFor="cv-city">city, country</label>
                <input id="cv-city" className={inputCls} value={details.city}
                  onChange={(e) => set("city", e.target.value)} placeholder="Astana, Kazakhstan" />
              </div>
              <div>
                <label className={labelCls} htmlFor="cv-summary">profile — two or three lines about you</label>
                <textarea id="cv-summary" rows={3} className={inputCls} value={details.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder="Final-year school student applying for undergraduate engineering. Interested in how design decisions meet budgets and standards." />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel/70 p-5">
            <Eyebrow>education</Eyebrow>
            <div className="mt-4 space-y-4">
              {details.education.map((e, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-line bg-ink p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
                      {i === 0 ? "most recent" : `entry ${i + 1}`}
                    </span>
                    {details.education.length > 1 && (
                      <button type="button"
                        onClick={() => set("education", details.education.filter((_, idx) => idx !== i))}
                        className="text-[10px] text-dim hover:text-red">
                        remove
                      </button>
                    )}
                  </div>
                  <input className={inputCls} value={e.school} placeholder="School / university"
                    aria-label="School" onChange={(ev) => setEdu(i, "school", ev.target.value)} />
                  <input className={inputCls} value={e.qualification} placeholder="Qualification — e.g. A-Levels, IB, Attestat"
                    aria-label="Qualification" onChange={(ev) => setEdu(i, "qualification", ev.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} value={e.years} placeholder="2023–2026"
                      aria-label="Years" onChange={(ev) => setEdu(i, "years", ev.target.value)} />
                    <input className={inputCls} value={e.grade} placeholder="GPA 3.9"
                      aria-label="Grade" onChange={(ev) => setEdu(i, "grade", ev.target.value)} />
                  </div>
                </div>
              ))}
              <button type="button"
                onClick={() => set("education", [...details.education, { ...EMPTY_EDU }])}
                className="text-xs font-bold text-lime/80 hover:text-lime">
                + add another
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-panel/70 p-5">
            <Eyebrow>skills & languages</Eyebrow>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls} htmlFor="cv-skills">skills — comma separated</label>
                <input id="cv-skills" className={inputCls} value={details.skills}
                  onChange={(e) => set("skills", e.target.value)}
                  placeholder="Python, technical drawing, statistical analysis" />
              </div>
              <div>
                <label className={labelCls} htmlFor="cv-lang">languages — with level</label>
                <input id="cv-lang" className={inputCls} value={details.languages}
                  onChange={(e) => set("languages", e.target.value)}
                  placeholder="Kazakh (native), Russian (native), English (IELTS 7.0)" />
              </div>
            </div>
          </section>

          <p className="text-xs leading-relaxed text-dim">
            These details are kept in this browser only. Your profile, scores and portfolio sync when you
            sign in; this form does not, yet — so print or save before switching device.
          </p>
        </div>

        {/* ── the sheet ─────────────────────────────────────────────────────── */}
        <div>
          <CvDocument
            name={profile?.name ?? ""}
            level={profile?.level ?? "bachelor's"}
            details={details}
            scores={scores}
            entries={entries}
          />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 print:hidden">
        <Link href="/dashboard"
          className="rounded-lg border border-line2 bg-panel px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime">
          ← back to the dashboard
        </Link>
        <Link href="/writing"
          className="rounded-lg border border-line2 bg-panel px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime">
          the Writing School →
        </Link>
      </div>
    </div>
  );
}
