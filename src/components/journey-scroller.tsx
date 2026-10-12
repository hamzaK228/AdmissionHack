"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { journeySteps } from "@/data/journey";
import { Reveal } from "@/components/reveal";

/**
 * The admission journey as a stepped scroll narrative — one section per step,
 * each with a giant ghost numeral watermark, a huge title, the timing, the real
 * "what to do" bullets and the real mistakes panel. Backgrounds alternate
 * light/dark, and a sticky stepper tracks where you are.
 */
export function JourneyScroller() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.step);
            if (Number.isFinite(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* ── framework intro (light, like the reference) ── */}
      <section className="section-light relative overflow-hidden border-y border-line px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-dim">
              [ the framework ]
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="headline-gradient mt-6 text-5xl font-bold leading-[0.98] tracking-tight sm:text-8xl">
              The 8 steps.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-fog sm:text-base">
              Admission is not one decision, it&apos;s a sequence. Most people run step five before
              step two and wonder why it feels impossible. Run them in order — every step below is
              the real thing, with the timing that matters and the mistakes that cost people a year.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.2em] text-fog">
              {journeySteps.map((s, i) => (
                <span key={s.slug} className="flex items-center gap-3">
                  {i > 0 && <span className="text-dim">·</span>}
                  <span className={i === journeySteps.length - 1 ? "text-lime" : ""}>
                    {s.shortTitle}
                  </span>
                </span>
              ))}
            </p>
          </Reveal>
          {/* phase dots */}
          <div className="mt-12 flex items-center justify-center gap-3 text-paper">
            {journeySteps.map((s, i) => (
              <span key={s.slug} className="stepper-dot" data-active={i === active} />
            ))}
          </div>
        </div>
      </section>

      {/* ── one section per step, alternating light/dark ── */}
      {journeySteps.map((step, i) => {
        const light = i % 2 === 1;
        return (
          <section
            key={step.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className={`relative overflow-hidden border-b border-line px-4 py-24 sm:px-6 sm:py-32 ${
              light ? "section-light" : ""
            }`}
          >
            {/* ghost numeral */}
            <span
              aria-hidden
              className="ghost-number -top-6 right-[-2vw] text-[34vw] sm:top-0 sm:text-[26vw]"
            >
              {String(step.order).padStart(2, "0")}
            </span>

            <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-dim">
                  [ step {String(step.order).padStart(2, "0")} ]
                </p>
                <h3 className="headline-gradient mt-5 text-4xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
                  {step.shortTitle}.
                </h3>
                <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-lime">
                  {step.timing}
                </p>

                <ul className="mt-8 space-y-3.5 text-sm leading-relaxed text-fog">
                  {step.whatToDo.slice(0, 4).map((item) => (
                    <li key={item} className="dash-item">
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/how-admission-works/${step.slug}`}
                  className="link-quiet mt-9 inline-flex items-center gap-2 rounded-full border border-line2 px-5 py-2.5 text-xs font-bold text-paper"
                >
                  read step {step.order} in full →
                </Link>
              </div>

              {/* the "visual block" — our real mistakes panel instead of a placeholder */}
              <div className="rounded-2xl border border-line bg-panel/60 p-6 backdrop-blur-sm sm:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-dim">
                  what goes wrong here
                </p>
                <ul className="mt-5 space-y-4">
                  {step.commonMistakes.map((m) => (
                    <li key={m} className="flex gap-3 text-sm leading-relaxed text-fog">
                      <span className="mt-0.5 shrink-0 text-red" aria-hidden>
                        ⚠
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-dim">
                  {step.howAdmissionHackHelps}
                </p>
              </div>
            </div>
          </section>
        );
      })}

      {/* ── sticky stepper ── */}
      <div className="sticky bottom-4 z-40 mx-auto mt-[-1px] w-fit max-w-[94vw] rounded-full border border-line2 bg-ink/90 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-paper">
          {journeySteps.map((s, i) => (
            <span key={s.slug} className="flex items-center gap-2">
              <a
                href={`#step-${i}`}
                aria-label={`Step ${s.order}: ${s.shortTitle}`}
                className="stepper-dot block"
                data-active={i === active}
              />
            </span>
          ))}
          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-fog">
            {String(journeySteps[active]?.order ?? 1).padStart(2, "0")} ·{" "}
            {journeySteps[active]?.shortTitle ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
}
