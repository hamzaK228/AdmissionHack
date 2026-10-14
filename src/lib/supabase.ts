"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase client — optional by design.
 *
 * The workspace is offline-first: local storage is authoritative and the app is
 * fully usable with no account. This client returns `null` when the project is
 * not configured, and every call site treats that as "run locally only", so the
 * site never breaks because a backend is missing.
 *
 * Every table is `ah_`-prefixed and every bucket `ah-`-prefixed, so the schema
 * could live in `public` even in a database shared with another app — no
 * collision, no custom schema wiring, and no per-query schema juggling.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// the db-schema option changes the client generics, so infer the type
type Client = ReturnType<typeof createClient<Database>>;
let client: Client | null = null;

export function supabase(): Client | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient<Database>(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

/** Table names live in one place so a schema rename is a one-line change. */
export const T = {
  profiles: "ah_profiles",
  exams: "ah_exam_results",
  reports: "ah_score_reports",
  universities: "ah_university_lists",
  deadlines: "ah_deadlines",
  portfolio: "ah_portfolio",
  documents: "ah_documents",
  checklist: "ah_checklist",
  links: "ah_counselor_links",
  posts: "ah_posts",
  comments: "ah_comments",
  boardReports: "ah_post_reports",
} as const;

/** Storage buckets, also namespaced. Paths are `{bucket}/{user_id}/{file}`. */
export const BUCKET = {
  documents: "ah-documents",
  reports: "ah-score-reports",
} as const;
