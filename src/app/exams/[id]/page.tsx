import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exams, examById } from "@/data/exams";
import { universities } from "@/data/all";
import { FactCard, DataNotice, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export function generateStaticParams() {
  return exams.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const exam = examById(id);
  if (!exam) return {};
  return {
    title: `${exam.name} — format, cost, dates and who needs it`,
    description: exam.whoNeedsIt,
  };
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = examById(id);
  if (!exam) notFound();

  const accepting = universities.filter((u) => u.acceptedExams.includes(exam.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/exams" className="text-sm text-fog transition-colors hover:text-lime">
        ← all exams
      </Link>

      <div className="mt-8">
        <Eyebrow>{exam.administrator}</Eyebrow>
        <h1 className="headline-gradient mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {exam.name}
        </h1>
      </div>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-fog">{exam.purpose}</p>

      <Reveal>
        <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FactCard label="score scale" value={exam.scoreScale} />
          <FactCard label="cost" value={exam.feeUsd} />
          <FactCard label="frequency" value={exam.frequency} />
          <FactCard label="validity" value={exam.validity} />
        </dl>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <Reveal>
            <section>
              <Eyebrow>format</Eyebrow>
              <div className="mt-4 space-y-2">
                {exam.sections.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-xl border border-line bg-panel/70 p-4 transition-colors hover:border-line2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-paper">{s.name}</h3>
                      {s.durationMin > 0 && (
                        <span className="text-[11px] text-dim">{s.durationMin} min</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-fog">{s.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>


          {exam.typicalMinimums && (
            <Reveal>
              <section>
                <Eyebrow>typical minimum scores by destination</Eyebrow>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {exam.typicalMinimums.map((m) => (
                    <div key={m.destination} className="rounded-xl border border-line bg-panel/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-dim">{m.destination}</p>
                      <p className="mt-1.5 text-sm font-bold text-lime">{m.scores}</p>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {accepting.length > 0 && (
            <Reveal>
              <section>
                <Eyebrow>universities accepting it</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {accepting.map((u) => (
                    <Link
                      key={u.slug}
                      href={`/universities/${u.slug}`}
                      className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-fog link-quiet"
                    >
                      {u.name}
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-panel/70 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-dim">who needs it</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">{exam.whoNeedsIt}</p>
            <h2 className="mt-6 text-xs font-bold uppercase tracking-widest text-dim">
              delivery & scale
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">{exam.deliveryMode}</p>
            <p className="mt-2 text-sm leading-relaxed text-fog">{exam.popularity}</p>
          </div>

          <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
            <Eyebrow>prep hub</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              A dedicated prep hub for this exam — lessons, practice questions, mock tests — is on
              the build roadmap. This guide is its foundation.
            </p>
          </div>

          <a
            href={exam.officialSite}
            target="_blank"
            rel="noopener noreferrer"
            className="anim-glow block rounded-xl bg-lime px-5 py-3.5 text-center text-sm font-bold text-ink press-grow"
          >
            register on the official site ↗
          </a>

          <DataNotice />
        </aside>
      </div>
    </div>
  );
}
