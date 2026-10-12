"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { journeySteps } from "@/data/journey";
import { Reveal } from "@/components/reveal";

const N = journeySteps.length;

/**
 * The admission journey as a scroll-driven HORIZONTAL filmstrip, matching
 * weevolveit's signature motion: the section pins for N viewport-heights and
 * vertical scroll translates the phase track sideways, each phase carrying its
 * own giant ghost numeral.
 *
 * The translation is written to a CSS variable from a passive scroll listener,
 * so it resolves in the style engine rather than an animation-frame loop.
 * Below `lg` it degrades to a normal vertical stack — a horizontal filmstrip is
 * a poor read on a phone.
 */
export function JourneyScroller() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // only drive the filmstrip on wide viewports
    const mq = window.matchMedia("(min-width: 1024px)");
    const write = () => {
      if (!mq.matches) {
        el.style.removeProperty("--jp");
        return;
      }
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      el.style.setProperty("--jp", p.toFixed(4));
      setActive(Math.min(N - 1, Math.max(0, Math.round(p * (N - 1)))));
    };

    write();
    window.addEventListener("scroll", write, { passive: true });
    window.addEventListener("resize", write);
    mq.addEventListener("change", write);
    return () => {
      window.removeEventListener("scroll", write);
      window.removeEventListener("resize", write);
      mq.removeEventListener("change", write);
    };
  }, []);

  return (
    <div className="relative">
      {/* ── framework intro, light like the reference ── */}
      <section className="section-light relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
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
              step two and wonder why it feels impossible. Keep scrolling — the eight phases move
              sideways.
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
        </div>
      </section>

      {/* ── the filmstrip: pinned, scroll translates the track sideways ── */}
      <div
        ref={wrapRef}
        className="journey-pin section-light relative"
        style={{ ["--journey-shift" as string]: `calc(${N - 1} * 100vw)` }}
      >
        <div className="journey-sticky">
          <div className="journey-track">
            {journeySteps.map((step, i) => (
              <article
                key={step.slug}
                data-step={i}
                className="journey-panel"
                aria-current={i === active}
              >
                {/* giant ghost numeral, translating with its phase */}
                <span aria-hidden className="ghost-number">
                  {String(step.order).padStart(2, "0")}
                </span>

                <div className="relative z-10 grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-dim">
                      [ step {String(step.order).padStart(2, "0")} ]
                    </p>
                    <h3 className="headline-gradient mt-5 text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl">
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
                      className="link-quiet mt-8 inline-flex items-center gap-2 rounded-full border border-line2 px-5 py-2.5 text-xs font-bold text-paper"
                    >
                      read step {step.order} in full →
                    </Link>
                  </div>

                  <div className="hidden rounded-2xl border border-line bg-panel/70 p-6 backdrop-blur-sm lg:block lg:p-8">
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
              </article>
            ))}
          </div>

          {/* sticky stepper — the phase progress readout */}
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line2 bg-ink/90 px-4 py-2.5 backdrop-blur-xl">
              {journeySteps.map((s, i) => (
                <span key={s.slug} className="stepper-dot" data-active={i === active} />
              ))}
              <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-fog">
                {String(journeySteps[active].order).padStart(2, "0")} ·{" "}
                {journeySteps[active].shortTitle}
              </span>
            </div>
          </div>

          {/* horizontal progress rail */}
          <div className="absolute inset-x-0 top-0 z-20 hidden h-px bg-line lg:block">
            <div
              className="h-full bg-gradient-to-r from-mint to-lime"
              style={{
                transform: "scaleX(var(--jp, 0))",
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
