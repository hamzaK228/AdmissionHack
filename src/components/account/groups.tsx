"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  classSnapshots,
  createGroup,
  daysUntil,
  joinGroup,
  leaveGroup,
  listJoinedGroups,
  listMyGroups,
  type Group,
  type StudentSnapshot,
} from "@/lib/groups";
import { Eyebrow } from "@/components/ui";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

/**
 * Groups, from both sides.
 *
 * The student panel is deliberately explicit about what joining costs: a code
 * is consent to open everything in the dashboard, so the screen says that in
 * plain words rather than implying it.
 */

/* ── counselor ────────────────────────────────────────────────────────────── */

export function CounselorGroups({ onOpenStudent }: { onOpenStudent: (studentId: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<Map<string, StudentSnapshot> | null>(null);
  const [loadingSnaps, setLoadingSnaps] = useState(false);

  const refresh = useCallback(async () => setGroups(await listMyGroups()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMsg("copy failed — select the code and copy it by hand");
    }
  };

  /** The message a counselor actually needs: a link, a code, and what joining costs. */
  const copyInvite = async (g: Group) => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const text = [
      `Join our AdmissionHack class “${g.name}”.`,
      "",
      `1. Create a free account: ${origin}/dashboard`,
      `2. Open the counselor tab and enter this code: ${g.joinCode}`,
      "",
      "Everything you put in your dashboard is private to you. I can only read it after you join, and you can leave the class at any time.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`invite:${g.id}`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMsg("copy failed — select the code and copy it by hand");
    }
  };

  const openGroup = async (g: Group) => {
    if (open === g.id) {
      setOpen(null);
      return;
    }
    setOpen(g.id);
    setSnaps(null);
    if (g.members.length === 0) return;
    setLoadingSnaps(true);
    setSnaps(await classSnapshots(g.members.map((m) => m.studentId)));
    setLoadingSnaps(false);
  };

  return (
    <div>
      <div className="rounded-2xl border border-line bg-panel/70 p-5">
        <Eyebrow>how a class works</Eyebrow>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-fog">
          <li>
            <span className="font-bold text-paper">1 · Create the class.</span> Name it after the cohort
            (“Grade 12 · Group A”). The database generates the join code — you never choose or type one.
          </li>
          <li>
            <span className="font-bold text-paper">2 · Send the code.</span> “Copy invite” gives you a
            ready-made message with the link and the code, to paste into a class chat.
          </li>
          <li>
            <span className="font-bold text-paper">3 · Students join themselves.</span> Entering the code
            <em> is</em> the consent: there is no way to add a student who has not asked, and nothing is
            visible until they do.
          </li>
          <li>
            <span className="font-bold text-paper">4 · Read the class at a glance.</span> Open a class to
            see every student&rsquo;s universities, documents, portfolio and next deadline side by side —
            then open one to read the whole workspace.
          </li>
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-dim">
          You get read-only access, and only to students who joined this class. A student can leave at any
          time, and the moment they do every row and every file goes dark — enforced by the database, not
          by this screen.
        </p>
        <Link
          href="/counselors"
          className="mt-3 inline-block text-xs font-bold text-lime/80 transition-colors hover:text-lime"
        >
          → the full counselor guide, and what to send your students
        </Link>
      </div>

      <Eyebrow>create a class</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        A class is a list your students join themselves. Once they do, you can read their dashboard —
        folders, files, lists, scores and portfolio — and see the whole cohort side by side.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          const res = await createGroup(name);
          setBusy(false);
          if (res.ok) {
            setName("");
            setMsg(`“${res.value.name}” created — share code ${res.value.joinCode}`);
            refresh();
          } else {
            setMsg(res.error);
          }
        }}
      >
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Grade 12 — Group A"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-lime px-4 py-2.5 text-xs font-bold text-ink press-grow disabled:opacity-40"
        >
          {busy ? "…" : "create"}
        </button>
      </form>
      {msg && <p className="mt-2 text-xs leading-relaxed text-amber">{msg}</p>}

      <Eyebrow>my groups</Eyebrow>
      <ul className="mt-4 space-y-2">
        {groups.length === 0 && (
          <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-fog">
            no groups yet — create one above and give the code to your students.
          </li>
        )}
        {groups.map((g) => {
          const isOpen = open === g.id;
          return (
            <li key={g.id} className="rounded-xl border border-line bg-panel/70">
              <button
                type="button"
                onClick={() => openGroup(g)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-paper">{g.name}</span>
                  <span className="text-[11px] text-dim">
                    {g.members.length} student{g.members.length === 1 ? "" : "s"} joined
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-xs text-dim">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-4 pt-3 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-lime/30 bg-lime/[0.06] px-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-dim">
                        join code
                      </span>
                      <span className="block font-mono text-lg font-bold tracking-[0.2em] text-lime">
                        {g.joinCode}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => copy(g.joinCode)}
                        className="rounded-lg border border-line2 px-3 py-1.5 text-[11px] font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
                      >
                        {copied === g.joinCode ? "copied ✓" : "copy code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyInvite(g)}
                        className="rounded-lg border border-lime/40 bg-lime/10 px-3 py-1.5 text-[11px] font-bold text-lime transition-colors hover:bg-lime/20"
                      >
                        {copied === `invite:${g.id}` ? "copied ✓" : "copy invite"}
                      </button>
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-dim">
                    Students enter the code in their own dashboard, on the counselor tab. “Copy invite”
                    writes the whole message for you — link, code and what joining means.
                  </p>

                  {g.members.length === 0 && (
                    <p className="mt-3 rounded-lg border border-dashed border-line2 p-4 text-xs text-dim">
                      nobody has joined this class yet. Send the invite code and they will appear here.
                    </p>
                  )}

                  {g.members.length > 0 && loadingSnaps && (
                    <p className="mt-3 text-xs text-dim">reading the class…</p>
                  )}

                  {g.members.length > 0 && !loadingSnaps && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-dim">
                            <th className="pb-2 pr-3 font-bold">student</th>
                            <th className="pb-2 pr-3 font-bold">unis</th>
                            <th className="pb-2 pr-3 font-bold">docs</th>
                            <th className="pb-2 pr-3 font-bold">portfolio</th>
                            <th className="pb-2 pr-3 font-bold">next deadline</th>
                            <th className="pb-2 font-bold" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {g.members.map((m) => {
                            const s = snaps?.get(m.studentId);
                            const dl = s?.nextDeadline;
                            const days = dl ? daysUntil(dl.date) : null;
                            return (
                              <tr key={m.studentId}>
                                <td className="py-2 pr-3 align-top">
                                  <span className="block font-bold text-paper">{s?.name ?? m.name}</span>
                                  {s && s.exams.length > 0 && (
                                    <span className="text-[10px] text-dim">{s.exams.join(" · ")}</span>
                                  )}
                                </td>
                                <td className="py-2 pr-3 align-top text-fog">{s?.universities ?? "—"}</td>
                                <td className="py-2 pr-3 align-top">
                                  {s ? (
                                    <span
                                      className={s.docsDone === s.docsTotal ? "font-bold text-mint" : "text-fog"}
                                    >
                                      {s.docsDone}/{s.docsTotal}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2 pr-3 align-top text-fog">{s?.portfolio ?? "—"}</td>
                                <td className="py-2 pr-3 align-top">
                                  {dl ? (
                                    <span className={days !== null && days <= 30 ? "text-red" : "text-fog"}>
                                      {dl.title.length > 32 ? `${dl.title.slice(0, 32)}…` : dl.title}
                                      {days !== null && <span className="text-dim"> · {days}d</span>}
                                    </span>
                                  ) : (
                                    <span className="text-dim">none tracked</span>
                                  )}
                                </td>
                                <td className="py-2 align-top text-right">
                                  <button
                                    type="button"
                                    onClick={() => onOpenStudent(m.studentId)}
                                    className="rounded border border-line px-2 py-1 text-[10px] font-bold text-lime transition-colors hover:border-lime/50"
                                  >
                                    open
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── student ──────────────────────────────────────────────────────────────── */

export function StudentGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const refresh = useCallback(async () => setGroups(await listJoinedGroups()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mt-10 max-w-2xl">
      <Eyebrow>join a group</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        Has a counselor given you a code? Enter it to join their group. Joining lets them read
        everything in this dashboard — your folders and files, lists, deadlines and scores — so only
        join a group you actually belong to.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!code.trim()) return;
          setBusy(true);
          setMsg(null);
          const res = await joinGroup(code);
          setBusy(false);
          if (res.ok) {
            setCode("");
            setMsg({ tone: "ok", text: `joined ${res.value.name}` });
            refresh();
          } else {
            setMsg({ tone: "err", text: res.error });
          }
        }}
      >
        <input
          className={`${inputCls} font-mono uppercase tracking-[0.2em]`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABC123"
          aria-label="group join code"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-lime px-4 py-2.5 text-xs font-bold text-ink press-grow disabled:opacity-40"
        >
          {busy ? "…" : "join"}
        </button>
      </form>
      {msg && (
        <p
          className={`mt-2 text-xs leading-relaxed ${
            msg.tone === "ok" ? "text-mint" : "text-amber"
          }`}
        >
          {msg.text}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        {groups.length === 0 && (
          <li className="rounded-xl border border-dashed border-line2 p-5 text-sm text-fog">
            you are not in any group.
          </li>
        )}
        {groups.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel/70 px-4 py-3.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-paper">{g.name}</span>
              <span className="text-[11px] text-mint">
                {g.ownerName} can read this dashboard
              </span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await leaveGroup(g.id);
                setMsg({ tone: "ok", text: `left ${g.name} — they can no longer read this dashboard` });
                refresh();
              }}
              className="shrink-0 rounded-lg border border-line2 px-3.5 py-2 text-xs font-bold text-fog transition-colors hover:border-amber/50 hover:text-amber"
            >
              leave
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
