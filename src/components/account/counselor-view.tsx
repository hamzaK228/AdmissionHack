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
import { CHECKLIST } from "@/data/document-checklist";
import { universityBySlug } from "@/data/directory";
import { isOpen, statusOf, statusRank, statusSpec, stepKey, stepProgress } from "@/lib/applications";
import { STATUS_TONE } from "@/components/dashboard/college-list";

/** The checklist's own wording, so a counselor reads the same words as the student. */
const docLabel = (key: string) =>
  CHECKLIST.find((c) => c.id === key)?.label.replace(/\s*\(.*\)$/, "") ?? key;

/** 2026-10-21 → 21 Oct 2026. An ISO string is how it is stored, not how it is read. */
const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/** Days from today, so "is this soon?" is a glance rather than arithmetic. */
const daysAway = (iso: string) =>
  Math.round((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86_400_000);

/** The student's own tier names, so nobody has to translate "dream" in their head. */
const TIER_LABEL: Record<string, string> = { dream: "Dream", target: "Target", safe: "Safe" };

/**
 * What a counselor should look at, derived from the workspace that is already loaded.
 *
 * The workspace below is seven sections deep, and a counselor opening it cold had to
 * read all of them to find out whether anything was wrong. This is the same data
 * reduced to the things that actually want a human: applications nobody has sent,
 * deadlines close enough to matter, a report nobody has checked, a translation still at
 * the translator, folders the student has not touched.
 *
 * Everything here is computed from data already in memory — no extra query, and nothing
 * that could disagree with the sections it summarises.
 */
const SOON_DAYS = 45;

function attentionFor(data: SyncPayload, docs: CloudFile[], reports: CloudReport[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const open = data.universities.filter((u) => isOpen(statusOf(u)));
  const soon = data.deadlines
    .map((d) => ({
      ...d,
      days: Math.round((new Date(d.date + "T00:00:00").getTime() - today.getTime()) / 86_400_000),
    }))
    .filter((d) => d.days >= 0 && d.days <= SOON_DAYS)
    .sort((a, b) => a.days - b.days);
  const unverified = reports.filter((r) => !r.isVerified).length;
  const translationsOut = Object.values(data.translations ?? {}).filter((t) => t.state !== "received").length;
  const untouched = DOC_FOLDERS.filter((f) => !docs.some((d) => d.folder === f.id));

  /**
   * The individual steps still unticked, per open application.
   *
   * The most actionable thing on this screen. "Three applications still to send" is a fact
   * a counselor can only ask about; "pay the application fee" is something they can chase.
   * The steps ride the same checklist the student ticks, so the two screens cannot drift
   * apart — and it is why the student's card and this panel name the same steps in the
   * same words.
   */
  const checks = data.checklist ?? {};
  const stepsOut: { uni: string; label: string }[] = [];
  for (const u of data.universities) {
    const st = statusOf(u);
    if (!isOpen(st)) continue;
    const uni = universityBySlug(u.slug)?.name ?? u.slug.replace(/-/g, " ");
    for (const step of stepProgress(u.slug, st, checks).steps) {
      if (!checks[stepKey(u.slug, step.id)]) stepsOut.push({ uni, label: step.label });
    }
  }
  return { open, soon, unverified, translationsOut, untouched, stepsOut };
}

/**
 * Reading order for a student's applications: **what needs chasing, first**.
 *
 * An application still being worked on outranks one already sent, which outranks one
 * already decided. Storage order is the order the student happened to add them in, which
 * tells a counselor nothing about where to look.
 */
const chaseOrder = (u: { status?: unknown }) => {
  const st = statusOf(u);
  return isOpen(st) ? statusRank(st) : 100 + statusRank(st);
};

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
  const { user, loading, configured } = useAuth();

  /**
   * Say "checking", never "sign in", while the session is still being read.
   *
   * `loading` first meant a signed-in counselor was shown "sign in to connect a counselor
   * account" for as long as the resolve took — a screen telling them to do the thing they
   * had already done.
   */
  if (configured && loading && !user) {
    return (
      <div className={frameCls}>
        <Eyebrow>counselor view</Eyebrow>
        <p className="mt-3 text-sm text-dim">
          <span className="anim-blink text-lime">▌</span> checking your session…
        </p>
      </div>
    );
  }

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

  /**
   * A parent is not a counselor and is certainly not a student.
   *
   * `parent` has been a role since the first migration, and every screen treated it as a
   * student: a parent signed up, chose "I'm supporting one", and was shown "a counselor can
   * ask to review your workspace" — a workspace they do not have — plus an invitation to join
   * a class group so someone could read *their* dashboard. Nobody ever saw a parent's point
   * of view, because there wasn't one.
   *
   * They now get the same read-only access a counselor gets, framed for a parent: one child
   * rather than a cohort, no classes, and no invitation to start filling in applications.
   */
  if (user.role === "counselor") return <RosterView mode="counselor" />;
  if (user.role === "parent") return <RosterView mode="parent" />;
  return <StudentConnections />;
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

function RosterView({ mode }: { mode: "counselor" | "parent" }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [openData, setOpenData] = useState<SyncPayload | null>(null);
  const [docs, setDocs] = useState<CloudFile[]>([]);
  const [reports, setReports] = useState<CloudReport[]>([]);
  /**
   * Whether the roster is still being fetched.
   *
   * Without this the panel claimed "nobody has accepted yet" for the several seconds the
   * two queries take — telling a parent they have no child sharing with them, and a
   * counselor they have no students, when both do. An empty state is a statement of fact;
   * it must not be shown while the answer is still unknown.
   */
  const [loadingRoster, setLoadingRoster] = useState(true);

  const refresh = useCallback(async () => {
    setStudents(await listLinkedStudents());
    setLoadingRoster(false);
  }, []);

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

  const attention = openData ? attentionFor(openData, docs, reports) : null;

  /**
   * Sorted for reading rather than for storage.
   *
   * The workspace is read top to bottom by someone deciding what to chase, so the order is
   * part of the point: the next deadline above the one after it, an unchecked score report
   * above a verified one, and the applications in `chaseOrder`.
   */
  const unis = openData ? [...openData.universities].sort((a, b) => chaseOrder(a) - chaseOrder(b)) : [];
  const deadlines = openData ? [...openData.deadlines].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const reportsSorted = [...reports].sort((a, b) => Number(a.isVerified) - Number(b.isVerified));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(260px,0.85fr)_1.4fr]">
      {/* groups, then invite + roster */}
      <div>
        <Eyebrow>{mode === "parent" ? "ask your child to share" : "invite a student"}</Eyebrow>
        {mode === "parent" && (
          <p className="mt-3 text-sm leading-relaxed text-fog">
            Enter your child&rsquo;s email and they will get a request. Nothing is visible until they
            accept it, and either of you can end it at any time.
          </p>
        )}
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
            placeholder={mode === "parent" ? "your child's email address" : "student@example.com"}
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

        <Eyebrow>{mode === "parent" ? "sharing with me" : "my students"}</Eyebrow>
        <ul className="mt-4 space-y-2">
          {loadingRoster && students.length === 0 && (
            <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-dim">
              <span className="anim-blink text-lime">▌</span>{" "}
              {mode === "parent" ? "checking who is sharing with you…" : "checking your students…"}
            </li>
          )}
          {!loadingRoster && students.length === 0 && (
            <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-fog">
              {mode === "parent"
                ? "nobody has accepted yet — send the request above and your child will see it when they sign in."
                : "no students linked yet — send the first invite above."}
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
                className={`w-full rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  open === s.studentId
                    ? "border-lime/60 bg-lime/[0.06]"
                    : s.status === "active"
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

        {/* The class guide is the first thing a counselor used to meet — four paragraphs of
            instruction above the students they came to look at. It is genuinely useful, so
            it is folded away rather than deleted, and the roster leads. */}
        {mode === "counselor" && (
          <details className="mt-8 rounded-2xl border border-line bg-panel/50 p-4">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-dim">
              how a class works
            </summary>
            <div className="mt-4">
              <CounselorGroups onOpenStudent={openStudent} />
            </div>
          </details>
        )}
      </div>

      {/* the selected student's workspace, read-only */}
      <div>
        <Eyebrow>workspace</Eyebrow>
        {!open && (
          <p className="mt-4 rounded-xl border border-dashed border-line2 p-6 text-sm text-fog">
            {mode === "parent"
              ? "Choose your child above to see their progress: what is still to do, the next deadline, and where each application stands. Read-only — you cannot change anything here, and neither can we."
              : "select a student to review their profile, university lists, deadlines and scores. This view is read-only."}
          </p>
        )}
        {open && !openData && <p className="mt-4 text-sm text-dim">loading…</p>}
        {open && openData && (
          <div className="mt-4 space-y-4">
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

            {attention && (
              <div className="rounded-2xl border border-lime/30 bg-lime/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-lime">needs attention</p>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed">
                  {attention.open.length > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">
                        {attention.open.length} application{attention.open.length === 1 ? "" : "s"}
                      </span>{" "}
                      still to send —{" "}
                      {attention.open
                        .slice(0, 3)
                        .map((u) => universityBySlug(u.slug)?.name ?? u.slug.replace(/-/g, " "))
                        .join(", ")}
                      {attention.open.length > 3 && ` and ${attention.open.length - 3} more`}
                    </li>
                  )}
                  {attention.soon.length > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">
                        {attention.soon[0].days === 0
                          ? "Due today"
                          : attention.soon[0].days === 1
                            ? "Due tomorrow"
                            : `Due in ${attention.soon[0].days} days`}
                      </span>{" "}
                      — {attention.soon[0].title}
                      {attention.soon.length > 1 && `, and ${attention.soon.length - 1} more within ${SOON_DAYS} days`}
                    </li>
                  )}
                  {attention.unverified > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">
                        {attention.unverified} score report{attention.unverified === 1 ? "" : "s"}
                      </span>{" "}
                      not checked — the scores below stay unverified until you compare the document.
                    </li>
                  )}
                  {attention.translationsOut > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">
                        {attention.translationsOut} translation{attention.translationsOut === 1 ? "" : "s"}
                      </span>{" "}
                      not in hand yet — worth chasing before an application looks complete on paper.
                    </li>
                  )}
                  {attention.stepsOut.length > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">
                        {attention.stepsOut.length} step{attention.stepsOut.length === 1 ? "" : "s"} still unticked
                      </span>{" "}
                      — next up:{" "}
                      {attention.stepsOut
                        .slice(0, 2)
                        .map((step) => `${step.uni}: ${step.label}`)
                        .join(" · ")}
                      {attention.stepsOut.length > 2 && `, and ${attention.stepsOut.length - 2} more`}
                    </li>
                  )}
                  {attention.untouched.length > 0 && (
                    <li className="text-fog">
                      <span className="font-bold text-paper">Folders with nothing in them:</span>{" "}
                      {attention.untouched.map((f) => f.label).join(", ")}
                    </li>
                  )}
                  {attention.open.length === 0 &&
                    attention.soon.length === 0 &&
                    attention.unverified === 0 &&
                    attention.translationsOut === 0 &&
                    attention.untouched.length === 0 &&
                    attention.stepsOut.length === 0 && (
                      <li className="text-fog">
                        Nothing outstanding — every application has been sent, nothing is due in the next{" "}
                        {SOON_DAYS} days, and every report has been checked.
                      </li>
                    )}
                </ul>
              </div>
            )}

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>universities</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{openData.universities.length}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {openData.universities.length === 0 && (
                  <li className="text-sm text-dim">none shortlisted</li>
                )}
                {unis.map((u) => {
                  const day = (iso: string) =>
                    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
                  const name = universityBySlug(u.slug)?.name ?? u.slug.replace(/-/g, " ");
                  const st = statusOf(u);
                  const spec = statusSpec(st);
                  const checks = openData.checklist ?? {};
                  const { steps: uSteps, done: uDone, total: uTotal } = stepProgress(u.slug, st, checks);
                  const left = uSteps.filter((step) => !checks[stepKey(u.slug, step.id)]);
                  return (
                    <li
                      key={u.slug}
                      className={`flex items-center justify-between gap-3 rounded-lg border bg-ink px-3 py-2 text-xs ${STATUS_TONE[spec.tone].edge}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-paper">{name}</span>
                        <span className="text-[10px] text-dim">
                          {TIER_LABEL[u.tier] ?? u.tier}
                          {(u.submittedOn || u.decidedOn) && " · "}
                          {u.submittedOn && <>sent {day(u.submittedOn)}</>}
                          {u.submittedOn && u.decidedOn && " · "}
                          {u.decidedOn && <>decided {day(u.decidedOn)}</>}
                        </span>
                        {/* what is outstanding, in the student's own step wording */}
                        {left.length > 0 ? (
                          <span className="mt-0.5 block text-[10px] leading-snug text-amber">
                            {uDone}/{uTotal} steps · still: {left[0].label}
                            {left.length > 1 && ` +${left.length - 1}`}
                          </span>
                        ) : (
                          uTotal > 0 && (
                            <span className="mt-0.5 block text-[10px] leading-snug text-mint">
                              all {uTotal} steps ticked
                            </span>
                          )
                        )}
                      </span>
                      {/* the student's own status vocabulary, and the same colours their
                          college list uses, so the two screens can be read together */}
                      <span className={`shrink-0 text-right text-[11px] font-bold ${STATUS_TONE[spec.tone].text}`}>
                        {spec.short}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>scores</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{Object.keys(openData.exams).length}</span>
              </div>
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

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>translations</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{Object.keys(openData.translations ?? {}).length}</span>
              </div>
              {Object.keys(openData.translations ?? {}).length === 0 ? (
                <p className="mt-3 text-sm text-dim">
                  nothing tracked — sworn translations are only needed when a document is not in the language
                  of the course.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {Object.entries(openData.translations ?? {}).map(([doc, t]) => (
                    <li
                      key={doc}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-paper">{docLabel(doc)}</span>
                        {(t.translator || t.note) && (
                          <span className="text-[10px] text-dim">
                            {[t.translator, t.note].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 font-bold ${
                          t.state === "received"
                            ? "text-mint"
                            : t.state === "ordered"
                              ? "text-lime"
                              : "text-amber"
                        }`}
                      >
                        {t.state === "received" ? "in hand" : t.state === "ordered" ? "with translator" : "needs one"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-dim">
                Read-only. This is the step where a term is usually lost, so it is worth chasing before an
                application looks complete on paper.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>portfolio</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{openData.portfolio.length}</span>
              </div>
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

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>deadlines</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{openData.deadlines.length}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {openData.deadlines.length === 0 && (
                  <li className="text-sm text-dim">none tracked</li>
                )}
                {deadlines.map((d) => {
                  const days = daysAway(d.date);
                  // a date that has passed says so, rather than showing a bare date and
                  // leaving the reader to work out that it is behind them
                  const soon = days >= 0 && days <= 7;
                  return (
                    <li
                      key={d.title}
                      className={`flex items-center justify-between gap-3 rounded-lg border bg-ink px-3 py-2 text-xs ${
                        soon ? "border-amber/40" : "border-line"
                      }`}
                    >
                      <span className="min-w-0 truncate text-fog">{d.title}</span>
                      <span className="shrink-0 text-right">
                        <span className={soon ? "text-amber" : "text-paper"}>{prettyDate(d.date)}</span>
                        <span className={`ml-2 ${soon ? "text-amber" : "text-dim"}`}>
                          {days < 0 ? `${-days}d ago` : days === 0 ? "today" : `in ${days}d`}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>documents</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{docs.length}</span>
              </div>
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

            <section className="rounded-2xl border border-line bg-panel/70 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <Eyebrow>official reports</Eyebrow>
                <span className="text-[11px] font-bold text-dim">{reports.length}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {reports.length === 0 && (
                  <li className="text-sm text-dim">
                    nothing uploaded — the scores above are unverified.
                  </li>
                )}
                {reportsSorted.map((r) => (
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
