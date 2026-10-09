import Link from "next/link";
import { journeySteps } from "@/data/journey";
import { universities, countries } from "@/data/all";
import { exams } from "@/data/exams";
import { CtaCard, SectionHeading, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { TerminalHero } from "@/components/terminal-hero";
import { ExamMarquee } from "@/components/exam-marquee";
import { WelcomeStrip } from "@/components/welcome-strip";
import { SystemPath } from "@/components/motion/system-path";
import { CountUp } from "@/components/motion/count-up";

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
      <WelcomeStrip />
      {/* ── Hero ── */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <Eyebrow>the admission ecosystem · free · global</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight sm:text-[52px]">
                Admission is a system.
                <br />
                <span className="headline-gradient">Every system has a hack.</span>
                <br />
                Find yours.
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fog">
                Deadlines scattered across 50 tabs. Documents prepared 8 times. Contradictory
                advice everywhere. AdmissionHack compiles the whole process — how it works, which
                universities fit, which exams you need — into one clear sequence.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/how-admission-works"
                  className="anim-glow rounded-xl bg-lime px-6 py-3.5 text-center text-sm font-bold text-ink transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Decode the process →
                </Link>
                <Link
                  href="/universities"
                  className="rounded-xl border border-line2 bg-panel/60 px-6 py-3.5 text-center text-sm font-bold text-paper transition-colors hover:border-lime/50 hover:text-lime"
                >
                  Browse {universities.length} universities
                </Link>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { v: universities.length, l: "universities" },
                  { v: countries.length, l: "countries" },
                  { v: exams.length, l: "exams decoded" },
                  { v: 8, l: "journey steps" },
                ].map((s) => (
                  <div key={s.l}>
                    <dd className="text-2xl font-bold text-lime">{s.v}</dd>
                    <dt className="mt-1 text-[11px] uppercase tracking-wider text-dim">{s.l}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative hidden lg:block">
            <div className="anim-float absolute -left-8 top-8 z-10 rounded-xl border border-line2 bg-panel px-4 py-2.5 text-xs font-bold text-lime shadow-lg">
              🎓 IELTS 7.5 — secured
            </div>
            <div className="anim-float-slow absolute -right-4 top-1/2 z-10 rounded-xl border border-line2 bg-panel px-4 py-2.5 text-xs font-bold text-mint shadow-lg">
              ⚡ deadlines tracked: 8
            </div>
            <TerminalHero />
          </Reveal>
        </div>
      </section>

      <ExamMarquee />

      {/* ── Journey ── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="the journey"
            title="Admission is 8 steps. Run them in order."
            description="Most stress comes from running step 5 before step 2. Execute in sequence and the whole thing compiles."
          />
        </Reveal>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, i) => (
            <Reveal key={step.slug} delay={i * 70}>
              <li>
                <Link
                  href={`/how-admission-works/${step.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-panel/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-lime/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-lime/30 bg-lime/10 px-2 py-0.5 text-[11px] font-bold text-lime">
                      step {step.order}
                    </span>
                    <span className="text-[10px] text-dim opacity-0 transition-opacity group-hover:opacity-100">
                      open →
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-paper group-hover:text-lime">
                    {step.shortTitle}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-dim">{step.timing}</p>
                </Link>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ── Modules ── */}
      <section className="border-y border-line/70 bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="the ecosystem"
              title="Four modules, live today"
              description="The tracker, vault, community and AI advisor are compiling on top of this foundation."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {modules.map((m, i) => (
              <Reveal key={m.href} delay={i * 80}>
                <CtaCard href={m.href} title={`$ ${m.cmd} — ${m.title}`} description={m.description} cta="open" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compiling next ── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHeading eyebrow="roadmap" title="Compiling next" />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div className="group h-full rounded-xl border border-dashed border-line2 bg-panel/40 p-5 transition-colors hover:border-lime/40">
                <p className="text-sm font-bold text-paper">$ {item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-dim">{item.desc}</p>
                <p className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-lime/70">
                  <span className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-lime" />
                  in development
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
