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
  exams: Record<string, string>;
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

    // exams: one row per exam id
    const examRows = Object.entries(payload.exams)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([exam_id, overall]) => ({ user_id: id, exam_id, overall: String(overall) }));
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

/** Download this user's workspace from the cloud. */
export async function pullWorkspace(): Promise<SyncPayload | null> {
  const sb = supabase();
  if (!sb) return null;
  const id = await uid();
  if (!id) return null;

  const [profile, exams, unis, deadlines, portfolio, checklist] = await Promise.all([
    sb.from(T.profiles).select("*").eq("id", id).maybeSingle(),
    sb.from(T.exams).select("exam_id, overall").eq("user_id", id),
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
    exams: Object.fromEntries((exams.data ?? []).map((r) => [r.exam_id, r.overall ?? ""])),
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
    status: l.status,
    fullName: l.student_id ? names.get(l.student_id) ?? "" : "",
  }));
}

/** Read one student's workspace, as their linked counselor. */
export async function pullStudentWorkspace(studentId: string): Promise<SyncPayload | null> {
  const sb = supabase();
  if (!sb) return null;

  const [profile, exams, unis, deadlines, portfolio, checklist] = await Promise.all([
    sb.from(T.profiles).select("*").eq("id", studentId).maybeSingle(),
    sb.from(T.exams).select("exam_id, overall").eq("user_id", studentId),
    sb.from(T.universities).select("university_slug, tier").eq("user_id", studentId),
    sb.from(T.deadlines).select("title, due_on").eq("user_id", studentId),
    sb.from(T.portfolio).select("kind, title, org, description, years, hours").eq("user_id", studentId),
    sb.from(T.checklist).select("doc_key, done").eq("user_id", studentId),
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
    exams: Object.fromEntries((exams.data ?? []).map((r) => [r.exam_id, r.overall ?? ""])),
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
}

export { isSupabaseConfigured };
