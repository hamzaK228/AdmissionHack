import type { Metadata } from "next";
import { universities, exams } from "@/data/all";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { SlimUni } from "@/lib/match-engine";

export const metadata: Metadata = {
  title: "Dashboard — your university lists, document vault, exams and portfolio",
  description:
    "Your personal application workspace: Dream/Target/Safe university lists, a private document vault, exam results with destination checks, a Common App-style portfolio and deadline countdowns. No account needed — stored privately in your browser.",
};

export default function DashboardPage() {
  // slim index for the client — shortlist lookups without shipping full profiles
  const index: Record<string, SlimUni> = {};
  for (const u of universities) {
    index[u.slug] = {
      slug: u.slug,
      name: u.name,
      countryName: u.countryName,
      city: u.city,
      qsRank: u.qsRank ?? null,
      arwuRank: u.arwuRank ?? null,
      selectivity: u.selectivity,
      tuitionMin: u.tuitionUsdPerYear?.min ?? null,
      tuitionMax: u.tuitionUsdPerYear?.max ?? null,
      website: u.website,
    };
  }
  const ielts = exams.find((e) => e.id === "ielts")?.typicalMinimums ?? [];

  return <DashboardClient uniIndex={index} ieltsMinimums={ielts} />;
}
