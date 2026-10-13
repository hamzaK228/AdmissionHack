"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  listJoinedGroups,
  listMyGroups,
  type Group,
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

  return (
    <div>
      <Eyebrow>create a group</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        A group is a class list. Create one, share the code, and every student who joins can fill in
        their dashboard while you read it — folders, files, lists and scores.
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
                onClick={() => setOpen(isOpen ? null : g.id)}
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
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-lime/30 bg-lime/[0.06] px-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-dim">
                        join code
                      </span>
                      <span className="block font-mono text-lg font-bold tracking-[0.2em] text-lime">
                        {g.joinCode}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(g.joinCode)}
                      className="shrink-0 rounded-lg border border-line2 px-3 py-1.5 text-[11px] font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
                    >
                      {copied === g.joinCode ? "copied ✓" : "copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-dim">
                    Students enter this in their dashboard, on the counselor tab.
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {g.members.length === 0 && (
                      <li className="text-xs text-dim">nobody has joined yet.</li>
                    )}
                    {g.members.map((m) => (
                      <li key={m.studentId}>
                        <button
                          type="button"
                          onClick={() => onOpenStudent(m.studentId)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-2 text-left transition-colors hover:border-lime/50"
                        >
                          <span className="truncate text-xs font-bold text-paper">{m.name}</span>
                          <span className="shrink-0 text-[10px] text-lime">open workspace →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
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
