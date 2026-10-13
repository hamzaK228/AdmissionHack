"use client";

import { useEffect, useRef, useState } from "react";
import { addFiles, deleteFile, downloadStoredFile, fileIcon, filesForExam, formatSize, type StoredFile } from "@/components/dashboard/doc-vault";

/**
 * Official score report, attached to one exam.
 *
 * The student uploads the real document their testing body issued — the IELTS
 * Test Report Form, the TOEFL score report, the College Board SAT report. It is
 * stored alongside the entered scores so the two can be checked against each
 * other (a counselor verifies the file against the numbers, which is the whole
 * point of holding the official document).
 *
 * Stored locally in IndexedDB today; the same component moves to Supabase
 * Storage unchanged once the project is provisioned — the file path convention
 * is already `{user_id}/{exam_id}/{filename}`.
 */
export function ScoreReportUpload({ examId, examName }: { examId: string; examName: string }) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => setFiles(await filesForExam(examId));
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    await addFiles(list, { kind: "score-report", examId });
    await refresh();
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-dim">
          official {examName} report
        </p>
        {files.length > 0 && (
          <span className="rounded border border-mint/40 bg-mint/10 px-2 py-0.5 text-[10px] font-bold text-mint">
            {files.length} file{files.length > 1 ? "s" : ""} on record
          </span>
        )}
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
          {busy ? "storing…" : files.length ? "+ add another" : "upload the PDF or a photo"}
        </button>
        <p className="mt-2 text-[10px] text-dim">
          the document your test centre issued — never leaves your device
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
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
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 gap-1.5">
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
                  onClick={async () => {
                    await deleteFile(f.id);
                    await refresh();
                  }}
                  aria-label={`Remove ${f.name}`}
                  className="rounded border border-line px-2 py-1 text-[10px] text-dim hover:border-red/50 hover:text-red"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
