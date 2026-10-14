"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/components/dashboard/store";
import { Eyebrow } from "@/components/ui";
import type { Review } from "@/app/api/essay-review/route";

/**
 * Writing coach — the personal statement, and a reader's honest opinion of it.
 *
 * Two halves that belong together: the primer (what an admissions reader is
 * actually doing when they open your essay) and the reviewer, which sends the
 * draft to a model and comes back with specific, quoted, actionable notes.
 *
 * The draft is kept in this browser only. Reviewing sends it to the model
 * provider once, for that request — the UI says so plainly, because an essay is
 * the most personal thing a student puts in here and pretending otherwise would
 * be the wrong kind of quiet.
 */

const KINDS = [
  { id: "personal", label: "Personal statement", hint: "undergraduate · Common App" },
  { id: "sop", label: "Statement of purpose", hint: "graduate · research intent" },
  { id: "supplemental", label: "Supplemental / “why us”", hint: "a specific university" },
  { id: "scholarship", label: "Scholarship essay", hint: "funding application" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

const DRAFT_KEY = "ah.essayDraft";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

const SEVERITY: Record<Review["issues"][number]["severity"], string> = {
  high: "border-red/40 text-red",
  medium: "border-amber/40 text-amber",
  low: "border-line2 text-fog",
};

const ERRORS: Record<string, string> = {
  not_configured: "The reviewer is not switched on for this deployment — no model key is configured.",
  rate_limited: "That is a lot of reviews in a short time. Wait a few minutes and try again.",
  too_short: "The draft is too short to review — paste at least a couple of paragraphs.",
  too_long: "The draft is longer than this reviewer accepts. Trim it, or review it in sections.",
  timeout: "The model took too long to answer. Try again, or review a shorter section.",
  upstream_auth: "The model key was rejected. Whoever runs this deployment needs to check it.",
  upstream_quota:
    "The model account has no credit left, so the reviewer cannot run. This is a billing problem on the deployment's side — nothing is wrong with your draft.",
  upstream_busy: "The model provider is rate-limiting right now. Try again in a minute.",
  upstream_model: "The configured model name is not available on this account.",
  upstream_error: "The model provider returned an error. Try again in a moment.",
  bad_model_output: "The model's answer could not be read. Try again.",
  network: "Could not reach the reviewer. Check your connection and try again.",
  bad_request: "Something went wrong sending the draft. Try again.",
};

export function WritingCoach() {
  const { profile } = useStore();
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<Kind>("personal");
  const [target, setTarget] = useState("");
  const [wordLimit, setWordLimit] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);

  // the draft survives a tab switch; it is the student's work and losing it would be rude
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(saved);
    } catch {
      /* private mode — the draft simply does not persist */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      /* ignore */
    }
  }, [draft]);

  useEffect(() => {
    fetch("/api/essay-review")
      .then((r) => r.json())
      .then((d: { configured?: boolean; model?: string }) => {
        setConfigured(Boolean(d.configured));
        if (d.model) setModel(d.model);
      })
      .catch(() => setConfigured(false));
  }, []);

  const words = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    setReview(null);
    try {
      const res = await fetch("/api/essay-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay: draft,
          kind,
          target,
          level: profile?.level ?? "",
          wordLimit: wordLimit ? Number(wordLimit) : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; review?: Review; error?: string };
      if (!res.ok || !data.ok || !data.review) {
        setError(ERRORS[data.error ?? ""] ?? ERRORS.upstream_error);
      } else {
        setReview(data.review);
        requestAnimationFrame(() =>
          outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } catch {
      setError(ERRORS.network);
    } finally {
      setBusy(false);
    }
  }, [draft, kind, target, wordLimit, profile?.level]);

  const ready = draft.trim().length >= 200 && !busy;

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        The essay is where most applicants lose what they had already won. This tab has two halves: a
        short primer on what a reader is doing when they open your draft, and a reviewer that gives
        you specific, quoted notes on your own writing.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* ── left: the primer, then the draft ───────────────────────────── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-panel/70 p-6">
            <Eyebrow>what the reader is doing</Eyebrow>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-fog">
              <li>
                <span className="font-bold text-paper">They read fast.</span> Minutes, not hours. If
                paragraph one is scenery, they are already deciding.
              </li>
              <li>
                <span className="font-bold text-paper">They are looking for you.</span> The essay is
                the only part of the file that is a person rather than a number — so the test is
                whether you are actually in it.
              </li>
              <li>
                <span className="font-bold text-paper">They distrust big claims.</span> “I am
                passionate about changing the world” says nothing. A specific afternoon says
                everything.
              </li>
              <li>
                <span className="font-bold text-paper">They notice structure.</span> The usual shape
                that works: a concrete moment → what it made you notice → what you did next → what
                that tells them about how you will work at their university.
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-dim">
              Write it badly first and fix it later. A draft you are embarrassed by is worth more
              than a blank page you are proud of.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-panel/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow>your draft</Eyebrow>
              <span className="text-xs text-dim">
                {words} word{words === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim" htmlFor="wc-kind">
                  what it is for
                </label>
                <select
                  id="wc-kind"
                  className={`${inputCls} [&>option]:bg-ink`}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as Kind)}
                >
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label} — {k.hint}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim" htmlFor="wc-limit">
                  word limit (optional)
                </label>
                <input
                  id="wc-limit"
                  className={inputCls}
                  inputMode="numeric"
                  placeholder="e.g. 650"
                  value={wordLimit}
                  onChange={(e) => setWordLimit(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim" htmlFor="wc-target">
                  context (optional)
                </label>
                <input
                  id="wc-target"
                  className={inputCls}
                  placeholder="e.g. UK, MSc Computer Science · or a named university"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
            </div>

            <textarea
              className={`${inputCls} mt-3 font-mono leading-relaxed`}
              rows={14}
              placeholder="Paste your draft here. Nothing is sent until you ask for a review…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!ready}
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-30"
              >
                {busy ? "reading…" : "review my draft"}
              </button>
              {draft.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    setReview(null);
                    setError(null);
                  }}
                  className="link-quiet text-xs font-bold text-dim hover:text-red"
                >
                  clear
                </button>
              )}
              {configured === false && (
                <span className="text-xs text-amber">reviewer not configured on this deployment</span>
              )}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-dim">
              Your draft is stored in this browser. When you ask for a review it is sent once to the
              model provider{model ? ` (${model})` : ""} to produce the notes, and is not kept by this
              app. It is a reader's opinion, not a decision — and not a guarantee.
            </p>

            {error && (
              <p className="mt-3 rounded-lg border border-amber/40 bg-amber/5 px-3.5 py-2.5 text-xs leading-relaxed text-amber">
                {error}
              </p>
            )}
          </section>
        </div>

        {/* ── right: the review ──────────────────────────────────────────── */}
        <div ref={outRef}>
          {!review && !busy && (
            <div className="rounded-2xl border border-dashed border-line2 p-8">
              <Eyebrow>feedback</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                {configured === false
                  ? "The reviewer needs a model key on the server before it can read anything. The primer on the left works regardless."
                  : "Paste a draft and ask for a review. You will get an honest read, the specific lines that are working against you, and what to do next — with the draft's own words quoted back."}
              </p>
            </div>
          )}

          {busy && (
            <div className="rounded-2xl border border-line bg-panel/70 p-8 text-sm text-fog">
              <span className="anim-blink text-lime">▌</span> reading your draft…
            </div>
          )}

          {review && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
                <Eyebrow>the read</Eyebrow>
                <p className="mt-3 text-sm leading-relaxed text-paper">{review.read}</p>
              </section>

              {review.strengths.length > 0 && (
                <section className="rounded-2xl border border-line bg-panel/70 p-6">
                  <Eyebrow>what is working</Eyebrow>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fog">
                    {review.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="text-mint">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {review.issues.length > 0 && (
                <section className="rounded-2xl border border-line bg-panel/70 p-6">
                  <Eyebrow>what to fix</Eyebrow>
                  <ul className="mt-3 space-y-4">
                    {review.issues.map((it, i) => (
                      <li key={i} className="border-l-2 pl-3.5" style={{ borderColor: "transparent" }}>
                        <p className="flex flex-wrap items-center gap-2">
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY[it.severity]}`}>
                            {it.severity}
                          </span>
                          <span className="text-sm font-bold text-paper">{it.title}</span>
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-fog">{it.detail}</p>
                        {it.fix && (
                          <p className="mt-1.5 text-sm leading-relaxed text-lime">
                            <span className="font-bold">fix · </span>
                            {it.fix}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {review.lineNotes.length > 0 && (
                <section className="rounded-2xl border border-line bg-panel/70 p-6">
                  <Eyebrow>on specific lines</Eyebrow>
                  <ul className="mt-3 space-y-3">
                    {review.lineNotes.map((l, i) => (
                      <li key={i}>
                        <p className="border-l-2 border-line2 pl-3 text-sm italic text-paper/80">“{l.quote}”</p>
                        <p className="mt-1 pl-3 text-sm leading-relaxed text-fog">{l.note}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {review.nextSteps.length > 0 && (
                <section className="rounded-2xl border border-line bg-panel/70 p-6">
                  <Eyebrow>next steps</Eyebrow>
                  <ol className="mt-3 space-y-2 text-sm leading-relaxed text-fog">
                    {review.nextSteps.map((s, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="font-bold text-lime">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <p className="text-[11px] leading-relaxed text-dim">
                Generated by {model ?? "a language model"} from your draft alone. It can be wrong; it
                has not read your file, your grades, or the rest of your application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
