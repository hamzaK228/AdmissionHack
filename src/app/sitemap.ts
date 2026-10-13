import type { MetadataRoute } from "next";
import { universities } from "@/data/universities";
import { countries } from "@/data/countries";
import { exams } from "@/data/exams";
import { journeySteps } from "@/data/journey";

/**
 * The site's own origin, kept as one knob because the brand and domain are still
 * undecided. Set NEXT_PUBLIC_SITE_URL (no trailing slash) in the host's
 * environment and everything derived from it follows — the build has to be re-run,
 * since a static sitemap is generated at build time.
 *
 * The fallback is the placeholder the project started with, deliberately: a deploy
 * that forgets the variable then publishes a sitemap that is obviously wrong,
 * rather than one that confidently points crawlers at the wrong host.
 */
const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://admissionhack.app").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/how-admission-works`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/universities`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/exams`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/countries`, changeFrequency: "monthly", priority: 0.8 },
    ...journeySteps.map((s) => ({
      url: `${base}/how-admission-works/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...universities.map((u) => ({
      url: `${base}/universities/${u.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...exams.map((e) => ({
      url: `${base}/exams/${e.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...countries.map((c) => ({
      url: `${base}/countries/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
