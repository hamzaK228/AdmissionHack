import type { Metadata } from "next";
import { SchemaExplorer } from "@/components/schema/schema-explorer";

export const metadata: Metadata = {
  title: "Schema · how the data is shaped · AdmissionHack",
  description:
    "The AdmissionHack database as a map and as tables: fifteen tables, their foreign keys, and the row policies that decide who may read whose workspace.",
};

/**
 * The schema, published.
 *
 * It is safe to publish because it is already public: the migrations live in the repository, and
 * a schema is not a secret — the policies are what protect the data, and those are enforced by
 * Postgres whatever this page says. What the page buys is that the consent model can be read in
 * one place by the person who has to reason about it.
 */
export default function SchemaPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <SchemaExplorer />
    </main>
  );
}
