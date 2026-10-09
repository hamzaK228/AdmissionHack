import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { countries, countryBySlug, universitiesByCountry } from "@/data/all";
import { FactCard, DataNotice, Eyebrow } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export function generateStaticParams() {
  return countries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const country = countryBySlug(slug);
  if (!country) return {};
  return {
    title: `Study in ${country.name} — admission system, costs, visa and scholarships`,
    description: country.systemSummary,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = countryBySlug(slug);
  if (!country) notFound();

  const unis = universitiesByCountry(country.name);
  const tuition =
    country.tuitionUsdPerYear.min === 0 && country.tuitionUsdPerYear.max === 0
      ? "Free (public universities)"
      : `$${country.tuitionUsdPerYear.min.toLocaleString()} – $${country.tuitionUsdPerYear.max.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/countries" className="text-sm text-fog transition-colors hover:text-lime">
        ← all countries
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className="text-5xl" aria-hidden>
          {country.flag}
        </span>
        <div>
          <h1 className="headline-gradient text-3xl font-bold tracking-tight sm:text-4xl">
            Studying in {country.name}
          </h1>
          <p className="mt-1.5 text-sm text-dim">
            {unis.length} universities in the directory · intakes: {country.intakes.join(" · ")}
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-base leading-relaxed text-fog">{country.systemSummary}</p>

      <Reveal>
        <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <FactCard label="int'l tuition / yr" value={
            <>
              {tuition}
              <span className="mt-1 block text-xs font-normal text-dim">{country.tuitionUsdPerYear.note}</span>
            </>
          } />
          <FactCard label="application windows" value={country.applicationWindows} />
          <FactCard label="application fees" value={country.applicationFeeNorm} />
          <FactCard label="english req" value={country.englishRequirement} />
          <FactCard label="apply via" value={country.applicationPlatforms.join(" · ")} />
          <FactCard label="languages" value={country.languages.join(" · ")} />
        </dl>
      </Reveal>

      {/* Visa & money */}
      <Reveal>
        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-panel/70 p-6">
            <Eyebrow>visa & financial proof</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">{country.visaFinancialProof}</p>
            <p className="mt-3 text-xs text-dim">processing: {country.visaProcessing}</p>
          </div>
          <div className="rounded-2xl border border-line bg-panel/70 p-6">
            <Eyebrow>after graduation</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">{country.postStudyWork}</p>
            <p className="mt-3 text-xs text-dim">visa: {country.visaNote}</p>
          </div>
          <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
            <Eyebrow>flagship scholarships</Eyebrow>
            <ul className="mt-3 space-y-2">
              {country.scholarshipAnchors.map((s) => (
                <li key={s} className="flex gap-2 text-sm leading-relaxed text-fog">
                  <span className="text-lime">★</span>
                  {s}
                </li>
              ))}
            </ul>
            <Link href="/scholarships" className="mt-3 inline-block text-xs font-bold text-lime hover:opacity-80">
              browse all scholarships →
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Gotchas */}
      <Reveal>
        <section className="mt-10">
          <h2 className="text-lg font-bold text-paper">
            <span className="text-red">!</span> mistakes that cost {country.name} applicants their season
          </h2>
          <ul className="mt-4 space-y-3">
            {country.gotchas.map((g) => (
              <li key={g} className="flex gap-3 rounded-xl border border-red/25 bg-red/[0.06] p-4 text-sm leading-relaxed text-fog">
                <span className="text-red">⚠</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      {/* Universities */}
      <Reveal>
        <section className="mt-12">
          <Eyebrow>universities by QS rank</Eyebrow>
          <div className="mt-4 grid gap-2">
            {unis.slice(0, 12).map((u) => (
              <Link
                key={u.slug}
                href={`/universities/${u.slug}`}
                className="group flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3.5 text-sm transition-all hover:border-lime/50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {u.qsRank != null && (
                    <span className="shrink-0 text-xs font-bold text-lime">#{u.qsRank}</span>
                  )}
                  <span className="truncate font-bold text-paper transition-colors group-hover:text-lime">
                    {u.name}
                  </span>
                </span>
                <span className="hidden shrink-0 text-xs text-dim sm:block">{u.city}</span>
              </Link>
            ))}
            {unis.length === 0 && (
              <p className="rounded-xl border border-dashed border-line2 p-6 text-sm text-fog">
                university entries for this country are being researched — check back soon.
              </p>
            )}
          </div>
          {unis.length > 12 && (
            <Link
              href={`/universities?country=${encodeURIComponent(country.name)}`}
              className="mt-4 inline-block text-sm font-bold text-lime transition-opacity hover:opacity-80"
            >
              see all {unis.length} universities →
            </Link>
          )}
        </section>
      </Reveal>

      <DataNotice className="mt-12" />
    </div>
  );
}
