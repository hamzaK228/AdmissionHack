import Link from "next/link";
import type { Metadata } from "next";
import { countries } from "@/data/all";
import { PageHero } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Country guides — how admission works in each destination",
  description:
    "How university admission works in the US, UK, Canada, Germany, Netherlands, Australia, Italy, Türkiye, Japan, China, UAE, Singapore and South Korea.",
};

export default function CountriesPage() {
  return (
    <>
      <PageHero
        eyebrow="country guides"
        title="Same applicant, different game in every country"
        description="Centralized portals vs direct applications, tuition-free vs $60k, essays vs pure grades. Start from the country guide, not from a university list."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => {
            const tuition =
              c.tuitionUsdPerYear.min === 0 && c.tuitionUsdPerYear.max === 0
                ? "free tuition"
                : `$${Math.round(c.tuitionUsdPerYear.min / 1000)}k–${Math.round(c.tuitionUsdPerYear.max / 1000)}k / yr`;
            return (
              <Reveal key={c.code} delay={i * 50}>
                <Link
                  href={`/countries/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-panel/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime/50 hover:shadow-[0_12px_40px_rgba(201,255,74,0.07)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden>
                      {c.flag}
                    </span>
                    <h2 className="font-bold text-paper transition-colors group-hover:text-lime">
                      {c.name}
                    </h2>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fog">
                    {c.systemSummary}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <span className="rounded-md border border-mint/40 bg-mint/10 px-2 py-0.5 text-[11px] text-mint">
                      {tuition}
                    </span>
                    <span className="rounded-md border border-line bg-ink px-2 py-0.5 text-[11px] text-fog">
                      {c.languages[0]}
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </>
  );
}
