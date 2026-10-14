"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import {
  inviteStudent,
  listLinkedStudents,
  listMyInvites,
  pullStudentWorkspace,
  respondToInvite,
  type Invite,
  type LinkedStudent,
  type SyncPayload,
} from "@/lib/workspace-sync";
import { Eyebrow } from "@/components/ui";
import { CounselorGroups, StudentGroups } from "@/components/account/groups";
import {
  listCloudFiles,
  listCloudReports,
  setReportVerified,
  signedDocumentUrl,
  signedReportUrl,
  type CloudFile,
  type CloudReport,
} from "@/lib/cloud-files";
import { DOC_FOLDERS } from "@/data/document-folders";
import { universityBySlug } from "@/data/directory";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

const frameCls = "max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6";

/**
 * Counselor tab — both sides of the link.
 *
 * A counselor invites students by email and reviews the workspaces of the ones
 * who accepted. A student sees who has asked for access and grants or withdraws
 * it. Access itself is enforced in the database, not here: the RLS policy only
 * returns rows for an ACCEPTED link, so a counselor account that guesses an id
 * still reads nothing, and a revocation takes effect on the next query.
 */
export function CounselorView() {
  const { user, configured } = useAuth();

  if (!configured || !user) {
    return (
      <div className={frameCls}>
        <Eyebrow>counselor view</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          Sign in to connect a counselor account to a student workspace. Each student must accept
          before anything is visible — consent is enforced by the database, not by this screen.
        </p>
      </div>
    );
  }

  return user.role === "counselor" ? <CounselorRoster /> : <StudentConnections />;
}

/* ── the student's side ───────────────────────────────────────────────────── */

function StudentConnections() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => setInvites(await listMyInvites()), []);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const respond = async (linkId: string, accept: boolean) => {
    setBusy(linkId);
    const res = await respondToInvite(linkId, accept);
    setBusy(null);
    setMsg(
      res.ok
        ? accept
          ? "accepted — they can now see your workspace"
          : "declined — they can't see anything"
        : res.error,
    );
    refresh();
  };

  const pending = invites.filter((i) => i.status === "pending");
  const active = invites.filter((i) => i.status === "active");

  return (
    <div className="max-w-2xl">
      <Eyebrow>your counselors</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        A counselor can ask to review your workspace. Nothing is visible until you accept here, and
        you can withdraw access at any time.
      </p>
      {msg && <p className="mt-3 text-xs leading-relaxed text-amber">{msg}</p>}

      {pending.length > 0 && (
        <ul className="mt-6 space-y-2">
          {pending.map((i) => (
            <li
              key={i.linkId}
              className="rounded-xl border border-amber/40 bg-amber/5 px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-paper">
                    {i.counselorName}
                  </span>
                  <span className="text-[11px] text-dim">
                    asking to review your workspace · not yet visible
                  </span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busy === i.linkId}
                    onClick={() => respond(i.linkId, true)}
                    className="anim-glow rounded-lg bg-lime px-3.5 py-2 text-xs font-bold text-ink press-grow disabled:opacity-40"
                  >
                    {busy === i.linkId ? "…" : "accept"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === i.linkId}
                    onClick={() => respond(i.linkId, false)}
                    className="link-quiet rounded-lg border border-line2 px-3.5 py-2 text-xs font-bold text-fog disabled:opacity-40"
                  >
                    decline
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Eyebrow>with access</Eyebrow>
      <ul className="mt-4 space-y-2">
        {active.length === 0 && (
          <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-fog">
            nobody can see your workspace right now.
          </li>
        )}
        {active.map((i) => (
          <li
            key={i.linkId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel/70 px-4 py-3.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-paper">{i.counselorName}</span>
              <span className="text-[11px] text-mint">can see your workspace · read-only</span>
            </span>
            <button
              type="button"
              disabled={busy === i.linkId}
              onClick={() => respond(i.linkId, false)}
              className="shrink-0 rounded-lg border border-line2 px-3.5 py-2 text-xs font-bold text-fog transition-colors hover:border-amber/50 hover:text-amber disabled:opacity-40"
            >
              {busy === i.linkId ? "…" : "revoke access"}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-dim">
        A counselor who has not been accepted sees nothing at all — that is enforced by the database
        policy on every query, not by this screen.
      </p>

      <StudentGroups />
    </div>
  );
}

/* ── the counselor's side ─────────────────────────────────────────────────── */

function CounselorRoster() {
  const { user } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [openData, setOpenData] = useState<SyncPayload | null>(null);
  const [docs, setDocs] = useState<CloudFile[]>([]);
  const [reports, setReports] = useState<CloudReport[]>([]);

  const refresh = useCallback(async () => setStudents(await listLinkedStudents()), []);

  /** One student's workspace: the synced summary, plus their folders and files. */
  const openStudent = useCallback(async (studentId: string) => {
    setOpen(studentId);
    setOpenData(null);
    setDocs([]);
    setReports([]);
    const [workspace, files, cloudReports] = await Promise.all([
      pullStudentWorkspace(studentId),
      listCloudFiles(studentId),
      listCloudReports(studentId),
    ]);
    setOpenData(workspace);
    setDocs(files);
    setReports(cloudReports);
  }, []);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      {/* groups, then invite + roster */}
      <div>
        <CounselorGroups onOpenStudent={openStudent} />
        <hr className="my-10 border-line" />
        <Eyebrow>invite a student</Eyebrow>
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setBusy(true);
            const res = await inviteStudent(email);
            setBusy(false);
            setMsg(res.ok ? "invite sent — they'll see it when they sign in" : res.error);
            if (res.ok) setEmail("");
            refresh();
          }}
        >
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-lime px-4 py-2.5 text-xs font-bold text-ink press-grow disabled:opacity-40"
          >
            {busy ? "…" : "invite"}
          </button>
        </form>
        {msg && <p className="mt-2 text-xs leading-relaxed text-amber">{msg}</p>}

        <Eyebrow>my students</Eyebrow>
        <ul className="mt-4 space-y-2">
          {students.length === 0 && (
            <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-fog">
              no students linked yet — send the first invite above.
            </li>
          )}
          {students.map((s) => (
            <li key={s.linkId}>
              <button
                type="button"
                disabled={s.status !== "active" || !s.studentId}
                onClick={() => {
                  if (s.studentId) openStudent(s.studentId);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  s.status === "active"
                    ? "border-line bg-panel/70 hover:border-lime/50"
                    : "border-line/60 bg-panel/30"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-paper">
                      {s.fullName || s.email}
                    </span>
                    <span className="text-[11px] text-dim">{s.email}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${
                      s.status === "active"
                        ? "border-mint/40 bg-mint/10 text-mint"
                        : "border-amber/40 bg-amber/10 text-amber"
                    }`}
                  >
                    {s.status}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* the selected student's workspace, read-only */}
      <div>
        <Eyebrow>workspace</Eyebrow>
        {!open && (
          <p className="mt-4 rounded-xl border border-dashed border-line2 p-6 text-sm text-fog">
            select a student to review their profile, university lists, deadlines and scores. This
            view is read-only.
          </p>
        )}
        {open && !openData && <p className="mt-4 text-sm text-dim">loading…</p>}
        {open && openData && (
          <div className="mt-4 space-y-5">
            <div className="rounded-2xl border border-line bg-panel/70 p-5">
              <p className="text-lg font-bold text-paper">
                {openData.profile?.full_name || "unnamed applicant"}
              </p>
              <p className="mt-1 text-xs text-dim">
                {[
                  openData.profile?.level,
                  openData.profile?.country,
                  openData.profile?.intake,
                  openData.profile?.budget ? `$${openData.profile.budget.toLocaleString()}/yr` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <section>
              <Eyebrow>universities</Eyebrow>
              <ul className="mt-3 space-y-1.5">
                {openData.universities.length === 0 && (
                  <li className="text-sm text-dim">none shortlisted</li>
                )}
                {openData.universities.map((u) => {
                  const day = (iso: string) =>
                    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
                  const name = universityBySlug(u.slug)?.name ?? u.slug.replace(/-/g, " ");
                  return (
                    <li
                      key={u.slug}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-paper">{name}</span>
                        {(u.submittedOn || u.decidedOn) && (
                          <span className="text-[10px] text-dim">
                            {u.submittedOn && <>submitted {day(u.submittedOn)}</>}
                            {u.submittedOn && u.decidedOn && " · "}
                            {u.decidedOn && <>decided {day(u.decidedOn)}</>}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-lime">{u.tier}</span>
                        {u.status && <span className="text-[10px] text-fog">{u.status}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <Eyebrow>scores</Eyebrow>
              <ul className="mt-3 space-y-1.5">
                {Object.entries(openData.exams).length === 0 && (
                  <li className="text-sm text-dim">none recorded</li>
                )}
                {Object.entries(openData.exams).map(([k, v]) => (
                  <li key={k} className="rounded-lg border border-line bg-ink px-3 py-2 text-xs">
                    <span className="flex items-center justify-between">
                      <span className="uppercase text-fog">{k}</span>
                      <span className="font-bold text-lime">{v.overall ?? "—"}</span>
                    </span>
                    {v.sections && Object.keys(v.sections).length > 0 && (
                      <span className="mt-1 block text-[10px] tracking-wide text-dim">
                        {Object.entries(v.sections)
                          .map(([sk, sv]) => `${sk} ${sv}`)
                          .join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Eyebrow>portfolio</Eyebrow>
              <ul className="mt-3 space-y-2">
                {openData.portfolio.length === 0 && (
                  <li className="text-sm text-dim">
                    nothing added yet — activities, awards, work and volunteering appear here as the
                    student fills them in.
                  </li>
                )}
                {openData.portfolio.map((p, i) => (
                  <li key={i} className="rounded-lg border border-line bg-ink px-3 py-2.5 text-xs">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-lime/30 bg-lime/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime">
                        {p.kind}
                      </span>
                      <span className="font-bold text-paper">{p.title}</span>
                    </span>
                    {(p.org || p.years || p.hours) && (
                      <span className="mt-1 block text-[10px] text-dim">
                        {[p.org, p.years, p.hours ? `${p.hours} hrs/wk` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    {p.description && (
                      <span className="mt-1.5 block leading-relaxed text-fog">{p.description}</span>
                    )}
                  </li>
                ))}
              </ul>
              {openData.portfolio.length > 0 && (
                <p className="mt-2 text-[10px] leading-relaxed text-dim">
                  Read-only, like everything on this screen. Entries are the student&rsquo;s own writing —
                  the same words they will reuse in the application.
                </p>
              )}
            </section>

            <section>
              <Eyebrow>deadlines</Eyebrow>
              <ul className="mt-3 space-y-1.5">
                {openData.deadlines.length === 0 && (
                  <li className="text-sm text-dim">none tracked</li>
                )}
                {openData.deadlines.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                  >
                    <span className="truncate text-fog">{d.title}</span>
                    <span className="ml-3 shrink-0 text-paper">{d.date}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Eyebrow>documents</Eyebrow>
              <ul className="mt-3 space-y-3">
                {docs.length === 0 && (
                  <li className="text-sm text-dim">
                    nothing shared yet — the student's folders appear here as they upload.
                  </li>
                )}
                {DOC_FOLDERS.map((folder) => {
                  const inFolder = docs.filter((d) => d.folder === folder.id);
                  if (inFolder.length === 0) return null;
                  return (
                    <li key={folder.id}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-dim">
                        {folder.icon} {folder.label}
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {inFolder.map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={async () => {
                                const url = await signedDocumentUrl(d.path);
                                if (url) window.open(url, "_blank", "noopener");
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2 text-left transition-colors hover:border-lime/50"
                            >
                              <span className="truncate text-xs text-paper">{d.name}</span>
                              <span className="shrink-0 text-[10px] text-lime">open ↗</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <Eyebrow>official reports</Eyebrow>
              <ul className="mt-3 space-y-1.5">
                {reports.length === 0 && (
                  <li className="text-sm text-dim">
                    nothing uploaded — the scores above are unverified.
                  </li>
                )}
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-ink px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs text-paper">{r.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-dim">
                        {r.examId}
                        {r.isVerified && <span className="text-lime"> · verified</span>}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const url = await signedReportUrl(r.path);
                          if (url) window.open(url, "_blank", "noopener");
                        }}
                        className="rounded border border-line px-2 py-1 text-[10px] font-bold text-lime hover:border-lime/50"
                      >
                        open ↗
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await setReportVerified(r.id, !r.isVerified);
                          setReports(await listCloudReports(open ?? undefined));
                        }}
                        className={`rounded border px-2 py-1 text-[10px] font-bold transition-colors ${
                          r.isVerified
                            ? "border-line2 text-fog hover:border-amber/50 hover:text-amber"
                            : "border-lime/40 bg-lime/10 text-lime hover:bg-lime/20"
                        }`}
                      >
                        {r.isVerified ? "unverify" : "mark verified"}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {reports.length > 0 && (
                <p className="mt-2 text-[10px] leading-relaxed text-dim">
                  Compare the document with the scores above before marking it verified. The write is
                  restricted to the verification columns, so it cannot alter the file it attests to.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
