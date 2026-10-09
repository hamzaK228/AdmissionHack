import Link from "next/link";
import type { Metadata } from "next";
import { journeySteps } from "@/data/journey";
import { PageHero } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "How university admission works — the complete journey",
  description:
    "The 8 steps of university admission for international students: choose a destination, shortlist universities, take exams, prepare documents, write essays, apply, decide, and move.",
};

export default function HowAdmissionWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="the journey"
        title="How university admission actually works"
        description="Eight steps, in order, with realistic timing. Each one has what to do, the mistakes that cost people their season, and where AdmissionHack plugs in."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ol className="space-y-3">
          {journeySteps.map((step, i) => (
            <Reveal key={step.slug} delay={i * 50}>
              <li>
                <Link
                  href={`/how-admission-works/${step.slug}`}
                  className="group grid gap-4 rounded-2xl border border-line bg-panel/70 p-6 transition-all duration-300 hover:border-lime/50 hover:shadow-[0_10px_36px_rgba(201,255,74,0.06)] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-lime/30 bg-lime/10 text-sm font-bold text-lime">
                    {String(step.order).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-bold text-paper transition-colors group-hover:text-lime">
                      {step.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-fog">
                      {step.summary}
                    </p>
                  </div>
                  <span className="hidden whitespace-nowrap rounded-md border border-line bg-ink px-3 py-1 text-[11px] text-dim sm:inline-block">
                    {step.timing}
                  </span>
                </Link>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={150}>
          <div className="mt-12 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
            <h2 className="font-bold text-lime">
              <span className="text-lime/60">&gt; </span>the one rule that matters
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fog">
              Deadlines are the only hard wall in this process — everything else is recoverable. A
              mediocre essay beats a missing one; a retake beats an unbooked exam. Build your
              timeline backwards from the earliest deadline on your shortlist, then subtract a
              two-week buffer from everything.
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
