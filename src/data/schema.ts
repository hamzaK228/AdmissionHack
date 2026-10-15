/**
 * The AdmissionHack schema, as data.
 *
 * Written by hand from the live database — not scraped at runtime, because a page that reads
 * `information_schema` has to be served by something privileged, and this is a diagram of a
 * schema that rarely changes. The value here is the **shape of the consent model**, which is
 * one idea repeated: every personal table grants its owner everything and a linked counselor
 * exactly one read.
 *
 * Everything is prefixed `ah_` so this schema can share one Postgres with the other products
 * in the ecosystem, and every table here lives in the same database as SAThack's.
 */

export type Cluster = "hub" | "personal" | "access" | "community";

export interface SchemaColumn {
  name: string;
  type: string;
  /** part of the primary key */
  pk?: boolean;
  /** foreign key → the table it points at */
  fk?: string;
  note?: string;
}

export interface SchemaPolicy {
  name: string;
  /** SELECT / INSERT / UPDATE / DELETE / ALL */
  cmd: string;
  /**
   * The USING expression, absent for an INSERT-only policy — Postgres gives those nothing to
   * filter on, because there is no existing row to test; a new row is judged by WITH CHECK alone.
   */
  using?: string;
  check?: string;
  /** plain English, when the expression alone is not the point */
  note?: string;
}

export interface SchemaTable {
  name: string;
  purpose: string;
  cluster: Cluster;
  /** hand-placed, so the map reads the same way every time instead of settling differently */
  at: { x: number; y: number };
  columns: SchemaColumn[];
  policies: SchemaPolicy[];
}

export const CLUSTER_INFO: Record<Cluster, { label: string; blurb: string; tint: string }> = {
  hub: { label: "identity", blurb: "one row per person, and the role is here", tint: "#c9ff4a" },
  personal: { label: "the student's own data", blurb: "only the student writes; a linked counselor reads", tint: "#5eead4" },
  access: { label: "who may look", blurb: "consent lives here — a link, a class, a membership", tint: "#7dd3fc" },
  community: { label: "the public board", blurb: "shared by everyone, with author-only edits", tint: "#fbbf24" },
};

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: "ah_profiles",
    purpose: "One row per signed-in person. The role lives here and nowhere else.",
    cluster: "hub",
    at: { x: 520, y: 360 },
    columns: [
      { name: "id", type: "uuid", pk: true, note: "= auth.users.id" },
      { name: "role", type: "ah_role", note: "student · counselor · parent" },
      { name: "full_name", type: "text" },
      { name: "level", type: "text" },
      { name: "country", type: "text" },
      { name: "intake", type: "text" },
      { name: "budget", type: "int" },
      { name: "gpa", type: "text" },
      { name: "gpa_scale", type: "text" },
      { name: "referral_source", type: "text" },
    ],
    policies: [
      { name: "ah_profiles_own", cmd: "ALL", using: "id = auth.uid()", check: "id = auth.uid()" },
      { name: "ah_profiles_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(id)" },
      { name: "ah_profiles_inviter_read", cmd: "SELECT", using: "ah_is_my_counselor(id)", note: "a student can see who asked for access" },
      { name: "ah_profiles_group_owner_read", cmd: "SELECT", using: "ah_is_my_group_owner(id)" },
    ],
  },
  {
    name: "ah_counselor_links",
    purpose: "The consent record. A row exists before consent does; its status is the consent.",
    cluster: "access",
    at: { x: 800, y: 110 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "counselor_id", type: "uuid", fk: "ah_profiles", note: "the adult — a counselor or a parent" },
      { name: "student_email", type: "text", note: "how the invite finds them" },
      { name: "student_id", type: "uuid", fk: "ah_profiles", note: "set when they accept" },
      { name: "status", type: "text", note: "pending · active · revoked" },
      { name: "responded_at", type: "timestamptz" },
    ],
    policies: [
      { name: "ah_links_counselor", cmd: "ALL", using: "counselor_id = auth.uid()", check: "counselor_id = auth.uid()", note: "the adult owns the row — including a parent, whose id sits in counselor_id" },
      { name: "ah_links_student_read", cmd: "SELECT", using: "lower(student_email) = lower(jwt.email) OR student_id = auth.uid()", note: "the student can see the request before accepting it, which is the point" },
      { name: "ah_links_student_accept", cmd: "UPDATE", using: "same", check: "status in (pending, active, revoked) AND (student_id = auth.uid() OR student_id IS NULL)", note: "only the student writes the status — a counselor cannot consent on their behalf" },
    ],
  },
  {
    name: "ah_groups",
    purpose: "A class. The join code is the invitation, and entering it is the consent.",
    cluster: "access",
    at: { x: 1010, y: 110 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "owner_id", type: "uuid", fk: "ah_profiles" },
      { name: "name", type: "text" },
      { name: "join_code", type: "text", note: "generated by the database, never chosen" },
      { name: "note", type: "text" },
    ],
    policies: [
      { name: "ah_groups_owner", cmd: "ALL", using: "owner_id = auth.uid()", check: "owner_id = auth.uid()" },
      { name: "ah_groups_member_read", cmd: "SELECT", using: "ah_is_group_member(id)" },
    ],
  },
  {
    name: "ah_group_members",
    purpose: "Who is in a class. There is no INSERT policy at all.",
    cluster: "access",
    at: { x: 1010, y: 250 },
    columns: [
      { name: "group_id", type: "uuid", pk: true, fk: "ah_groups" },
      { name: "student_id", type: "uuid", pk: true, fk: "ah_profiles" },
      { name: "joined_at", type: "timestamptz" },
    ],
    policies: [
      { name: "ah_members_self_read", cmd: "SELECT", using: "student_id = auth.uid()" },
      { name: "ah_members_owner_read", cmd: "SELECT", using: "ah_owns_group(group_id)" },
      { name: "ah_members_self_leave", cmd: "DELETE", using: "student_id = auth.uid()", note: "no INSERT policy exists: membership can only be created by ah_join_group(), so nobody can be added to a class without asking" },
    ],
  },
  {
    name: "ah_university_lists",
    purpose: "The college list and the application tracker — one row per university, per student.",
    cluster: "personal",
    at: { x: 150, y: 640 },
    columns: [
      { name: "user_id", type: "uuid", pk: true, fk: "ah_profiles" },
      { name: "university_slug", type: "text", pk: true },
      { name: "tier", type: "ah_tier", note: "dream · target · safe" },
      { name: "status", type: "text", note: "planning → preparing → submitted → outcome" },
      { name: "submitted_on", type: "date", note: "stamped by the app, never typed" },
      { name: "decided_on", type: "date" },
    ],
    policies: [
      { name: "ah_university_lists_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_university_lists_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_checklist",
    purpose: "Document requirements, and each application's own steps.",
    cluster: "personal",
    at: { x: 150, y: 80 },
    columns: [
      { name: "user_id", type: "uuid", pk: true, fk: "ah_profiles" },
      { name: "doc_key", type: "text", pk: true, note: "a document id, or app:<slug>:<step>" },
      { name: "done", type: "boolean" },
    ],
    policies: [
      { name: "ah_checklist_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_checklist_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_documents",
    purpose: "The six upload folders. Files live in storage; this is the index.",
    cluster: "personal",
    at: { x: 150, y: 240 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: "ah_profiles" },
      { name: "name", type: "text" },
      { name: "file_path", type: "text" },
      { name: "folder", type: "text" },
      { name: "mime_type", type: "text" },
      { name: "size_bytes", type: "bigint" },
    ],
    policies: [
      { name: "ah_documents_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_documents_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_exam_results",
    purpose: "Scores, with the section breakdown intact.",
    cluster: "personal",
    at: { x: 150, y: 400 },
    columns: [
      { name: "user_id", type: "uuid", pk: true, fk: "ah_profiles" },
      { name: "exam_id", type: "text", pk: true, note: "ielts · toefl · sat …" },
      { name: "overall", type: "text" },
      { name: "sections", type: "jsonb" },
      { name: "taken_on", type: "date" },
    ],
    policies: [
      { name: "ah_exam_results_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_exam_results_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_score_reports",
    purpose: "The uploaded proof of a score — the one row a counselor may write to.",
    cluster: "personal",
    at: { x: 150, y: 480 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: "ah_profiles" },
      { name: "exam_id", type: "text" },
      { name: "file_path", type: "text" },
      { name: "is_verified", type: "boolean" },
      { name: "verified_by", type: "uuid", fk: "ah_profiles" },
      { name: "verified_at", type: "timestamptz" },
    ],
    policies: [
      { name: "ah_reports_own_select", cmd: "SELECT", using: "user_id = auth.uid()" },
      { name: "ah_reports_own_insert", cmd: "INSERT", check: "user_id = auth.uid() AND is_verified = false AND verified_by IS NULL AND verified_at IS NULL", note: "a student cannot mark their own report verified" },
      { name: "ah_reports_own_delete", cmd: "DELETE", using: "user_id = auth.uid()" },
      { name: "ah_reports_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
      { name: "ah_reports_counselor_verify", cmd: "UPDATE", using: "ah_is_counselor_of(user_id)", check: "ah_is_counselor_of(user_id)", note: "the only counselor write in the whole schema" },
    ],
  },
  {
    name: "ah_translations",
    purpose: "Sworn-translation state per document — the step a term is usually lost at.",
    cluster: "personal",
    at: { x: 150, y: 560 },
    columns: [
      { name: "user_id", type: "uuid", pk: true, fk: "ah_profiles" },
      { name: "doc_key", type: "text", pk: true },
      { name: "state", type: "text", note: "needs one · with translator · in hand" },
      { name: "translator", type: "text" },
      { name: "note", type: "text" },
    ],
    policies: [
      { name: "ah_translations_owner", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_translations_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_deadlines",
    purpose: "Dates the student is counting down to.",
    cluster: "personal",
    at: { x: 150, y: 160 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: "ah_profiles" },
      { name: "title", type: "text" },
      { name: "due_on", type: "date" },
    ],
    policies: [
      { name: "ah_deadlines_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_deadlines_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_portfolio",
    purpose: "Activities, awards, work and volunteering — the raw material of the application.",
    cluster: "personal",
    at: { x: 150, y: 320 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: "ah_profiles" },
      { name: "kind", type: "ah_portfolio_kind", note: "activity · award · work · volunteering" },
      { name: "title", type: "text" },
      { name: "org", type: "text" },
      { name: "description", type: "text" },
      { name: "years", type: "text" },
      { name: "hours", type: "text" },
    ],
    policies: [
      { name: "ah_portfolio_own", cmd: "ALL", using: "user_id = auth.uid()", check: "user_id = auth.uid()" },
      { name: "ah_portfolio_counselor_read", cmd: "SELECT", using: "ah_is_counselor_of(user_id)" },
    ],
  },
  {
    name: "ah_posts",
    purpose: "The community board. The only table anybody can read without signing in.",
    cluster: "community",
    at: { x: 800, y: 480 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "author_id", type: "uuid", fk: "ah_profiles" },
      { name: "author_name", type: "text", note: "denormalised, so a post renders without reading profiles" },
      { name: "topic", type: "text" },
      { name: "title", type: "text" },
      { name: "body", type: "text" },
      { name: "is_hidden", type: "boolean", note: "set by the operator, never by the app" },
    ],
    policies: [
      { name: "ah_posts_read", cmd: "SELECT", using: "NOT is_hidden OR author_id = auth.uid()" },
      { name: "ah_posts_insert", cmd: "INSERT", check: "author_id = auth.uid()" },
      { name: "ah_posts_delete", cmd: "DELETE", using: "author_id = auth.uid()", note: "no UPDATE policy: a post cannot be edited after it is read" },
    ],
  },
  {
    name: "ah_comments",
    purpose: "Replies on a post.",
    cluster: "community",
    at: { x: 1010, y: 480 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "post_id", type: "uuid", fk: "ah_posts" },
      { name: "author_id", type: "uuid", fk: "ah_profiles" },
      { name: "author_name", type: "text" },
      { name: "body", type: "text" },
      { name: "is_hidden", type: "boolean" },
    ],
    policies: [
      { name: "ah_comments_read", cmd: "SELECT", using: "NOT is_hidden OR author_id = auth.uid()" },
      { name: "ah_comments_insert", cmd: "INSERT", check: "author_id = auth.uid()" },
      { name: "ah_comments_delete", cmd: "DELETE", using: "author_id = auth.uid()" },
    ],
  },
  {
    name: "ah_post_reports",
    purpose: "A reader flagging a post or comment.",
    cluster: "community",
    at: { x: 1010, y: 600 },
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "reporter_id", type: "uuid", fk: "ah_profiles" },
      { name: "post_id", type: "uuid", fk: "ah_posts" },
      { name: "comment_id", type: "uuid", fk: "ah_comments" },
      { name: "reason", type: "text" },
    ],
    policies: [
      { name: "ah_reports_read", cmd: "SELECT", using: "reporter_id = auth.uid()", note: "a report is not public — only the operator sees the queue" },
      { name: "ah_reports_insert", cmd: "INSERT", check: "reporter_id = auth.uid()" },
    ],
  },
];

/**
 * The functions the policies lean on. Reading the policies is not possible without them, which
 * is why the whole consent model can be stated as one sentence: **every personal table asks the
 * same question, and this is where that question is answered.**
 */
export const SCHEMA_FUNCTIONS: { name: string; signature: string; blurb: string }[] = [
  { name: "ah_is_counselor_of", signature: "(target uuid) → boolean", blurb: "Is the caller an *accepted* link to this student? One function, called by every counselor-read policy — so revoking a link closes everything at once, and there is no second definition to keep in step." },
  { name: "ah_is_my_counselor", signature: "(target uuid) → boolean", blurb: "The reverse, so a student can read the name of the adult who asked for access." },
  { name: "ah_owns_group", signature: "(target uuid) → boolean", blurb: "Does the caller own this class?" },
  { name: "ah_is_group_member", signature: "(target uuid) → boolean", blurb: "Is the caller in this class?" },
  { name: "ah_is_my_group_owner", signature: "(target uuid) → boolean", blurb: "The reverse, so a member can see the counselor who owns the class they joined." },
  { name: "ah_ensure_profile", signature: "(full_name text, role ah_role) → ah_profiles", blurb: "Creates the profile row on first sign-in and never overwrites a role that is already set, so nobody can change their role by signing in again." },
  { name: "ah_join_group", signature: "(code text) → void", blurb: "The only way into a class. No INSERT policy exists on ah_group_members, so entering the code is the consent — enforced by the absence of a policy rather than by a check in the app." },
];
