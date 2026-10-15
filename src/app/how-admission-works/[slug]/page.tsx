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
    <div className="reading-surface mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/how-admission-works" className="text-sm text-fog transition-colors hover:text-lime">
        ← all steps
      </Link>
      <div className="relative mt-8">
        {/* a ghost numeral, so the step has a landmark rather than a sentence about itself */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 select-none font-mono text-[6.5rem] font-bold leading-none text-lime/[0.08]"
        >
          {String(step.order).padStart(2, "0")}
        </span>
        <Eyebrow>
          step {step.order} of {journeySteps.length} · {step.timing}
        </Eyebrow>
        <h1 className="headline-gradient mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {step.title}
        </h1>
        {/* the rail: eight steps, the ones behind you dimmed, the current one wide. It is the
            cheapest orientation there is — one glance says how far in you are. */}
        <nav className="mt-6 flex flex-wrap items-center gap-1.5" aria-label="all eight steps">
          {journeySteps.map((sj) => {
            const here = sj.slug === step.slug;
            const done = sj.order < step.order;
            return (
              <Link
                key={sj.slug}
                href={`/how-admission-works/${sj.slug}`}
                title={`${sj.order}. ${sj.shortTitle}`}
                aria-current={here ? "step" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  here
                    ? "w-12 bg-lime"
                    : done
                      ? "w-6 bg-lime/45 hover:bg-lime/70"
                      : "w-6 bg-line2 hover:bg-lime/40"
                }`}
              />
            );
          })}
        </nav>
      </div>
      <p className="read mt-6">{step.summary}</p>

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
                  className="read flex gap-3 rounded-xl border border-line bg-panel/70 p-4"
                >
                  <span className="font-mono text-lime">[+]</span>
                  <span>{item}</span>
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
                  className="read flex gap-3 rounded-xl border border-red/25 bg-red/[0.06] p-4"
                >
                  <span className="font-mono text-red">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
            <Eyebrow>how admissionhack helps</Eyebrow>
            <p className="read mt-3">{step.howAdmissionHackHelps}</p>
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
