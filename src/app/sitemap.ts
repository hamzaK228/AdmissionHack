import type { MetadataRoute } from "next";
import { universities } from "@/data/universities";
import { countries } from "@/data/countries";
import { exams } from "@/data/exams";
import { journeySteps } from "@/data/journey";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://admissionhack.app"; // placeholder domain until brand/domain locked

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
