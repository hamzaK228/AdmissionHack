import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ARRIVAL_STEPS, FIRST_WEEKS } from "@/data/arrival";
import { countries } from "@/data/countries";

export const metadata: Metadata = {
  title: "After the offer — the visa and arrival sequence, country by country",
  description:
    "What happens once you have an offer: accepting and the deposit, the financial statement that has to age, the visa appointment, the residence permit window, and the first two weeks. With verified visa financial-proof amounts and processing times for 13 destinations.",
};

export default function ArrivalPage() {
  return (
    <>
      <PageHero
        eyebrow="after the offer"
        title="An offer is not the finish line. It is the start of the part nobody briefs you on."
        description="The admission journey stops at “decide offers”. Everything that can still cost you the year happens after it — a deposit deadline nobody read, a bank statement that must sit untouched for weeks, a residence permit counted from the day you land. Here is the sequence, and the numbers that gate it."
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {/* ── the sequence ─────────────────────────────────────────────────── */}
        <Reveal>
          <section>
            <SectionHeading
              eyebrow="the sequence"
              title="Eight steps, measured backwards from enrolment"
              description="Each window is a typical range, not a commitment. They are ordered because they depend on each other: the visa needs a document the university issues after you accept, and that document needs a financial statement that had to be prepared before you applied."
            />
            <ol className="mt-10 space-y-4">
              {ARRIVAL_STEPS.map((s) => (
                <li key={s.slug} className="rounded-2xl border border-line bg-panel/70 p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold text-paper">
                      <span className="mr-3 font-mono text-sm text-lime">
                        {String(s.order).padStart(2, "0")}
                      </span>
                      {s.title}
                    </h3>
                    <span className="font-mono text-xs text-dim">{s.timing}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-fog">{s.what}</p>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{s.why}</p>
                  {s.mistakes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {s.mistakes.map((m, i) => (
                        <li key={i} className="text-xs leading-relaxed text-amber/90">
                          — {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ── the numbers that gate it ─────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="the numbers"
              title="What each destination actually asks for"
              description="Two figures decide whether an intake is possible at all: how much money the visa requires you to show, and how long the decision takes. These are from our country guides, verified for the current cycle — not a rule of thumb."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/countries/${c.slug}`}
                  className="group rounded-2xl border border-line bg-panel/70 p-5 card-interactive"
                >
                  <h3 className="font-bold text-paper group-hover:text-lime">
                    <span className="mr-2">{c.flag}</span>
                    {c.name}
                  </h3>
                  <dl className="mt-4 space-y-3">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
                        visa financial proof
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-fog">{c.visaFinancialProof}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
                        visa processing
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-fog">{c.visaProcessing}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
                        after graduation
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-fog">{c.postStudyWork}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs font-bold text-lime opacity-80 transition-opacity group-hover:opacity-100">
                    the full guide →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── the first two weeks ──────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="landing"
              title="The first two weeks"
              description="Registration deadlines and permit windows are counted from your arrival, not from the start of term, which is why they are missed. These are the things that are only possible once you are physically there."
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {FIRST_WEEKS.map((t, i) => (
                <li key={i} className="rounded-2xl border border-line bg-panel/70 p-5">
                  <p className="font-bold text-paper">
                    <span className="mr-3 font-mono text-xs text-lime">{String(i + 1).padStart(2, "0")}</span>
                    {t.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{t.detail}</p>
                  {t.where && (
                    <p className="mt-2 text-xs leading-relaxed text-amber/90">
                      <span className="font-bold">country note · </span>
                      {t.where}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* ── the dated version ────────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 sm:p-8">
            <Eyebrow>get it dated for you</Eyebrow>
            <h2 className="headline-gradient mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              These are ranges. Yours can be dates.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
              The dashboard measures every step backwards from your own intake month and writes the ones you
              choose into the same deadline list as everything else — so the deposit and the visa
              appointment appear next to the exam dates rather than in a paragraph you read once. It appears
              on the decisions tab as soon as you have an offer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
              >
                open the dashboard →
              </Link>
              <Link
                href="/how-admission-works"
                className="rounded-lg border border-line2 bg-panel px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
              >
                the admission journey →
              </Link>
            </div>
          </section>
        </Reveal>

        <p className="mx-auto mt-12 max-w-3xl text-xs leading-relaxed text-dim">
          <span aria-hidden>⚠ </span>
          Visa rules, financial-proof thresholds and processing times change between cycles, and processing
          times lengthen sharply in the summer months. Treat these windows as planning ranges and confirm
          anything time-critical with the embassy or the university&rsquo;s international office before you
          act on it.
        </p>
      </div>
    </>
  );
}
