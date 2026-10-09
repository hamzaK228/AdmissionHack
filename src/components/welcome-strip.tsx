"use client";

import Link from "next/link";
import { useStore } from "@/components/dashboard/store";
import { countries, countryByCode } from "@/data/countries";

/** Personalized strip for returning visitors — the site remembers you. */
export function WelcomeStrip() {
  const { ready, profile, deadlines, apps } = useStore();
  if (!ready || !profile) return null;

  const country = profile.country !== "undecided"
    ? countries.find((c) => c.name === profile.country)
    : undefined;
  const next = deadlines
    .map((d) => ({ ...d, days: Math.ceil((new Date(d.date + "T00:00:00").getTime() - Date.now()) / 86_400_000) }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <div className="border-b border-line/70 bg-panel/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs sm:px-6">
        <p className="text-fog">
          <span className="text-lime">&gt; </span>
          welcome back, <span className="font-bold text-paper">{profile.name || "applicant"}</span>
          <span className="text-dim"> · </span>
          {country ? (
            <Link href={`/countries/${country.slug}`} className="text-fog transition-colors hover:text-lime">
              {country.flag} {country.name}
            </Link>
          ) : (
            <span className="text-dim">exploring</span>
          )}
          {next && (
            <>
              <span className="text-dim"> · </span>
              <span className="text-fog">
                next: {next.title}{" "}
                <span className={next.days <= 30 ? "font-bold text-red" : "font-bold text-lime"}>
                  in {next.days}d
                </span>
              </span>
            </>
          )}
        </p>
        <Link href="/dashboard" className="font-bold text-lime transition-opacity hover:opacity-80">
          dashboard{apps.length > 0 && ` (${apps.length})`} →
        </Link>
      </div>
    </div>
  );
}
