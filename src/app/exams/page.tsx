import Link from "next/link";
import { hasPractice } from "@/data/practice";
import type { Metadata } from "next";
import { exams } from "@/data/exams";
import { PageHero } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Admission exams explained — SAT, IELTS, TOEFL, CSCA and more",
  description:
    "Every major university admission exam: who needs it, format, cost, dates, score validity. SAT, ACT, IELTS, TOEFL, Duolingo, PTE, GRE, GMAT, CSCA, EJU and IMAT.",
};

const groups = [
  {
    title: "launch hubs — prep being built first",
    filter: (t: number) => t === 1,
    description: "The highest-demand exams. These get dedicated prep hubs with practice questions, mock tests and score tools.",
  },
  {
    title: "roadmap hubs",
    filter: (t: number) => t === 2,
    description: "Large-volume exams that get their prep hubs in the next build phase.",
  },
  {
    title: "niche & corridor exams",
    filter: (t: number) => t === 3,
    description: "Smaller but essential for specific destinations — Japan and Italy medicine.",
  },
];

export default function ExamsPage() {
  return (
    <>
      <PageHero
        eyebrow="exams hub"
        title="Every admission exam, decoded"
        description="Format, cost, dates, validity and who actually needs it — grounded in verified 2025–26 data, with the official site linked on every page. Prep hubs compile for the launch tier first."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6">
        {groups.map((group) => {
          const groupExams = exams.filter((e) => group.filter(e.tier));
          if (groupExams.length === 0) return null;
          return (
            <section key={group.title}>
              <Reveal>
                <h2 className="font-bold text-lime">
                  <span className="text-lime/60">&gt; </span>
                  {group.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-fog">{group.description}</p>
              </Reveal>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupExams.map((exam, i) => (
                  <Reveal key={exam.id} delay={i * 60}>
                    <Link
                      href={`/exams/${exam.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-line bg-panel/70 p-5 card-interactive"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-paper transition-colors group-hover:text-lime">
                          {exam.name}
                        </h3>
                        <span className="text-right text-[10px] leading-snug text-dim">
                          {exam.administrator}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fog">
                        {exam.whoNeedsIt}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                        <span className="rounded-md border border-line bg-ink px-2 py-0.5 text-[11px] text-fog">
                          {exam.scoreScale}
                        </span>
                        <span className="rounded-md border border-mint/40 bg-mint/10 px-2 py-0.5 text-[11px] text-mint">
                          {exam.feeUsd}
                        </span>
                        {hasPractice(exam.id) && (
                          <span className="rounded-md border border-lime/50 bg-lime/10 px-2 py-0.5 text-[11px] font-bold text-lime">
                            practice ready
                          </span>
                        )}
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
