import type { Metadata } from "next";
import { universities } from "@/data/all";
import { ApplicationPack } from "@/components/dashboard/application-pack";

export const metadata: Metadata = {
  title: "Application pack · print or save the whole workspace",
  description:
    "One printable sheet: every application and where it stands, what is still outstanding, scores, dates, the document checklist and the portfolio.",
  robots: { index: false, follow: false },
};

/**
 * A slim index rather than the whole directory.
 *
 * The pack needs a name, a country and a rank per slug, and its component is a client component
 * reading the workspace out of localStorage — so the server hands it the three fields it uses
 * instead of pulling the 1,506-entry directory into the browser bundle. Same hand-off shape as
 * the dashboard's, and the same reason.
 */
const index: Record<string, { name: string; countryName: string; qsRank: number | null }> = {};
for (const u of universities) index[u.slug] = { name: u.name, countryName: u.countryName, qsRank: u.qsRank ?? null };

export default function PackPage() {
  return <ApplicationPack index={index} />;
}
