"use client";

import { supabase, T, isSupabaseConfigured } from "./supabase";
import type { AhPortfolioKind, AhTier } from "./database.types";

/**
 * Workspace sync.
 *
 * The local store (localStorage + IndexedDB) stays authoritative — the app is
 * fully usable signed-out and offline. Signing in turns on sync, which is a
 * whole-workspace replace in both directions rather than a field-level merge:
 * a single applicant's workspace is tens of rows, so last-write-wins on the
 * whole set is correct here, simple, and impossible to get subtly wrong. If
 * collaborative editing ever arrives, this is the layer that changes.
 */

export interface SyncPayload {
  profile: {
    full_name?: string;
    level?: string;
    country?: string;
    intake?: string;
    budget?: number;
    gpa?: string;
    gpa_scale?: string;
  } | null;
  /**
   * One entry per exam, keyed by exam id (`ielts` | `toefl` | `sat`). The
   * section breakdown rides along, so an SAT round trip keeps ebrw/math and an
   * IELTS round trip keeps L/R/W/S — the numbers a counselor actually checks an
   * official report against. Dropping them would make the cloud copy quietly
   * poorer than the local one.
   */
  exams: Record<string, { overall?: string; sections?: Record<string, string> }>;
  universities: { slug: string; tier: AhTier }[];
  deadlines: { title: string; date: string }[];
  portfolio: {
    kind: AhPortfolioKind;
    title: string;
    org?: string;
    description?: string;
    years?: string;
    hours?: string;
  }[];
  checklist: Record<string, boolean>;
}

export type SyncResult = { ok: true } | { ok: false; error: string };

const uid = async () => {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
};

/** Upload the local workspace to the cloud, replacing this user's rows. */
export async function pushWorkspace(payload: SyncPayload): Promise<SyncResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const id = await uid();
  if (!id) return { ok: false, error: "not signed in" };

  try {
    if (payload.profile) {
      const { error } = await sb
        .from(T.profiles)
        .upsert({ id, ...payload.profile }, { onConflict: "id" });
      if (error) throw error;
    }

    // exams: one row per exam id, with its section breakdown
    const examRows = Object.entries(payload.exams)
      .filter(([, v]) => v && (v.overall || Object.keys(v.sections ?? {}).length > 0))
      .map(([exam_id, v]) => ({
        user_id: id,
        exam_id,
        overall: v.overall ?? null,
        sections: v.sections ?? {},
      }));
    await sb.from(T.exams).delete().eq("user_id", id);
    if (examRows.length) {
      const { error } = await sb.from(T.exams).insert(examRows);
      if (error) throw error;
    }

    await sb.from(T.universities).delete().eq("user_id", id);
    if (payload.universities.length) {
      const { error } = await sb
        .from(T.universities)
        .insert(payload.universities.map((u) => ({ user_id: id, university_slug: u.slug, tier: u.tier })));
      if (error) throw error;
    }

    await sb.from(T.deadlines).delete().eq("user_id", id);
    if (payload.deadlines.length) {
      const { error } = await sb
        .from(T.deadlines)
        .insert(payload.deadlines.map((d) => ({ user_id: id, title: d.title, due_on: d.date })));
      if (error) throw error;
    }

    await sb.from(T.portfolio).delete().eq("user_id", id);
    if (payload.portfolio.length) {
      const { error } = await sb
        .from(T.portfolio)
        .insert(payload.portfolio.map((p) => ({ user_id: id, ...p })));
      if (error) throw error;
    }

    await sb.from(T.checklist).delete().eq("user_id", id);
    const checks = Object.entries(payload.checklist).map(([doc_key, done]) => ({
      user_id: id,
      doc_key,
      done,
    }));
    if (checks.length) {
      const { error } = await sb.from(T.checklist).insert(checks);
      if (error) throw error;
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const EXAM_COLS = "exam_id, overall, sections";

const readWorkspace = async (
  sb: NonNullable<ReturnType<typeof supabase>>,
  id: string,
): Promise<SyncPayload> => {
  const [profile, exams, unis, deadlines, portfolio, checklist] = await Promise.all([
    sb.from(T.profiles).select("*").eq("id", id).maybeSingle(),
    sb.from(T.exams).select(EXAM_COLS).eq("user_id", id),
    sb.from(T.universities).select("university_slug, tier").eq("user_id", id),
    sb.from(T.deadlines).select("title, due_on").eq("user_id", id),
    sb.from(T.portfolio).select("kind, title, org, description, years, hours").eq("user_id", id),
    sb.from(T.checklist).select("doc_key, done").eq("user_id", id),
  ]);

  return {
    profile: profile.data
      ? {
          full_name: profile.data.full_name ?? undefined,
          level: profile.data.level ?? undefined,
          country: profile.data.country ?? undefined,
          intake: profile.data.intake ?? undefined,
          budget: profile.data.budget ?? undefined,
          gpa: profile.data.gpa ?? undefined,
          gpa_scale: profile.data.gpa_scale ?? undefined,
        }
      : null,
    exams: Object.fromEntries(
      (exams.data ?? []).map((r) => [
        r.exam_id,
        {
          overall: r.overall ?? undefined,
          sections: (r.sections ?? {}) as Record<string, string>,
        },
      ]),
    ),
    universities: (unis.data ?? []).map((r) => ({ slug: r.university_slug, tier: r.tier })),
    deadlines: (deadlines.data ?? []).map((r) => ({ title: r.title, date: r.due_on })),
    portfolio: (portfolio.data ?? []).map((r) => ({
      kind: r.kind,
      title: r.title,
      org: r.org ?? undefined,
      description: r.description ?? undefined,
      years: r.years ?? undefined,
      hours: r.hours ?? undefined,
    })),
    checklist: Object.fromEntries((checklist.data ?? []).map((r) => [r.doc_key, r.done])),
  };
};

/** Download this user's workspace from the cloud. */
export async function pullWorkspace(): Promise<SyncPayload | null> {
  const sb = supabase();
  if (!sb) return null;
  const id = await uid();
  if (!id) return null;
  return readWorkspace(sb, id);
}

/* ── counselor linking ──────────────────────────────────────────────────── */

/** A counselor invites a student by email. The student accepts from their side. */
export async function inviteStudent(email: string): Promise<SyncResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const id = await uid();
  if (!id) return { ok: false, error: "not signed in" };
  const { error } = await sb
    .from(T.links)
    .insert({ counselor_id: id, student_email: email.trim().toLowerCase(), status: "pending" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export interface LinkedStudent {
  linkId: string;
  studentId: string | null;
  email: string;
  status: "pending" | "active" | "revoked";
  fullName: string;
}

/** Everyone this counselor can see, with the students who accepted. */
export async function listLinkedStudents(): Promise<LinkedStudent[]> {
  const sb = supabase();
  if (!sb) return [];
  const id = await uid();
  if (!id) return [];

  const { data: links } = await sb
    .from(T.links)
    .select("id, student_id, student_email, status")
    .eq("counselor_id", id);
  if (!links?.length) return [];

  const ids = links.map((l) => l.student_id).filter(Boolean) as string[];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await sb.from(T.profiles).select("id, full_name").in("id", ids);
    (profs ?? []).forEach((p) => names.set(p.id, p.full_name ?? ""));
  }

  return links.map((l) => ({
    linkId: l.id,
    studentId: l.student_id,
    email: l.student_email,
    status: l.status as LinkedStudent["status"],
    fullName: l.student_id ? names.get(l.student_id) ?? "" : "",
  }));
}

/** Read one student's workspace, as their linked counselor. */
export async function pullStudentWorkspace(studentId: string): Promise<SyncPayload | null> {
  const sb = supabase();
  if (!sb) return null;
  return readWorkspace(sb, studentId);
}

/* ── the student's side of a link ───────────────────────────────────────── */

export interface Invite {
  linkId: string;
  counselorId: string;
  counselorName: string;
  status: "pending" | "active" | "revoked";
}

/**
 * Invites addressed to the signed-in student's email, and the counselors they
 * have already accepted. RLS already restricts these rows to the caller's own
 * email or id; the names come from the `ah_profiles_inviter_read` policy, which
 * lets a student see exactly the counselors who invited them and no one else.
 */
export async function listMyInvites(): Promise<Invite[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data: auth } = await sb.auth.getUser();
  const me = auth.user;
  if (!me?.email) return [];

  const { data: links } = await sb
    .from(T.links)
    .select("id, counselor_id, status")
    .ilike("student_email", me.email);
  if (!links?.length) return [];

  const ids = [...new Set(links.map((l) => l.counselor_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await sb.from(T.profiles).select("id, full_name").in("id", ids);
    (profs ?? []).forEach((p) => names.set(p.id, p.full_name ?? ""));
  }

  return links
    .filter((l) => l.status !== "revoked")
    .map((l) => ({
      linkId: l.id,
      counselorId: l.counselor_id,
      counselorName: names.get(l.counselor_id) || "a counselor",
      status: l.status as Invite["status"],
    }));
}

/** Accept or decline an invite. Consent is the student's to give and withdraw. */
export async function respondToInvite(linkId: string, accept: boolean): Promise<SyncResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, error: "not signed in" };

  const { error } = await sb
    .from(T.links)
    .update({
      status: accept ? "active" : "revoked",
      student_id: auth.user.id,
      responded_at: new Date().toISOString(),
    })
    .eq("id", linkId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export { isSupabaseConfigured };
