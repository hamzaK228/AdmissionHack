"use client";

import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { pullWorkspace, pushWorkspace, type SyncPayload } from "@/lib/workspace-sync";
import { isAppStatus, statusOf } from "@/lib/applications";
import {
  useStore,
  type AppEntry,
  type Deadline,
  type ExamResults,
  type PortfolioEntry,
  type Profile,
  type WorkspaceImport,
} from "@/components/dashboard/store";
import { Eyebrow } from "@/components/ui";

/**
 * Cloud sync — the "import my whole workspace" control.
 *
 * The local store stays authoritative: this uploads it as one snapshot, or
 * replaces it with the cloud copy. A whole-workspace replace in both directions
 * is the right shape for a single applicant (tens of rows) and leaves no way to
 * half-merge two devices.
 *
 * Nothing here is required to use the app. Signed out, it explains that the
 * workspace lives on this device; signed in, it offers the two directions.
 */

/** The slice of the local store that syncs. */
type LocalState = {
  profile: Profile | null;
  apps: AppEntry[];
  portfolio: PortfolioEntry[];
  exams: ExamResults;
  deadlines: Deadline[];
  checklist: Record<string, boolean>;
};

/** Local store → the wire shape. */
function toPayload(s: LocalState): SyncPayload {
  const { profile, exams } = s;

  const sections = (...pairs: [string, string | undefined][]) =>
    Object.fromEntries(pairs.filter((p): p is [string, string] => Boolean(p[1])));

  const scored: SyncPayload["exams"] = {};

  const ielts = sections(
    ["L", exams.ieltsL],
    ["R", exams.ieltsR],
    ["W", exams.ieltsW],
    ["S", exams.ieltsS],
  );
  const ieltsOverall = exams.ieltsOverall ?? profile?.ielts;
  if (ieltsOverall || Object.keys(ielts).length) {
    scored.ielts = { overall: ieltsOverall, sections: ielts };
  }

  const toefl = exams.toefl ?? profile?.toefl;
  if (toefl) scored.toefl = { overall: toefl, sections: {} };

  // the local store keeps SAT as two subscores, so the total is derived for the
  // single `overall` column while ebrw/math ride along in `sections`
  const satSections = sections(["ebrw", exams.satEbrw], ["math", exams.satMath]);
  const parts = [exams.satEbrw, exams.satMath].map((v) => Number(v));
  const satTotal =
    profile?.sat ??
    (parts.every((n) => Number.isFinite(n) && n > 0)
      ? String(parts[0] + parts[1])
      : undefined);
  if (satTotal || Object.keys(satSections).length) {
    scored.sat = { overall: satTotal, sections: satSections };
  }

  return {
    profile: profile
      ? {
          full_name: profile.name,
          level: profile.level,
          country: profile.country,
          intake: profile.intake,
          budget: profile.budget || undefined,
          gpa: exams.gpa ?? profile.gpa,
          gpa_scale: exams.gpaScale ?? profile.gpaScale,
        }
      : null,
    exams: scored,
    universities: s.apps.map((a) => ({
      slug: a.slug,
      tier: a.tier,
      status: statusOf(a),
      submittedOn: a.submittedOn ?? null,
      decidedOn: a.decidedOn ?? null,
    })),
    deadlines: s.deadlines.map((d) => ({ title: d.title, date: d.date })),
    portfolio: s.portfolio.map((p) => ({
      kind: p.kind,
      title: p.title,
      org: p.org || undefined,
      description: p.description || undefined,
      years: p.years || undefined,
      hours: p.hours || undefined,
    })),
    checklist: s.checklist,
  };
}

/** The wire shape → the pieces the local store can absorb. */
function fromPayload(w: SyncPayload): WorkspaceImport {
  const ielts = w.exams.ielts;
  const sat = w.exams.sat;

  return {
    profile: w.profile
      ? {
          name: w.profile.full_name ?? "",
          level: w.profile.level === "master's" ? "master's" : "bachelor's",
          country: w.profile.country ?? "undecided",
          intake: w.profile.intake ?? "",
          budget: w.profile.budget ?? 0,
          gpa: w.profile.gpa,
          gpaScale: w.profile.gpa_scale,
        }
      : undefined,
    // Only a status the app recognises is written back: a value from a newer (or
    // hand-edited) database must not be persisted into this student's workspace.
    apps: w.universities.map((u) => ({
      slug: u.slug,
      tier: u.tier,
      ...(isAppStatus(u.status) ? { status: u.status } : {}),
      ...(u.submittedOn ? { submittedOn: u.submittedOn } : {}),
      ...(u.decidedOn ? { decidedOn: u.decidedOn } : {}),
    })),
    portfolio: w.portfolio.map((p) => ({
      id: crypto.randomUUID(),
      kind: p.kind,
      title: p.title,
      org: p.org ?? "",
      description: p.description ?? "",
      years: p.years ?? "",
      hours: p.hours ?? "",
    })),
    exams: {
      ieltsOverall: ielts?.overall,
      ieltsL: ielts?.sections?.L,
      ieltsR: ielts?.sections?.R,
      ieltsW: ielts?.sections?.W,
      ieltsS: ielts?.sections?.S,
      toefl: w.exams.toefl?.overall,
      satEbrw: sat?.sections?.ebrw,
      satMath: sat?.sections?.math,
      gpa: w.profile?.gpa,
      gpaScale: w.profile?.gpa_scale,
    },
    deadlines: w.deadlines.map((d) => ({ id: crypto.randomUUID(), title: d.title, date: d.date })),
    checklist: w.checklist,
  };
}

export function CloudSync() {
  const { user, configured, loading } = useAuth();
  const store = useStore();
  const [busy, setBusy] = useState<"push" | "pull" | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  if (!configured) return null;
  if (loading) return <p className="text-sm text-dim">checking session…</p>;
  if (!user) {
    return (
      <div className="max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
        <Eyebrow>cloud sync</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          Sign in above to upload this workspace, or to pull it onto another device. Until then
          everything lives only in this browser.
        </p>
      </div>
    );
  }

  const local: LocalState = {
    profile: store.profile,
    apps: store.apps,
    portfolio: store.portfolio,
    exams: store.exams,
    deadlines: store.deadlines,
    checklist: store.checklist,
  };

  const counts = [
    ["universities", local.apps.length],
    ["portfolio", local.portfolio.length],
    ["deadlines", local.deadlines.length],
    ["scores", Object.keys(toPayload(local).exams).length],
  ] as const;

  return (
    <div className="max-w-xl rounded-2xl border border-line bg-panel/70 p-6">
      <Eyebrow>cloud sync</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        Signed in as <span className="text-lime">{user.email}</span>. Syncing replaces the whole
        workspace in one direction or the other — it never half-merges two devices.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(([label, n]) => (
          <li key={label} className="rounded-lg border border-line bg-ink px-3 py-2">
            <span className="block text-lg font-bold tabular-nums text-paper">{n}</span>
            <span className="text-[10px] uppercase tracking-wider text-dim">{label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("push");
            setMsg(null);
            const res = await pushWorkspace(toPayload(local));
            setBusy(null);
            setMsg(
              res.ok
                ? { tone: "ok", text: "workspace uploaded ✓" }
                : { tone: "err", text: res.error },
            );
          }}
          className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
        >
          {busy === "push" ? "uploading…" : "upload this workspace"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("pull");
            setMsg(null);
            const w = await pullWorkspace();
            setBusy(null);
            if (!w) {
              setMsg({ tone: "err", text: "nothing came back — are you still signed in?" });
              return;
            }
            store.importWorkspace(fromPayload(w));
            setMsg({ tone: "ok", text: "workspace restored from cloud ✓" });
          }}
          className="rounded-lg border border-line2 px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime disabled:opacity-40"
        >
          {busy === "pull" ? "restoring…" : "restore from cloud"}
        </button>
      </div>

      {msg && (
        <p
          className={`mt-3 text-xs leading-relaxed ${msg.tone === "ok" ? "text-mint" : "text-amber"}`}
        >
          {msg.text}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-dim">
        Restoring replaces what is on this device with what is in the cloud — including emptying
        lists the cloud copy does not have. Use it to move onto a second device, not to merge.
      </p>
    </div>
  );
}
