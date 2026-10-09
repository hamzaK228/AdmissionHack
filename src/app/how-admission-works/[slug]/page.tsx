import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { journeySteps, journeyStepBySlug } from "@/data/journey";
import { Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export function generateStaticParams() {
  return journeySteps.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const step = journeyStepBySlug(slug);
  if (!step) return {};
  return { title: step.title, description: step.summary };
}

export default async function JourneyStepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const step = journeyStepBySlug(slug);
  if (!step) notFound();

  const prev = journeySteps.find((s) => s.order === step.order - 1);
  const next = journeySteps.find((s) => s.order === step.order + 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/how-admission-works" className="text-sm text-fog transition-colors hover:text-lime">
        ← all steps
      </Link>
      <div className="mt-8">
        <Eyebrow>
          step {step.order} of {journeySteps.length} · {step.timing}
        </Eyebrow>
        <h1 className="headline-gradient mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {step.title}
        </h1>
      </div>
      <p className="mt-5 text-base leading-relaxed text-fog">{step.summary}</p>

      <div className="mt-12 space-y-10">
        <Reveal>
          <section>
            <h2 className="text-lg font-bold text-paper">
              <span className="text-lime">$</span> what to do
            </h2>
            <ul className="mt-5 space-y-3">
              {step.whatToDo.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-line bg-panel/70 p-4 text-sm leading-relaxed text-fog"
                >
                  <span className="text-lime">[+]</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <h2 className="text-lg font-bold text-paper">
              <span className="text-red">!</span> mistakes that cost people their season
            </h2>
            <ul className="mt-5 space-y-3">
              {step.commonMistakes.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-red/25 bg-red/[0.06] p-4 text-sm leading-relaxed text-fog"
                >
                  <span className="text-red">⚠</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
            <Eyebrow>how admissionhack helps</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">{step.howAdmissionHackHelps}</p>
          </section>
        </Reveal>
      </div>

      <nav className="mt-14 flex justify-between gap-4 border-t border-line pt-6 text-sm">
        {prev ? (
          <Link
            href={`/how-admission-works/${prev.slug}`}
            className="text-fog transition-colors hover:text-lime"
          >
            ← {prev.order}. {prev.shortTitle}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/how-admission-works/${next.slug}`}
            className="font-bold text-lime transition-opacity hover:opacity-80"
          >
            {next.order}. {next.shortTitle} →
          </Link>
        ) : (
          <Link href="/countries" className="font-bold text-lime transition-opacity hover:opacity-80">
            explore country guides →
          </Link>
        )}
      </nav>
    </div>
  );
}
