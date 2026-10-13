"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOC_FOLDERS, type FolderId } from "@/data/document-folders";
import {
  addFiles,
  deleteFile,
  downloadStoredFile,
  fileIcon,
  formatSize,
  getAllFiles,
  markFileUploaded,
  type StoredFile,
} from "@/components/dashboard/doc-vault";
import { MAX_FILE_BYTES, deleteCloudFile, uploadDocument } from "@/lib/cloud-files";
import { useAuth } from "@/lib/use-auth";
import { Eyebrow } from "@/components/ui";

/**
 * The document workspace, as six folders.
 *
 * A file is always written to the local vault first, so the workspace works with
 * no account at all. When the student is signed in it is then mirrored into the
 * `ah-documents` bucket, and the row says which of the two states it is in —
 * "shared" or "on this device only". That distinction is the honest one: a
 * counselor cannot open a file that never left the browser, so the UI must not
 * imply otherwise.
 */
export function DocumentFolders() {
  const { user, configured } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [open, setOpen] = useState<FolderId | null>("tests");
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState<FolderId | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const target = useRef<FolderId | null>(null);

  const refresh = useCallback(async () => setFiles(await getAllFiles()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const inFolder = (f: FolderId) =>
    files.filter((x) => x.kind !== "score-report" && x.folder === f);

  const upload = async (folder: FolderId, list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(folder);
    setMsg(null);

    const created = await addFiles(list, { folder });
    await refresh();

    if (user) {
      let shared = 0;
      for (const f of created) {
        const res = await uploadDocument(new File([f.blob], f.name, { type: f.type }), folder);
        if (res.ok) {
          await markFileUploaded(f.id, res.value.path);
          shared++;
        } else {
          setMsg({ tone: "err", text: res.error });
        }
      }
      await refresh();
      if (shared > 0) {
        setMsg({
          tone: "ok",
          text: `${shared} file${shared > 1 ? "s" : ""} shared — your counselor can open ${
            shared > 1 ? "them" : "it"
          } now.`,
        });
      }
    } else {
      setMsg({
        tone: "ok",
        text: `${created.length} file${created.length > 1 ? "s" : ""} stored on this device.`,
      });
    }

    setBusy(null);
  };

  const remove = async (f: StoredFile) => {
    const removed = await deleteFile(f.id);
    if (removed?.cloudPath) await deleteCloudFile("", removed.cloudPath);
    await refresh();
    setMsg({ tone: "ok", text: `${f.name} removed.` });
  };

  const signInHint = configured && !user;

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-fog">
        Six folders, the same ones a counselor will ask you for. Drop a file into the folder it
        belongs to — {user ? "it is stored on this device and shared with the counselors you have accepted." : "it is stored on this device."}
      </p>
      {signInHint && (
        <p className="mt-3 max-w-2xl rounded-xl border border-amber/30 bg-amber/[0.05] px-4 py-3 text-xs leading-relaxed text-amber">
          You are signed out, so these files stay in this browser and <strong>no counselor can open
          them</strong>. Create an account and they will upload automatically instead.
        </p>
      )}
      {msg && (
        <p
          className={`mt-3 text-xs leading-relaxed ${
            msg.tone === "ok" ? "text-mint" : "text-amber"
          }`}
        >
          {msg.text}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const folder = target.current;
          if (folder) upload(folder, e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-6 space-y-3">
        {DOC_FOLDERS.map((folder) => {
          const contents = inFolder(folder.id);
          const bytes = contents.reduce((s, f) => s + f.size, 0);
          const shared = contents.filter((f) => f.cloudPath).length;
          const isOpen = open === folder.id;

          return (
            <section
              key={folder.id}
              className={`rounded-2xl border transition-[border-color,background-color] ${
                isOpen ? "border-lime/30 bg-panel/70" : "border-line bg-panel/40"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : folder.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span aria-hidden className="text-lg">
                  {folder.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-paper">{folder.label}</span>
                  <span className="text-[11px] text-dim">
                    {contents.length === 0
                      ? "empty"
                      : `${contents.length} file${contents.length > 1 ? "s" : ""} · ${formatSize(bytes)}${
                          shared > 0 ? ` · ${shared} shared` : ""
                        }`}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-xs text-dim">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-4 pt-4 pb-5">
                  <p className="text-sm leading-relaxed text-fog">{folder.blurb}</p>
                  <ul className="mt-3 space-y-1.5">
                    {folder.advice.map((a) => (
                      <li key={a} className="dash-item text-xs leading-relaxed text-dim">
                        {a}
                      </li>
                    ))}
                  </ul>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(folder.id);
                    }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(null);
                      upload(folder.id, e.dataTransfer.files);
                    }}
                    className={`mt-4 rounded-xl border-2 border-dashed px-4 py-3.5 text-center transition-colors ${
                      dragging === folder.id ? "border-lime/60 bg-lime/[0.06]" : "border-line2"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={busy === folder.id}
                      onClick={() => {
                        target.current = folder.id;
                        inputRef.current?.click();
                      }}
                      className="rounded-lg border border-line2 px-4 py-2 text-xs font-bold text-lime press-grow disabled:opacity-40"
                    >
                      {busy === folder.id ? "storing…" : "add files"}
                    </button>
                    <p className="mt-2 text-[10px] text-dim">
                      PDF · images · DOCX · up to {MAX_FILE_BYTES / 1048576} MB each
                    </p>
                  </div>

                  {contents.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {contents.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span aria-hidden>{fileIcon(f.name)}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold text-paper">
                                {f.name}
                              </span>
                              <span className="text-[10px] text-dim">
                                {formatSize(f.size)} ·{" "}
                                {new Date(f.addedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {" · "}
                                {f.cloudPath ? (
                                  <span className="text-mint">shared with your counselor</span>
                                ) : (
                                  <span className="text-amber">on this device only</span>
                                )}
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
                              onClick={() => remove(f)}
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
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-dim">
        <Eyebrow>where these go</Eyebrow>{" "}
        Each file is stored at <code className="text-lime">your-id/folder/name</code> in a private
        bucket. The database decides who may read that path on every request — a counselor who has
        not been accepted, and is not in a group you joined, reads nothing.
      </p>
    </div>
  );
}
