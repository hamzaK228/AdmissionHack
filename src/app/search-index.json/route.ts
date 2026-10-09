import { NextResponse } from "next/server";
import { universities, exams, countries, journeySteps } from "@/data/all";
import { scholarships } from "@/data/scholarships";

export const dynamic = "force-static";

interface IndexEntry {
  type: "university" | "exam" | "country" | "scholarship" | "guide" | "page";
  label: string;
  sub: string;
  href: string;
}

export function GET() {
  const entries: IndexEntry[] = [];

  for (const u of universities) {
    entries.push({
      type: "university",
      label: u.name,
      sub: `${u.countryName}${u.qsRank != null ? ` · QS #${u.qsRank}` : ""}`,
      href: `/universities/${u.slug}`,
    });
  }
  for (const e of exams) {
    entries.push({ type: "exam", label: e.name, sub: `exam · ${e.administrator}`, href: `/exams/${e.id}` });
  }
  for (const c of countries) {
    entries.push({
      type: "country",
      label: `Study in ${c.name}`,
      sub: `country guide · ${c.languages[0]}`,
      href: `/countries/${c.slug}`,
    });
  }
  for (const s of scholarships) {
    entries.push({
      type: "scholarship",
      label: s.name,
      sub: `scholarship · ${s.host}`,
      href: "/scholarships",
    });
  }
  for (const j of journeySteps) {
    entries.push({
      type: "guide",
      label: `${j.order}. ${j.title}`,
      sub: "journey step",
      href: `/how-admission-works/${j.slug}`,
    });
  }
  entries.push(
    { type: "page", label: "Dashboard", sub: "your shortlist, deadlines and documents", href: "/dashboard" },
    { type: "page", label: "How admission works", sub: "the full 8-step journey", href: "/how-admission-works" },
    { type: "page", label: "University directory", sub: "1500+ institutions", href: "/universities" },
    { type: "page", label: "Exams hub", sub: "every admission exam decoded", href: "/exams" },
    { type: "page", label: "Scholarships hub", sub: "22 flagship programs", href: "/scholarships" },
    { type: "page", label: "Country guides", sub: "13 destinations", href: "/countries" },
  );

  return NextResponse.json(entries, {
    headers: { "cache-control": "public, max-age=86400" },
  });
}
