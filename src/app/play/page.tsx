import type { Metadata } from "next";
import Link from "next/link";
import { universities } from "@/data/all";
import { PageHero, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { Arcade } from "@/components/play/arcade";
import type { PlayUni } from "@/lib/play";

export const metadata: Metadata = {
  title: "The arcade — guess the university, higher or lower",
  description:
    "Two quick games built from real admission data: which university charges more tuition, and can you name a university from three clues? No account needed, nothing to install.",
};

export default function PlayPage() {
  /**
   * The deck: only institutions that carry real numbers. A guessing game built on
   * invented tuition would teach the wrong thing faster than it entertains, so the
   * game is deliberately limited to the curated slice of the directory where a
   * tuition range, a rank and a country all actually exist.
   */
  const playable: PlayUni[] = universities
    .filter((u) => u.tuitionUsdPerYear && u.tuitionUsdPerYear.max > 0)
    .map((u) => ({
      slug: u.slug,
      name: u.name,
      country: u.countryName,
      qs: typeof u.qsRank === "number" ? u.qsRank : null,
      min: u.tuitionUsdPerYear!.min,
      max: u.tuitionUsdPerYear!.max,
    }));

  return (
    <>
      <PageHero
        eyebrow="the arcade"
        title="Two minutes, and you will know something real about tuition."
        description="Both games run on the same deck: universities with a verified tuition range, a QS rank and a country. No account, no installation, and nothing to sign up for — just the facts, arranged as a game."
      />

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <Reveal>
          <Arcade unis={playable} />
        </Reveal>

        <Reveal>
          <section className="mt-16 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <Eyebrow>why the numbers matter</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                Tuition is the single line that decides which of a student&rsquo;s ten universities is
                actually possible. Most applicants learn it after they have fallen in love with a name.
                Playing this for two minutes teaches the shape of the market — that a well-ranked public
                university can cost less than a mid-ranked private one, and that &ldquo;expensive&rdquo; is
                a property of the programme, not of the country.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <Eyebrow>what the game is showing you</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                The figures are the international sticker prices from our directory, which a student should
                still verify on the university&rsquo;s own page before counting on them — a game is allowed
                to be approximate in a way a financial plan is not.
              </p>
              <Link
                href="/universities"
                className="mt-4 inline-block rounded-lg border border-line2 bg-panel px-4 py-2 text-xs font-bold text-lime transition-colors hover:border-lime/50"
              >
                browse the full directory →
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
