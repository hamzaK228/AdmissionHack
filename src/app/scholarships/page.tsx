import type { Metadata } from "next";
import { scholarships, scholarshipAdvice } from "@/data/scholarships";
import { PageHero, DataNotice } from "@/components/ui";
import { ScholarshipExplorer } from "@/components/scholarship-explorer";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "22 major scholarships for international students — windows, coverage, eligibility",
  description:
    "The flagship government and university scholarships for studying abroad: Fulbright, Chevening, Erasmus Mundus, DAAD, MEXT, CSC, Türkiye Bursları, GKS and more — with verified application windows and honest competition levels.",
};

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="scholarships hub"
        title="The money exists. Most people just miss the window."
        description="22 flagship scholarships verified for the 2026–27 cycle — what they cover, who qualifies, and exactly when to apply. The single most common failure is timing: most windows close 8–14 months before enrollment."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Reveal>
          <ScholarshipExplorer items={scholarships} />
        </Reveal>

        <Reveal>
          <section className="mt-14 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime">
              <span className="text-lime/60">&gt; </span>how people actually win these
            </p>
            <ul className="mt-5 space-y-3">
              {scholarshipAdvice.map((a, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-fog">
                  <span className="shrink-0 font-bold text-lime">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <DataNotice className="mt-10" />
      </div>
    </>
  );
}
