import Link from "next/link";
import { journeySteps } from "@/data/journey";
import { universities, countries } from "@/data/all";
import { exams } from "@/data/exams";
import { CtaCard, SectionHeading, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { TerminalHero } from "@/components/terminal-hero";
import { ExamMarquee } from "@/components/exam-marquee";
import { SystemPath } from "@/components/motion/system-path";
import { CountUp } from "@/components/motion/count-up";
import { Starfield } from "@/components/globe/starfield";
import { WelcomeLine } from "@/components/welcome-line";
import { JourneyScroller } from "@/components/journey-scroller";
import { UniversityGlobe } from "@/components/globe/university-globe";

const modules = [
  {
    href: "/universities",
    cmd: "find --universities",
    title: "Choose a university",
    description: "Browse by country, field, tuition and selectivity — with the exams each one accepts.",
    status: "LIVE",
  },
  {
    href: "/how-admission-works",
    cmd: "run --how-it-works",
    title: "Understand the process",
    description: "The full admission journey, decoded into 8 ordered steps with real timing.",
    status: "LIVE",
  },
  {
    href: "/exams",
    cmd: "scan --exams",
    title: "Master the exams",
    description: "Format, cost, dates, validity for SAT, IELTS, TOEFL, CSCA and more. Prep hubs compiling.",
    status: "LIVE",
  },
  {
    href: "/scholarships",
    cmd: "scan --scholarships",
    title: "Find the money",
    description: "22 flagship scholarships with verified windows — from Fulbright and Chevening to MEXT and GKS.",
    status: "LIVE",
  },
  {
    href: "/dashboard",
    cmd: "init --dashboard",
    title: "Your workspace",
    description: "Shortlist universities, track deadlines with countdowns, check off documents — private, no account.",
    status: "LIVE",
  },
  {
    href: "/countries",
    cmd: "map --countries",
    title: "Know the country",
    description: "Portals, costs, deadlines, visa financial proof, post-study work rights and the gotchas.",
    status: "LIVE",
  },
];

const upcoming = [
  { title: "exam prep hubs", desc: "practice questions, mock tests, score tools" },
  { title: "application tracker", desc: "one board for every deadline" },
  { title: "document vault", desc: "upload once, attach everywhere" },
  { title: "ai advisor", desc: "grounded in verified data only" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero: the university planet ── */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="hero-stars"><Starfield className="opacity-70" /></div>
        <div
          aria-hidden
          className="hero-aura pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_38%,rgba(201,255,74,0.10),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20">
          {/* live readout above the planet — renders immediately, never gated on animation */}
          <div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-dim">
              <WelcomeLine />
              <span className="flex items-center gap-2">
                <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
                <span className="text-lime">{universities.length.toLocaleString()}</span> universities
              </span>
              <span className="text-line2">/</span>
              <span>
                <span className="text-lime">{countries.length}</span> countries
              </span>
              <span className="text-line2">/</span>
              <span>
                <span className="text-lime">{exams.length}</span> exams decoded
              </span>
              <span className="text-line2">/</span>
              <span className="text-fog">drag the planet</span>
            </div>
          </div>

          {/* the globe */}
          <div>
            <div className="hero-planet relative mx-auto mt-4 h-[52vh] max-h-[620px] min-h-[340px] w-full sm:h-[60vh]">
              <UniversityGlobe className="h-full w-full" />
              {/* anchor labels like the reference */}
              <div className="pointer-events-none absolute left-2 top-6 hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime/80">
                  ● 184 · united states
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-dim">qs 2027 edition</p>
              </div>
              <div className="pointer-events-none absolute bottom-8 right-2 hidden text-right sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mint/80">
                  1.35°n 103.8°e · singapore
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-dim">asia · 4</p>
              </div>
            </div>
          </div>

          {/* headline — CSS-driven entrance: renders even if rAF is throttled */}
          <div className="hero-copy relative mx-auto mt-2 max-w-4xl text-center">
            <div className="animate-step" style={{ animationDelay: "120ms" }}>
              <h1 className="text-[38px] font-bold leading-[1.04] tracking-tight sm:text-[68px]">
                Every university on Earth.
                <br />
                <span className="headline-gradient">One decision.</span>
              </h1>
            </div>
            <div className="animate-step" style={{ animationDelay: "220ms" }}>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fog">
                {universities.length.toLocaleString()} institutions across {countries.length}{" "}
                countries, ranked with QS 2027 and ARWU 2025 — mapped, matched to your scores and
                budget, and tracked to the deadline.
              </p>
            </div>
            <div className="animate-step" style={{ animationDelay: "320ms" }}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="anim-glow w-full rounded-xl bg-lime px-7 py-3.5 text-center text-sm font-bold text-ink press-grow sm:w-auto"
                >
                  Find my universities →
                </Link>
                <Link
                  href="/universities"
                  className="w-full rounded-xl border border-line2 bg-panel/60 px-7 py-3.5 text-center text-sm font-bold text-paper link-quiet sm:w-auto"
                >
                  Explore the directory
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue with progress */}
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 pb-6 text-[10px] uppercase tracking-[0.24em] text-dim sm:px-6">
          <span className="text-lime">scroll</span>
          <span className="h-px flex-1 bg-gradient-to-r from-lime/60 to-transparent" />
          <span className="text-fog">{journeySteps.length} steps ahead</span>
        </div>
      </section>

      <ExamMarquee />

      <div className="scroll-rule" aria-hidden />
      {/* ── Journey: stepped scroll narrative ── */}
      <JourneyScroller />


      {/* ── manifesto: the reference's statement line, one accented word ── */}
      <section className="relative overflow-hidden border-y border-line px-4 py-28 sm:px-6 sm:py-40">
        <span aria-hidden className="ghost-number left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[26vw]">
          ★
        </span>
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-dim">
              <span className="text-lime/70">[ </span>
              <span className="text-lime">why this exists</span>
              <span className="text-lime/70"> ]</span>
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="mt-8 text-4xl font-bold leading-[1.06] tracking-tight text-paper sm:text-7xl">
              Admission rewards the people
              <br className="hidden sm:block" /> who <span className="text-lime">knew the system</span>.
            </h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-fog">
              Not the richest, not the luckiest — the ones with the information. That advantage
              shouldn&apos;t cost $5,000 and a consultant. So we put it here, free, for every
              applicant on Earth.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/how-admission-works"
                className="anim-glow w-full rounded-xl bg-lime px-7 py-3.5 text-center text-sm font-bold text-ink press-grow sm:w-auto"
              >
                read the system →
              </Link>
              <Link
                href="/dashboard"
                className="w-full rounded-xl border border-line2 bg-panel/60 px-7 py-3.5 text-center text-sm font-bold text-paper transition-colors hover:border-lime/50 hover:text-lime sm:w-auto"
              >
                build my workspace
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Modules: editorial rows, not a card grid ── */}
      <section className="border-b border-line/70 bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="the ecosystem"
              title="Six modules, live today"
              description="Everything below is built and free — the tracker, vault and AI advisor are compiling on top of it."
            />
          </Reveal>
          <ol className="mt-14 border-t border-line">
            {modules.map((m, i) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="group grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-b border-line py-7 transition-colors sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-10"
                >
                  <span className="font-mono text-xs font-bold tabular-nums text-dim">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-paper transition-colors group-hover:text-lime sm:text-2xl">
                      {m.title}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fog">
                      {m.description}
                    </p>
                  </div>
                  <span className="col-start-2 font-mono text-xs text-dim transition-colors group-hover:text-lime sm:col-start-3">
                    $ {m.cmd.replace(/^\$ /, "")} <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Compiling next: a compact strip, not four boxes in a void ── */}
      <section className="border-b border-line/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="roadmap" title="Compiling next" />
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-lime/80">
                <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
                in development
              </p>
            </div>
          </Reveal>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((item) => (
              <li key={item.title} className="bg-ink p-6">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-lime">
                  $ {item.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fog">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
