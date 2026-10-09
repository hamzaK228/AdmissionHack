import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { universities, universityBySlug, countryByCode, examById } from "@/data/all";
import { RANKING_EDITIONS } from "@/data/types";
import { Badge, FactCard, DataNotice, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { SaveButton } from "@/components/save-button";

export function generateStaticParams() {
  return universities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const uni = universityBySlug(slug);
  if (!uni) return {};
  return {
    title: `${uni.name} — admission guide for international students`,
    description: uni.description,
  };
}

const selectivityText: Record<string, string> = {
  "very-high": "Very high — expect an exceptional profile",
  high: "High — strong grades needed",
  moderate: "Moderate — good grades usually sufficient",
  open: "Open — most qualified applicants admitted",
  unknown: "See official website",
};

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const uni = universityBySlug(slug);
  if (!uni) notFound();

  const country = uni.country ? countryByCode(uni.country) : undefined;
  const isBasic = uni.dataStatus === "basic";
  const tuition = uni.tuitionUsdPerYear
    ? `$${uni.tuitionUsdPerYear.min.toLocaleString()} – $${uni.tuitionUsdPerYear.max.toLocaleString()}`
    : "See official website";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/universities" className="text-sm text-fog transition-colors hover:text-lime">
        ← all universities
      </Link>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-dim">
            {uni.country ? countryByCode(uni.country)?.flag : "🌍"} {uni.countryName}
            {uni.city ? ` · ${uni.city}` : ""}
            {uni.founded ? ` · founded ${uni.founded}` : ""}
          </p>
          <h1 className="headline-gradient mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {uni.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton slug={uni.slug} size="md" withLabel />
          {uni.website ? (
            <a
              href={uni.website}
              target="_blank"
              rel="noopener noreferrer"
              className="anim-glow rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03] active:scale-95"
            >
              official site ↗
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-base leading-relaxed text-fog">{uni.description}</p>

      <Reveal>
        <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <FactCard
            label={`QS ${RANKING_EDITIONS.qs}`}
            value={
              uni.qsRank != null ? (
                <>
                  #{uni.qsRank}{" "}
                  <a
                    href="https://www.topuniversities.com/world-university-rankings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lime/80 hover:text-lime"
                  >
                    source ↗
                  </a>
                </>
              ) : (
                <span className="text-dim">unranked (specialist)</span>
              )
            }
          />
          {uni.arwuRank != null ? (
            <FactCard
              label={`ARWU ${RANKING_EDITIONS.arwu}`}
              value={
                <>
                  #{uni.arwuRank}{" "}
                  <a
                    href="https://www.shanghairanking.com/rankings/arwu/2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lime/80 hover:text-lime"
                  >
                    source ↗
                  </a>
                </>
              }
            />
          ) : (
            <FactCard label={`ARWU ${RANKING_EDITIONS.arwu}`} value={<span className="text-dim">unranked</span>} />
          )}
          <FactCard label="int'l tuition / yr" value={
            <>
              {tuition}
              {uni.tuitionNote ? (
                <span className="mt-1 block text-xs font-normal text-dim">{uni.tuitionNote}</span>
              ) : null}
            </>
          } />
          <FactCard label="selectivity" value={selectivityText[uni.selectivity]} />
          <FactCard
            label="languages"
            value={uni.languages.length ? uni.languages.join(" · ") : (country?.languages.join(" · ") ?? "see official site")}
          />
          <FactCard
            label="intakes"
            value={country?.intakes.join(" · ") ?? "see official site"}
          />
        </dl>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {uni.fields.length > 0 && (
            <Reveal>
              <section>
                <Eyebrow>strong fields</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {uni.fields.map((f) => (
                    <Badge key={f} tone="cyan">
                      {f}
                    </Badge>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {uni.acceptedExams.length > 0 && (
            <Reveal>
              <section>
                <Eyebrow>exams accepted</Eyebrow>
                <ul className="mt-4 space-y-2">
                  {uni.acceptedExams.map((id) => {
                    const exam = examById(id);
                    return (
                      <li key={id}>
                        {exam ? (
                          <Link
                            href={`/exams/${exam.id}`}
                            className="group flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3.5 text-sm transition-all hover:border-lime/50"
                          >
                            <span className="font-bold text-paper transition-colors group-hover:text-lime">
                              {exam.name}
                            </span>
                            <span className="text-xs text-dim">
                              {exam.scoreScale} · {exam.feeUsd}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3.5 text-sm">
                            <span className="font-bold text-paper">{id.toUpperCase()}</span>
                            <span className="text-xs text-dim">guide compiling…</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Reveal>
          )}

          {country && (
            <Reveal>
              <section className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
                <Eyebrow>country context</Eyebrow>
                <p className="mt-3 text-sm leading-relaxed text-fog">{country.systemSummary}</p>
                <Link
                  href={`/countries/${country.slug}`}
                  className="mt-4 inline-block text-sm font-bold text-lime transition-opacity hover:opacity-80"
                >
                  read the {country.name} guide →
                </Link>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="space-y-6">
          {country && (
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-dim">english req</h2>
              <p className="mt-2 text-sm leading-relaxed text-fog">{country.englishRequirement}</p>
              <h2 className="mt-6 text-xs font-bold uppercase tracking-widest text-dim">visa</h2>
              <p className="mt-2 text-sm leading-relaxed text-fog">{country.visaNote}</p>
            </div>
          )}
          <div className="rounded-2xl border border-line bg-panel/70 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-dim">data status</h2>
            <div className="mt-3 flex items-center gap-2">
              {isBasic ? (
                <Badge tone="amber">basic profile</Badge>
              ) : (
                <Badge tone="amber">community-contributed</Badge>
              )}
              <span className="text-xs text-dim">
                checked {new Date(uni.lastVerified).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
            <DataNotice className="mt-3 justify-start" />
          </div>
        </aside>
      </div>
    </div>
  );
}
