import type { Metadata } from "next";
import { universities } from "@/data/all";
import { PageHero, DataNotice } from "@/components/ui";
import { UniversityExplorer } from "@/components/university-explorer";

export const metadata: Metadata = {
  title: "Browse 1500+ universities — filter by country, ranking and tuition",
  description:
    "The full QS-ranked universe of universities for international applicants: QS 2027 and ARWU 2025 positions, tuition, selectivity and accepted exams for curated schools. Filter by what matters to you.",
};

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="university directory"
        title="Find universities that fit you"
        description="Every QS-ranked university — 1500+ institutions — with verified QS 2027 and ARWU 2025 positions. Top schools carry full admission profiles; the rest are basic profiles until our data pipeline reaches them."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <UniversityExplorer items={universities} initialCountry={country ?? "all"} />
        <DataNotice className="mt-12" />
      </div>
    </>
  );
}
