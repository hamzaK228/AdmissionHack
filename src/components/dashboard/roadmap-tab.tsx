"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/components/dashboard/store";
import { buildRoadmap, formatWindow, type PhaseStatus, type RoadmapPhase } from "@/lib/roadmap";
import { Eyebrow } from "@/components/ui";
import { Stagger, MotionItem } from "@/components/motion/reveal";

/**
 * The timeline tab — the curated journey, dated for this student.
 *
 * The dates come from `@/lib/roadmap`, which measures backwards from the
 * student's own intake and earliest deadline. This component only presents
 * them and offers to write them into the deadline list they already have, so
 * the plan and the deadline radar are the same data rather than two lists that
 * drift apart.
 */

const STATUS_STYLE: Record<PhaseStatus, { card: string; dot: string; chip: string; label: string }> = {
  done: { card: "border-lime/30 bg-lime/[0.04]", dot: "bg-lime", chip: "text-lime border-lime/40", label: "done" },
  active: { card: "border-lime/50 bg-panel/70", dot: "bg-lime ring-4 ring-lime/20", chip: "text-lime border-lime/50", label: "in progress" },
  todo: { card: "border-line bg-panel/70", dot: "bg-line2", chip: "text-fog border-line2", label: "to do" },
  overdue: { card: "border-red/40 bg-red/[0.05]", dot: "bg-red", chip: "text-red border-red/40", label: "behind" },
  info: { card: "border-line bg-panel/40", dot: "bg-line", chip: "text-dim border-line", label: "later" },
};

export function RoadmapTab({ onGo }: { onGo: (tab: string) => void }) {
  const store = useStore();
  const { profile, exams, apps, checklist, deadlines, addDeadline, saveProfile } = store;
  const [intakeDraft, setIntakeDraft] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  const roadmap = useMemo(
    () =>
      buildRoadmap({
        intake: profile?.intake ?? "",
        deadlines: deadlines.map((d) => d.date),
        apps,
        checklist,
        exams,
        level: profile?.level ?? "bachelor's",
        country: profile?.country ?? "",
      }),
    [profile?.intake, profile?.level, profile?.country, deadlines, apps, checklist, exams],
  );

  const scheduled = roadmap.phases.filter((p) => p.windowEnd);
  const trackable = scheduled.filter((p) => p.status !== "done" && p.status !== "info");
  const tracked = new Set(deadlines.map((d) => d.title));

  /** The dashboard shows the profile wizard until a profile exists, so this is
   *  a guard rather than a path: with no profile there is nothing to save into. */
  const setIntake = (intake: string) => {
    if (profile) saveProfile({ ...profile, intake });
  };

  const track = (phase: RoadmapPhase) => {
    if (!phase.windowEnd) return;
    addDeadline({ title: `${phase.title} — start`, date: phase.windowEnd.slice(0, 10) });
    setAdded((prev) => [...prev, phase.slug]);
  };

  const trackAll = () => {
    trackable.forEach((p) => {
      if (!tracked.has(`${p.title} — start`)) addDeadline({ title: `${p.title} — start`, date: p.windowEnd!.slice(0, 10) });
    });
    setAdded(trackable.map((p) => p.slug));
  };

  return (
    <div className="max-w-3xl">
      <Eyebrow>your timeline</Eyebrow>
      <p className="mt-2 text-sm text-fog">
        {roadmap.anchorLabel}
        {roadmap.enrollmentDate && (
          <>
            {" · "}
            <button type="button" onClick={() => onGo("profile")} className="text-lime underline-offset-2 hover:underline">
              change intake
            </button>
          </>
        )}
      </p>

      {/* No intake year: ask once, in place, instead of showing dateless phases. */}
      {!roadmap.enrollmentDate && (
        <div className="mt-4 rounded-xl border border-lime/40 bg-lime/[0.04] p-4">
          <p className="text-sm text-paper">
            Tell me when you start and every phase below gets real dates — 18 months back from enrolment.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["Fall 2027", "Fall 2028", "Spring 2028"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setIntake(v)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-paper transition-colors hover:border-lime/60"
              >
                {v}
              </button>
            ))}
            <input
              value={intakeDraft}
              onChange={(e) => setIntakeDraft(e.target.value)}
              placeholder="or type it — e.g. Fall 2029"
              aria-label="Intake"
              className="w-44 rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-paper outline-none placeholder:text-dim focus:border-lime/60"
            />
            <button
              type="button"
              disabled={!/\d{4}/.test(intakeDraft)}
              onClick={() => { setIntake(intakeDraft); setIntakeDraft(""); }}
              className="rounded-lg bg-lime px-3 py-1.5 text-xs font-bold text-ink transition-opacity disabled:opacity-30"
            >
              set
            </button>
          </div>
        </div>
      )}

      {trackable.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={trackAll}
            className="rounded-lg border border-lime/50 px-3 py-1.5 text-xs font-bold text-lime transition-colors hover:bg-lime/10"
          >
            + track all {trackable.length} as deadlines
          </button>
          <span className="text-xs text-dim">
            they appear in the deadlines tab, so the radar and this plan stay the same list
          </span>
        </div>
      )}

      <Stagger className="mt-6 space-y-3">
        {roadmap.phases.map((p) => {
          const s = STATUS_STYLE[p.status];
          const here = p.slug === roadmap.currentSlug;
          const isTracked = tracked.has(`${p.title} — start`);
          const justAdded = added.includes(p.slug);
          return (
            <MotionItem key={p.slug}>
              <div className={`relative rounded-xl border p-4 ${s.card} ${here ? "ring-1 ring-lime/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
                        {String(p.order).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-bold text-paper">{p.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.chip}`}>
                        {s.label}
                      </span>
                      {here && <span className="text-[10px] font-bold uppercase tracking-wider text-lime">← you are here</span>}
                    </div>

                    <p className="mt-1.5 text-xs text-dim">
                      {formatWindow(p.windowStart, p.windowEnd) ?? p.timing}
                    </p>

                    <p className="mt-2 text-sm text-fog">{p.evidence}</p>

                    {p.nextAction && (
                      <p className="mt-2 text-sm text-paper">
                        <span className="text-dim">next: </span>
                        {p.nextAction}
                      </p>
                    )}

                    {p.windowEnd && p.status !== "done" && p.status !== "info" && (
                      <div className="mt-3">
                        {isTracked || justAdded ? (
                          <span className="text-xs text-dim">tracked in your deadlines ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => track(p)}
                            className="rounded-lg border border-line px-3 py-1.5 text-xs text-fog transition-colors hover:border-lime/50 hover:text-lime"
                          >
                            track this as a deadline
                          </button>
                        )}
                      </div>
                    )}

                    {p.windowLabel && (
                      <p className="mt-3 border-t border-line/60 pt-2 text-[11px] leading-relaxed text-dim">
                        {p.windowLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </MotionItem>
          );
        })}
      </Stagger>

      <p className="mt-6 text-xs leading-relaxed text-dim">
        Windows are the curated planning ranges from{" "}
        <Link href="/how-admission-works" className="text-fog underline-offset-2 hover:underline">
          how admission works
        </Link>
        , measured back from your own intake and earliest tracked deadline — they are
        planning guides, not a university&rsquo;s dates. Confirm every real deadline on the
        university&rsquo;s own site.
      </p>
    </div>
  );
}
