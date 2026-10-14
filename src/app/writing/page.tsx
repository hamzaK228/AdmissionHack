import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import {
  READER_RULES,
  ESSAY_SHAPE,
  EXAMPLES,
  BEFORE_AFTER,
  FAILURE_MODES,
  PROVENANCE,
} from "@/data/writing-school";

export const metadata: Metadata = {
  title: "The Writing School — the admissions essay, taught by annotated example",
  description:
    "What an admissions reader is actually doing, the shape that works, two model essays annotated line by line, before-and-after rewrites, and the five ways drafts fail. Then get your own draft reviewed.",
};

export default function WritingSchoolPage() {
  return (
    <>
      <PageHero
        eyebrow="the writing school"
        title="The essay is where most applicants lose what they had already won."
        description="The only part of the file that is a person rather than a number — which is why it is read the way it is read, fast and once. This is the technique, shown line by line on annotated models rather than described in the abstract."
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {/* ── what the reader is doing ─────────────────────────────────────── */}
        <Reveal>
          <section>
            <SectionHeading
              eyebrow="start here"
              title="What the reader is doing"
              description="Every piece of advice below follows from these five facts. They are not opinions about good writing; they are constraints imposed by how admissions files are actually read."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {READER_RULES.map((r, i) => (
                <div key={i} className="rounded-2xl border border-line bg-panel/70 p-5 card-interactive">
                  <p className="font-mono text-xs text-lime">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 font-bold text-paper">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{r.body}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── the shape ────────────────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="the spine"
              title="The shape that works"
              description="Not a template to fill in — a spine to hang a real story on. The order matters because each step earns the next one."
            />
            <ol className="mt-10 divide-y divide-line border-y border-line">
              {ESSAY_SHAPE.map((s, i) => (
                <li key={i} className="grid gap-3 py-6 sm:grid-cols-[auto_1fr_1fr] sm:gap-8">
                  <span className="font-mono text-sm text-lime">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-bold text-paper">{s.step}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fog">{s.what}</p>
                  </div>
                  <p className="self-center border-l-2 border-line2 pl-4 font-mono text-xs italic leading-relaxed text-dim">
                    {s.example}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ── annotated examples ───────────────────────────────────────────── */}
        {EXAMPLES.map((ex) => (
          <Reveal key={ex.id}>
            <section className="mt-20">
              <SectionHeading eyebrow={ex.kind} title={ex.title} description={ex.premise} />

              <div className="mt-10 space-y-6">
                {ex.paragraphs.map((p, i) => (
                  <div key={i} className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
                    <p className="text-base leading-relaxed text-paper">{p.text}</p>
                    {p.note && (
                      <div className="rounded-xl border border-lime/25 bg-lime/[0.05] p-4 lg:self-start">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime">
                          why it works
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-fog">{p.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-line bg-panel/70 p-6">
                <Eyebrow>what to take from it</Eyebrow>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fog">
                  {ex.takeaways.map((t, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-lime">→</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </Reveal>
        ))}

        {/* ── before / after ───────────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="rewrites"
              title="Before and after"
              description="The three most common failures, with the fix. The point is the delta — read the pair, then the reason, and you will start hearing the problem in your own draft."
            />
            <div className="mt-10 space-y-8">
              {BEFORE_AFTER.map((b) => (
                <div key={b.id} className="rounded-2xl border border-line bg-panel/70 p-6">
                  <h3 className="font-bold text-paper">{b.problem}</h3>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-red/30 bg-red/[0.04] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red">before</p>
                      <p className="mt-2 text-sm italic leading-relaxed text-fog">{b.before}</p>
                    </div>
                    <div className="rounded-xl border border-mint/30 bg-mint/[0.05] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mint">after</p>
                      <p className="mt-2 text-sm leading-relaxed text-paper">{b.after}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-fog">
                    <span className="font-bold text-lime">why · </span>
                    {b.why}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── failure modes ────────────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="diagnostics"
              title="The five ways drafts fail"
              description="Each has a test you can apply to your own draft in a minute. Fixing these is most of the work; the rest is voice, and voice arrives on its own once the failures are gone."
            />
            <ul className="mt-10 space-y-3">
              {FAILURE_MODES.map((f, i) => (
                <li key={i} className="rounded-2xl border border-line bg-panel/70 p-5">
                  <p className="font-bold text-paper">
                    <span className="mr-3 font-mono text-xs text-amber">{String(i + 1).padStart(2, "0")}</span>
                    {f.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{f.tell}</p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* ── do it on your own draft ──────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 sm:p-8">
            <Eyebrow>now the useful part</Eyebrow>
            <h2 className="headline-gradient mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Get your own draft read.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
              The dashboard&rsquo;s writing tab takes your draft and returns an honest read: what is working,
              the specific lines working against you, and what to do next — with your own words quoted back.
              The primer there is the same one above, so the two are one tool rather than two opinions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
              >
                open the writing tab →
              </Link>
              <Link
                href="/how-admission-works"
                className="rounded-lg border border-line2 bg-panel px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
              >
                the full admission journey →
              </Link>
            </div>
          </section>
        </Reveal>

        <p className="mx-auto mt-12 max-w-3xl text-xs leading-relaxed text-dim">
          <span aria-hidden>⚠ </span>
          {PROVENANCE}
        </p>
      </div>
    </>
  );
}
