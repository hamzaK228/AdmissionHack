"use client";

import { supabase, BUCKET, T } from "./supabase";
import type { FolderId } from "@/data/document-folders";

/**
 * Files in cloud storage, so a counselor can actually open them.
 *
 * The local vault (IndexedDB) stays the student's source of truth and works
 * with no account at all. This layer mirrors a file into the `ah-documents`
 * bucket and records it in `ah_documents`, which is what makes it visible to a
 * counselor who has been accepted or who owns a group the student joined.
 *
 * Paths are `{user_id}/{folder}/{name}`. The first segment is what the storage
 * policy checks, so a file cannot be filed under someone else's id even if a
 * client tried — and the counselor's read permission follows the same first
 * segment, which is why the folder layout and the access rule agree.
 */

/** The free plan includes 1 GB of storage, so keep any single file well inside that. */
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

export interface CloudFile {
  id: string;
  name: string;
  folder: string;
  path: string;
  size: number;
  mime: string;
  uploadedAt: string;
}

export type CloudResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Storage keys reject nothing useful, but they do reject some things. */
const safeName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-80) || "file";

export async function uploadDocument(
  file: File,
  folder: FolderId,
): Promise<CloudResult<CloudFile>> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "no backend configured — this file stayed on your device" };

  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: "signed out — this file stayed on your device" };

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `${file.name} is ${(file.size / 1048576).toFixed(1)} MB; the limit per file is ${
        MAX_FILE_BYTES / 1048576
      } MB.`,
    };
  }

  // a short prefix keeps two files with the same name from colliding
  const path = `${uid}/${folder}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;

  const up = await sb.storage.from(BUCKET.documents).upload(path, file, { upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const { data, error } = await sb
    .from("ah_documents")
    .insert({
      user_id: uid,
      name: file.name,
      file_path: path,
      folder,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id, name, folder, file_path, size_bytes, mime_type, uploaded_at")
    .single();

  if (error) {
    // never leave an object orphaned in the bucket when the row was refused
    await sb.storage.from(BUCKET.documents).remove([path]);
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    value: {
      id: data.id,
      name: data.name,
      folder: data.folder,
      path: data.file_path,
      size: data.size_bytes ?? file.size,
      mime: data.mime_type ?? "",
      uploadedAt: data.uploaded_at,
    },
  };
}

/**
 * Documents for the signed-in user, or for the student a counselor is reading.
 * A counselor who is not linked to that student gets an empty list from RLS.
 */
export async function listCloudFiles(studentId?: string): Promise<CloudFile[]> {
  const sb = supabase();
  if (!sb) return [];

  let id = studentId;
  if (!id) {
    const { data } = await sb.auth.getUser();
    id = data.user?.id;
  }
  if (!id) return [];

  const { data } = await sb
    .from("ah_documents")
    .select("id, name, folder, file_path, size_bytes, mime_type, uploaded_at")
    .eq("user_id", id)
    .order("uploaded_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    folder: r.folder,
    path: r.file_path,
    size: r.size_bytes ?? 0,
    mime: r.mime_type ?? "",
    uploadedAt: r.uploaded_at,
  }));
}

/**
 * Removes the object and the row that describes it. Keyed on the path rather
 * than the row id, because the path is what the local vault remembers — and a
 * row left behind with its object gone reads to a counselor as a link that opens
 * nothing at all.
 */
export async function deleteCloudFile(path: string): Promise<CloudResult<true>> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "no backend configured" };
  await sb.storage.from(BUCKET.documents).remove([path]);
  const { error } = await sb.from(T.documents).delete().eq("file_path", path);
  return error ? { ok: false, error: error.message } : { ok: true, value: true };
}

/** A short-lived link to open a stored object, from whichever bucket it lives in. */
async function signedUrl(bucket: string, path: string, seconds: number): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.storage.from(bucket).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

/**
 * A short-lived link to open a vault document. Works for the owner and for a
 * counselor whose read access the storage policy grants, and expires on its own.
 */
export async function signedDocumentUrl(path: string, seconds = 3600): Promise<string | null> {
  return signedUrl(BUCKET.documents, path, seconds);
}

/** The same, for an official score report, which lives in its own bucket. */
export async function signedReportUrl(path: string, seconds = 3600): Promise<string | null> {
  return signedUrl(BUCKET.reports, path, seconds);
}

/* ── official exam reports ──────────────────────────────────────────────── */

export interface CloudReport {
  id: string;
  examId: string;
  name: string;
  path: string;
  size: number;
  mime: string;
  isVerified: boolean;
  verifiedAt: string | null;
  uploadedAt: string;
}

type ReportRow = {
  id: string;
  exam_id: string;
  file_name: string;
  file_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  is_verified: boolean;
  verified_at: string | null;
  uploaded_at: string;
};

const REPORT_COLS =
  "id, exam_id, file_name, file_path, size_bytes, mime_type, is_verified, verified_at, uploaded_at";

const toReport = (r: ReportRow): CloudReport => ({
  id: r.id,
  examId: r.exam_id,
  name: r.file_name,
  path: r.file_path,
  size: r.size_bytes ?? 0,
  mime: r.mime_type ?? "",
  isVerified: r.is_verified,
  verifiedAt: r.verified_at,
  uploadedAt: r.uploaded_at,
});

/**
 * The official report a student uploads for one exam.
 *
 * The row is immutable to its owner — the insert policy pins `is_verified` to
 * false, and the owner has no UPDATE policy at all — so the only way a report
 * becomes verified is a linked counselor saying so. That is the whole reason to
 * hold the original document, which is why the student's own client cannot set it.
 */
export async function uploadScoreReport(
  file: File,
  examId: string,
): Promise<CloudResult<CloudReport>> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "no backend configured — this file stayed on your device" };

  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: "signed out — this file stayed on your device" };

  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `${file.name} is ${(file.size / 1048576).toFixed(1)} MB; the limit per file is ${
        MAX_FILE_BYTES / 1048576
      } MB.`,
    };
  }

  const path = `${uid}/${safeName(examId)}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;
  const up = await sb.storage.from(BUCKET.reports).upload(path, file, { upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const { data, error } = await sb
    .from(T.reports)
    .insert({
      user_id: uid,
      exam_id: examId,
      file_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select(REPORT_COLS)
    .single();

  if (error) {
    await sb.storage.from(BUCKET.reports).remove([path]);
    return { ok: false, error: error.message };
  }
  return { ok: true, value: toReport(data as ReportRow) };
}

/** Reports for this user, or for the student a counselor is reading. */
export async function listCloudReports(studentId?: string): Promise<CloudReport[]> {
  const sb = supabase();
  if (!sb) return [];

  let id = studentId;
  if (!id) {
    const { data } = await sb.auth.getUser();
    id = data.user?.id;
  }
  if (!id) return [];

  const { data } = await sb
    .from(T.reports)
    .select(REPORT_COLS)
    .eq("user_id", id)
    .order("uploaded_at", { ascending: false });

  return (data ?? []).map((r) => toReport(r as ReportRow));
}

export async function deleteCloudReport(path: string): Promise<CloudResult<true>> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "no backend configured" };
  await sb.storage.from(BUCKET.reports).remove([path]);
  const { error } = await sb.from(T.reports).delete().eq("file_path", path);
  return error ? { ok: false, error: error.message } : { ok: true, value: true };
}

/**
 * A counselor's attestation. The database permits an update to exactly three
 * columns — is_verified, verified_by, verified_at — so this call cannot touch the
 * file name, the path, or any other part of the evidence it is vouching for.
 */
export async function setReportVerified(
  id: string,
  verified: boolean,
): Promise<CloudResult<true>> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { data: auth } = await sb.auth.getUser();
  const me = auth.user?.id;
  if (!me) return { ok: false, error: "not signed in" };

  const { error } = await sb
    .from(T.reports)
    .update({
      is_verified: verified,
      verified_by: verified ? me : null,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq("id", id);

  return error ? { ok: false, error: error.message } : { ok: true, value: true };
}
