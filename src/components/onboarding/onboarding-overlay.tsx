"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStore, type Profile } from "@/components/dashboard/store";
import { countries } from "@/data/countries";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The one authored motion moment of the site: a 30-second path to a personalized workspace. */
export function OnboardingOverlay() {
  const router = useRouter();
  const store = useStore();
  const { ready, onboarded, setOnboarded, saveProfile } = store;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1); // -1 = welcome, 1..4 questions, 0 = finale
  const [country, setCountry] = useState("undecided");
  const [level, setLevel] = useState<Profile["level"]>("bachelor's");
  const [budget, setBudget] = useState(25000);
  const [ielts, setIelts] = useState("");
  const [sat, setSat] = useState("");
  const [gpa, setGpa] = useState("");
  const [typedLines, setTypedLines] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // first visit only: no profile, never onboarded/skipped
  useEffect(() => {
    if (ready && !onboarded && !store.profile) {
      setOpen(true);
      setStep(-1);
    }
  }, [ready, onboarded, store.profile]);

  // focus + scroll lock while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => rootRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const skip = useCallback(() => {
    setOnboarded();
    setOpen(false);
  }, [setOnboarded]);

  // ESC = skip
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, skip]);

  const finish = useCallback(async () => {
    setStep(0); // finale
    setTypedLines(0);
    saveProfile({
      name: "",
      level,
      country,
      intake: "Fall 2027",
      budget,
      ielts: ielts || undefined,
      sat: sat || undefined,
      gpa: gpa || undefined,
    });
    // typed finale, then land on the dashboard
    for (let i = 1; i <= 4; i++) {
      await wait(420);
      setTypedLines(i);
    }
    setOnboarded();
    await wait(650);
    setOpen(false);
    router.push("/dashboard");
  }, [budget, country, gpa, ielts, level, router, saveProfile, sat, setOnboarded]);

  const stepMeta = useMemo(
    () => ({ title: "", n: Math.max(step, 0) }),
    [step],
  );

  if (!open) return null;

  const autoNext = (fn: () => void) => {
    fn();
    setTimeout(() => setStep((s) => s + 1), 260);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome setup"
      className="fixed inset-0 z-[100] overflow-y-auto bg-ink outline-none"
    >
      <div className="aurora" aria-hidden />
      <div className="backdrop-grid" aria-hidden />

      {/* progress + skip */}
      <div className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-4 pt-6 sm:px-6">
        <span className="text-[11px] uppercase tracking-widest text-dim">
          {step > 0 ? `step ${step} / 4` : "welcome"}
        </span>
        <button type="button" onClick={skip}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:border-lime/40 hover:text-lime">
          explore first →
        </button>
      </div>
      <div className="relative z-10 mx-auto mt-3 h-0.5 max-w-3xl px-4 sm:px-6">
        <div className="h-full rounded-full bg-line/60">
          <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime transition-[width] duration-500"
            style={{ width: `${(Math.max(step, 0) / 4) * 100}%` }} />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-120px)] max-w-3xl items-center px-4 pb-16 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
        {step === -1 && (
          <div className="w-full text-center animate-step">
            <p className="text-lime">&gt; AdmissionHack<span className="anim-blink">_</span></p>
            <h1 className="headline-gradient mx-auto mt-5 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Your admission,
              <br />
              decoded.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fog">
              Answer 4 quick questions and we&apos;ll build a university list for you — dream,
              target and safe — before you finish your coffee.
            </p>
            <p className="mt-2 text-xs text-dim">takes ~30 seconds · no account needed</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => setStep(1)}
                className="anim-glow w-full rounded-xl bg-lime px-7 py-3.5 text-sm font-bold text-ink press-grow sm:w-auto">
                start — 30 seconds →
              </button>
              <button type="button" onClick={skip}
                className="w-full rounded-xl border border-line2 bg-panel px-7 py-3.5 text-sm font-bold text-fog transition-colors hover:border-lime/40 hover:text-lime sm:w-auto">
                explore first
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-paper sm:text-4xl">
              Where do you want to <span className="text-lime">study</span>?
            </h2>
            <p className="mt-2 text-sm text-fog">pick one — you can change it anytime</p>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {countries.map((c) => (
                <button key={c.code} type="button" onClick={() => autoNext(() => setCountry(c.name))}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-[color,border-color,background-color] ${
                    country === c.name
                      ? "border-lime/60 bg-lime/10"
                      : "border-line bg-panel/70 card-interactive"
                  }`}>
                  <span className="text-2xl" aria-hidden>{c.flag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-paper">{c.name}</span>
                    <span className="text-[11px] text-dim">
                      ≈ {c.tuitionUsdPerYear.min === 0 && c.tuitionUsdPerYear.max === 0
                        ? "free tuition"
                        : `$${Math.round(c.tuitionUsdPerYear.min / 1000)}k–${Math.round(c.tuitionUsdPerYear.max / 1000)}k/yr`}
                    </span>
                  </span>
                </button>
              ))}
              <button type="button" onClick={() => autoNext(() => setCountry("undecided"))}
                className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-[color,border-color,background-color] ${
                  country === "undecided"
                    ? "border-lime/60 bg-lime/10"
                    : "border-line bg-panel/70 card-interactive"
                }`}>
                <span className="text-2xl" aria-hidden>🌍</span>
                <span>
                  <span className="block text-sm font-bold text-paper">Not sure yet</span>
                  <span className="text-[11px] text-dim">show me everything</span>
                </span>
              </button>
            </div>
            <StepNav onBack={() => setStep(-1)} />
          </div>
        )}

        {step === 2 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-paper sm:text-4xl">
              What&apos;s your <span className="text-lime">mission</span>?
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {([
                { id: "bachelor's", icon: "🎓", title: "Bachelor's", desc: "starting my degree" },
                { id: "master's", icon: "🔬", title: "Master's", desc: "leveling up after my degree" },
              ] as const).map((l) => (
                <button key={l.id} type="button" onClick={() => autoNext(() => setLevel(l.id))}
                  className={`rounded-2xl border p-6 text-left transition-[color,border-color,background-color] ${
                    level === l.id
                      ? "border-lime/60 bg-lime/10"
                      : "border-line bg-panel/70 card-interactive"
                  }`}>
                  <span className="text-3xl" aria-hidden>{l.icon}</span>
                  <p className="mt-3 text-lg font-bold text-paper">{l.title}</p>
                  <p className="text-sm text-fog">{l.desc}</p>
                </button>
              ))}
            </div>
            <StepNav onBack={() => setStep(1)} />
          </div>
        )}

        {step === 3 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-paper sm:text-4xl">
              What&apos;s the <span className="text-lime">budget</span>?
            </h2>
            <p className="mt-2 text-sm text-fog">tuition per year — we&apos;ll show what fits</p>
            <div className="mt-9 rounded-2xl border border-line bg-panel/70 p-6 sm:p-8">
              <p className="text-center text-4xl font-bold text-lime">
                ${budget.toLocaleString()}
                <span className="text-sm font-normal text-dim"> / year</span>
              </p>
              <input type="range" min={0} max={70000} step={1000} value={budget}
                onChange={(e) => setBudget(Number(e.target.value))} className="mt-6 w-full accent-lime" />
              <div className="mt-2 flex justify-between text-[11px] text-dim">
                <span>$0 — free only</span>
                <span>$70k+</span>
              </div>
              <p className="mt-4 text-center text-xs leading-relaxed text-dim">
                {budget === 0
                  ? "no problem — Germany, Italy and full-ride scholarships cover this"
                  : budget < 15000
                    ? "very doable — several destinations fit this range"
                    : "comfortable — most destinations open up"}
              </p>
            </div>
            <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="continue" />
          </div>
        )}

        {step === 4 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-paper sm:text-4xl">
              Scores? <span className="text-fog">(optional)</span>
            </h2>
            <p className="mt-2 text-sm text-fog">
              add what you have — skipped fields never block you
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["ielts", "IELTS", "e.g. 7.0", ielts, setIelts],
                ["sat", "SAT total", "e.g. 1350", sat, setSat],
                ["gpa", "GPA", "e.g. 3.8", gpa, setGpa],
              ] as const).map(([id, label, ph, val, setter]) => (
                <div key={id}>
                  <label htmlFor={`ob-${id}`} className={labelClsOnboarding}>{label}</label>
                  <input id={`ob-${id}`} value={val} placeholder={ph} onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg border border-line bg-panel px-3.5 py-3 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60" />
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={finish}
                className="anim-glow flex-1 rounded-xl bg-lime px-6 py-3.5 text-sm font-bold text-ink press-grow">
                build my workspace →
              </button>
              <button type="button" onClick={finish}
                className="rounded-xl border border-line2 bg-panel px-6 py-3.5 text-sm font-bold text-fog transition-colors hover:border-lime/40 hover:text-lime">
                skip scores
              </button>
            </div>
            <StepNav onBack={() => setStep(3)} />
          </div>
        )}

        {step === 0 && (
          <div className="w-full text-center">
            <div className="term mx-auto w-full max-w-lg text-left">
              <div className="term-bar">
                <span className="h-3 w-3 rounded-full bg-red/80" />
                <span className="h-3 w-3 rounded-full bg-amber/80" />
                <span className="h-3 w-3 rounded-full bg-mint/80" />
                <span className="ml-2 text-xs text-fog">admissionhack --init</span>
              </div>
              <div className="space-y-2.5 px-5 py-6 text-sm">
                {["profile created ✓", `target: ${country === "undecided" ? "open to anything" : country} · ${level} · Fall 2027`,
                  "match engine: universities ranked ✓", "lists ready: 🏆 dream · 🎯 target · 🛡️ safe"].slice(0, typedLines).map((line, i) => (
                  <p key={i} className={line.includes("✓") ? "text-mint" : "text-fog"}>
                    <span className="text-lime">&gt; </span>{line}
                  </p>
                ))}
                <p className="text-fog">
                  <span className="text-lime">&gt; </span>
                  <span className="anim-blink text-lime">▌</span>
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-dim">landing on your dashboard…</p>
          </div>
        )}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const labelClsOnboarding = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";

function StepNav({ onBack, onNext, nextLabel = "next" }: { onBack: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button type="button" onClick={onBack}
        className="text-sm text-dim transition-colors hover:text-lime">
        ← back
      </button>
      {onNext && (
        <button type="button" onClick={onNext}
          className="anim-glow rounded-xl bg-lime px-6 py-3 text-sm font-bold text-ink">
          {nextLabel} →
        </button>
      )}
    </div>
  );
}
