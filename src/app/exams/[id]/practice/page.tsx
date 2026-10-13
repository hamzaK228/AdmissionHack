import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { examById } from "@/data/exams";
import { bankFor, practiceExamIds } from "@/data/practice";
import { PracticeRunner } from "@/components/practice/practice-runner";
import { Eyebrow } from "@/components/ui";

export function generateStaticParams() {
  return practiceExamIds.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const exam = examById(id);
  return exam
    ? {
        title: `${exam.name} practice — original questions with explanations`,
        description: `Practise ${exam.name} with original questions and an explanation for every answer.`,
      }
    : {};
}

/**
 * Practice for one exam.
 *
 * The engine is shared; the bank is per exam. When an exam has no bank yet this
 * says so plainly and points at the ones that do, rather than rendering an empty
 * runner — content is the bottleneck for this pillar and pretending otherwise
 * would be the dishonest default.
 */
export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = examById(id);
  if (!exam) notFound();

  const bank = bankFor(id);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
      {bank ? (
        <PracticeRunner examId={id} examName={exam.name} />
      ) : (
        <div className="mx-auto max-w-2xl">
          <Eyebrow>{exam.name} practice</Eyebrow>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            No question bank for {exam.name} yet.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-fog">
            The engine is built and the format is understood — what a hub needs next is its own
            questions. Writing them well takes longer than building the runner, and a bank that is
            large but shaky teaches worse than a small one that is correct, so the sets grow one exam
            at a time.
          </p>

          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-dim">
            available now
          </p>
          <ul className="mt-3 space-y-2">
            {practiceExamIds.map((pid) => {
              const e = examById(pid);
              if (!e) return null;
              return (
                <li key={pid}>
                  <Link
                    href={`/exams/${pid}/practice`}
                    className="flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3 transition-colors hover:border-lime/50"
                  >
                    <span className="text-sm font-bold text-paper">{e.name}</span>
                    <span className="text-xs text-lime">start practice →</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 text-xs leading-relaxed text-dim">
            <Link href={`/exams/${id}`} className="text-lime hover:underline">
              back to the {exam.name} guide
            </Link>{" "}
            for format, dates, costs and who needs it.
          </p>
        </div>
      )}
    </main>
  );
}
