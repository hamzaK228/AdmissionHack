"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { inviteStudent, listLinkedStudents, pullStudentWorkspace, type LinkedStudent, type SyncPayload } from "@/lib/workspace-sync";
import { Eyebrow } from "@/components/ui";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

/**
 * Counselor view — every student who accepted the invite, side by side.
 *
 * Access is enforced in the database, not here: the RLS policy only returns rows
 * for students with an accepted link, so a counselor account that guesses an id
 * still reads nothing. This UI just presents what the policy allows through.
 */
export function CounselorView() {
  const { user, configured } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [openData, setOpenData] = useState<SyncPayload | null>(null);

  const refresh = useCallback(async () => setStudents(await listLinkedStudents()), []);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  if (!configured || !user) {
    return (
      <div className="max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
        <Eyebrow>counselor view</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          Sign in with a counselor account to invite students and review their workspaces here.
          Each student must accept before you can see anything — consent is enforced by the
          database, not by this screen.
        </p>
      </div>
    );
  }

  if (user.role !== "counselor") {
    return (
      <div className="max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
        <Eyebrow>counselor view</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          Your account is a <span className="text-lime">{user.role}</span> account. The counselor
          view appears for accounts created with the counselor role.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      {/* invite + roster */}
      <div>
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
                onClick={async () => {
                  if (!s.studentId) return;
                  setOpen(s.linkId);
                  setOpenData(null);
                  setOpenData(await pullStudentWorkspace(s.studentId));
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
                {openData.universities.map((u) => (
                  <li
                    key={u.slug}
                    className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                  >
                    <span className="truncate text-paper">{u.slug.replace(/-/g, " ")}</span>
                    <span className="ml-3 shrink-0 text-lime">{u.tier}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Eyebrow>scores</Eyebrow>
              <ul className="mt-3 space-y-1.5">
                {Object.entries(openData.exams).length === 0 && (
                  <li className="text-sm text-dim">none recorded</li>
                )}
                {Object.entries(openData.exams).map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs"
                  >
                    <span className="uppercase text-fog">{k}</span>
                    <span className="font-bold text-lime">{v}</span>
                  </li>
                ))}
              </ul>
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
          </div>
        )}
      </div>
    </div>
  );
}
