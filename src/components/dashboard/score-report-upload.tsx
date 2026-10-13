"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addFiles,
  deleteFile,
  downloadStoredFile,
  fileIcon,
  filesForExam,
  formatSize,
  markFileUploaded,
  type StoredFile,
} from "@/components/dashboard/doc-vault";
import {
  MAX_FILE_BYTES,
  deleteCloudReport,
  listCloudReports,
  signedReportUrl,
  uploadScoreReport,
  type CloudReport,
} from "@/lib/cloud-files";
import { useAuth } from "@/lib/use-auth";

/**
 * Official score report, attached to one exam.
 *
 * The student uploads the real document their testing body issued — the IELTS
 * Test Report Form, the TOEFL report, the College Board report — so that what
 * they typed into the exams tab can be checked against the original. Signed in,
 * the file is mirrored into the private `ah-score-reports` bucket, where a
 * counselor who has been accepted (or who owns a group the student joined) can
 * open it and mark it verified.
 *
 * The student cannot verify their own report: the row is immutable to its owner
 * in the database, so an attestation can only come from a counselor. The UI says
 * that plainly instead of offering a control that would fail.
 */
export function ScoreReportUpload({ examId, examName }: { examId: string; examName: string }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [reports, setReports] = useState<CloudReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setFiles(await filesForExam(examId));
    setReports(await listCloudReports());
  }, [examId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // the verification lives on the cloud row, so pair it back by storage path
  const mine = reports.filter((r) => r.examId === examId);
  const byPath = new Map(mine.map((r) => [r.path, r]));
  // a report that exists in the account but not in this browser — a second
  // device, or after clearing site data. It must still be visible and openable.
  const inAccountOnly = mine.filter((r) => !files.some((f) => f.cloudPath === r.path));
  const verifiedCount = mine.filter((r) => r.isVerified).length;

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setMsg(null);
    const created = await addFiles(list, { kind: "score-report", examId });

    if (user) {
      let shared = 0;
      for (const f of created) {
        const res = await uploadScoreReport(new File([f.blob], f.name, { type: f.type }), examId);
        if (res.ok) {
          await markFileUploaded(f.id, res.value.path);
          shared++;
        } else {
          setMsg({ tone: "err", text: res.error });
        }
      }
      if (shared > 0) {
        setMsg({
          tone: "ok",
          text: `shared ${shared} report${shared > 1 ? "s" : ""} — your counselor can open ${
            shared > 1 ? "them" : "it"
          } now.`,
        });
      }
    } else {
      setMsg({ tone: "ok", text: "stored on this device. Sign in to share it with a counselor." });
    }

    await refresh();
    setBusy(false);
  };

  /** Share a report that was added before signing in. */
  const share = async (f: StoredFile) => {
    setBusy(true);
    setMsg(null);
    const res = await uploadScoreReport(new File([f.blob], f.name, { type: f.type }), examId);
    if (res.ok) {
      await markFileUploaded(f.id, res.value.path);
      await refresh();
      setMsg({ tone: "ok", text: `${f.name} shared — your counselor can open it now.` });
    } else {
      setMsg({ tone: "err", text: res.error });
    }
    setBusy(false);
  };

  const remove = async (f: StoredFile) => {
    const removed = await deleteFile(f.id);
    if (removed?.cloudPath) await deleteCloudReport(removed.cloudPath);
    await refresh();
  };

  const total = files.length + inAccountOnly.length;

  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-dim">
          official {examName} report
        </p>
        <span className="flex gap-2">
          {total > 0 && (
            <span className="rounded border border-mint/40 bg-mint/10 px-2 py-0.5 text-[10px] font-bold text-mint">
              {total} file{total > 1 ? "s" : ""} on record
            </span>
          )}
          {verifiedCount > 0 && (
            <span className="rounded border border-lime/50 bg-lime/10 px-2 py-0.5 text-[10px] font-bold text-lime">
              ✓ verified by a counselor
            </span>
          )}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={`mt-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragging ? "border-lime/60 bg-lime/[0.06]" : "border-line2"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-line2 px-4 py-2 text-xs font-bold text-lime press-grow disabled:opacity-40"
        >
          {busy ? "storing…" : total ? "+ add another" : "upload the PDF or a photo"}
        </button>
        <p className="mt-2 text-[10px] text-dim">
          {user
            ? `the document your test centre issued · up to ${MAX_FILE_BYTES / 1048576} MB per file`
            : "the document your test centre issued · stays on this device until you sign in"}
        </p>
      </div>

      {msg && (
        <p
          className={`mt-3 text-xs leading-relaxed ${
            msg.tone === "ok" ? "text-mint" : "text-amber"
          }`}
        >
          {msg.text}
        </p>
      )}

      {(files.length > 0 || inAccountOnly.length > 0) && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => {
            const report = f.cloudPath ? byPath.get(f.cloudPath) : undefined;
            return (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{fileIcon(f.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-paper">{f.name}</span>
                    <span className="text-[10px] text-dim">
                      {formatSize(f.size)} ·{" "}
                      {new Date(f.addedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {report?.isVerified ? (
                        <span className="text-lime">verified by your counselor</span>
                      ) : report ? (
                        <span className="text-mint">shared with your counselor</span>
                      ) : (
                        <span className="text-amber">on this device only</span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  {!f.cloudPath && user && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => share(f)}
                      aria-label={`Share ${f.name} with your counselor`}
                      title="share with your counselor"
                      className="rounded border border-line px-2 py-1 text-[10px] font-bold text-amber hover:border-lime/50 hover:text-lime disabled:opacity-40"
                    >
                      ↑
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadStoredFile(f)}
                    aria-label={`Download ${f.name}`}
                    className="rounded border border-line px-2 py-1 text-[10px] font-bold text-fog hover:border-lime/50 hover:text-lime"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f)}
                    aria-label={`Remove ${f.name}`}
                    className="rounded border border-line px-2 py-1 text-[10px] text-dim hover:border-red/50 hover:text-red"
                  >
                    ✕
                  </button>
                </span>
              </li>
            );
          })}

          {inAccountOnly.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel/60 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden>{fileIcon(r.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-paper">{r.name}</span>
                  <span className="text-[10px] text-dim">
                    {formatSize(r.size)} ·{" "}
                    {new Date(r.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {r.isVerified ? (
                      <span className="text-lime">verified by your counselor</span>
                    ) : (
                      <span className="text-mint">in your account</span>
                    )}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    const url = await signedReportUrl(r.path);
                    if (url) window.open(url, "_blank", "noopener");
                  }}
                  aria-label={`Open ${r.name}`}
                  className="rounded border border-line px-2 py-1 text-[10px] font-bold text-lime hover:border-lime/50"
                >
                  open ↗
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteCloudReport(r.path);
                    await refresh();
                  }}
                  aria-label={`Remove ${r.name}`}
                  className="rounded border border-line px-2 py-1 text-[10px] text-dim hover:border-red/50 hover:text-red"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && verifiedCount === 0 && (
        <p className="mt-3 text-[10px] leading-relaxed text-dim">
          A counselor marks a report verified after comparing it with the scores you entered. You
          cannot verify your own — the database refuses the write, which is the reason to hold the
          original document at all.
        </p>
      )}
    </div>
  );
}
