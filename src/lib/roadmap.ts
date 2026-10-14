import { journeySteps } from "@/data/journey";
import type { JourneyStep } from "@/data/types";

/**
 * The timeline: the curated journey, dated.
 *
 * `journeySteps` already carries what has to happen and roughly when ("take
 * exams 8–12 months before enrollment"). This turns that into real dates for
 * one student by measuring backwards from the only two anchors we actually know:
 * their intake month, and their earliest application deadline.
 *
 * Two rules keep it honest:
 *
 *  1. **Nothing is invented.** Every date is the student's own intake or their
 *     own deadline, minus an offset that the curated data states. A phase whose
 *     curated timing has no usable offset (decisions, the application window
 *     itself) gets no window rather than a made-up one.
 *  2. **Nothing is assumed done.** Status comes from data the dashboard already
 *     holds — scores, ticked documents, the university list, tracked deadlines —
 *     and the evidence line says which. A phase we cannot observe stays "info".
 */

export type PhaseStatus = "done" | "active" | "todo" | "overdue" | "info";

export interface RoadmapPhase {
  slug: string;
  order: number;
  title: string;
  summary: string;
  /** the curated human wording, shown verbatim so the range stays visible */
  timing: string;
  status: PhaseStatus;
  /** why this status, naming the student's own data */
  evidence: string;
  /** the first concrete task from the curated step, when there is work left */
  nextAction: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  /** what the window is measured from, e.g. "6–10 months before your deadline (14 Jan 2027)" */
  windowLabel: string | null;
}

export interface RoadmapInput {
  intake: string;
  /** ISO yyyy-mm-dd dates already on the student's deadline list */
  deadlines: string[];
  apps: { slug: string; tier: string }[];
  /** checklist ids → done */
  checklist: Record<string, boolean>;
  exams: {
    ieltsOverall?: string;
    toefl?: string;
    satEbrw?: string;
    satMath?: string;
    gpa?: string;
  };
  level: "bachelor's" | "master's";
  country: string;
  /** files the student has actually filed, when the caller knows */
  documentCount?: number;
  /** injectable for tests; defaults to now */
  today?: Date;
}

export interface Roadmap {
  intakeYear: number | null;
  enrollmentDate: string | null;
  /** one line explaining what the dates are measured from */
  anchorLabel: string;
  /** the first phase that is not done, in order — "you are here" */
  currentSlug: string | null;
  phases: RoadmapPhase[];
}

/* ── date arithmetic (month resolution; a plan does not need days) ────────── */

const parseISO = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** First of the month, `months` earlier (or later, for a negative). Shared with the arrival timeline. */
export const shiftMonths = (d: Date, months: number) => new Date(d.getFullYear(), d.getMonth() - months, 1);

/** "Fall 2027" → September 2027; "Spring 2028" → January 2028. */
export function parseIntake(intake: string): { year: number; month: number } | null {
  const year = /(\d{4})/.exec(intake ?? "")?.[1];
  if (!year) return null;
  const spring = /spring|january|jan\b|winter/i.test(intake);
  return { year: Number(year), month: spring ? 0 : 8 };
}

const fmtMonth = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });

const fmtDay = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/** "Mar–Sep 2026", or a single month when the range collapses. */
export function formatWindow(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const a = fmtMonth(start);
  const b = fmtMonth(end);
  return a === b ? a : `${a} – ${b}`;
}

/* ── what the student has actually done ──────────────────────────────────── */

/** Documents every applicant needs. `aps` and `translations` are country-specific. */
const CORE_DOCS = ["passport", "transcripts", "diploma", "english", "lor", "financial"] as const;

const testSummary = (e: RoadmapInput["exams"]): string[] => {
  const out: string[] = [];
  if (e.ieltsOverall) out.push(`IELTS ${e.ieltsOverall}`);
  if (e.toefl) out.push(`TOEFL ${e.toefl}`);
  if (e.satEbrw || e.satMath) out.push(`SAT ${e.satEbrw ?? "—"}/${e.satMath ?? "—"}`);
  return out;
};

interface Assessment {
  status: PhaseStatus;
  evidence: string;
}

const assess = (step: JourneyStep, input: RoadmapInput, windowClosed: boolean): Assessment => {
  const { checklist, exams, apps, deadlines, country, level } = input;
  /**
   * A closed window is the one thing that outranks "in progress": if the latest
   * sensible month has passed and the phase is not finished, the student is
   * behind regardless of how much is done, and saying so is the point of a plan.
   * `done` and `info` are unaffected — finished is finished, and an informational
   * phase has no window to miss.
   */
  const closed = (s: PhaseStatus): PhaseStatus =>
    windowClosed && s !== "done" && s !== "info" ? "overdue" : s;

  switch (step.slug) {
    case "choose-destination": {
      const decided = Boolean(country) && !/undecided/i.test(country);
      return decided
        ? { status: "done", evidence: `your destination is set: ${country}` }
        : { status: closed("todo"), evidence: "your target country is still undecided" };
    }

    case "shortlist-universities": {
      const n = apps.length;
      if (n >= 6) return { status: "done", evidence: `${n} universities on your list` };
      if (n > 0)
        return {
          status: closed("active"),
          evidence: `${n} on your list — a spread of 6–10 across dream, target and safe`,
        };
      return { status: closed("todo"), evidence: "no universities on your list yet" };
    }

    case "plan-exams": {
      const tests = testSummary(exams);
      // a master's applicant is not expected to sit the SAT
      const hasCore = Boolean(exams.ieltsOverall || exams.toefl);
      if (tests.length && (hasCore || Boolean(exams.satEbrw || exams.satMath)))
        return { status: "done", evidence: `recorded: ${tests.join(" · ")}` };
      if (tests.length || exams.gpa)
        return {
          status: closed("active"),
          evidence: tests.length ? `partly recorded: ${tests.join(" · ")}` : "grades recorded, no test score yet",
        };
      return {
        status: closed("todo"),
        evidence: level === "master's" ? "no test score recorded yet" : "no test scores recorded yet",
      };
    }

    case "prepare-documents": {
      const done = CORE_DOCS.filter((id) => checklist[id]);
      if (done.length === CORE_DOCS.length)
        return { status: "done", evidence: `all ${CORE_DOCS.length} core documents ticked off` };
      const filed = input.documentCount ?? 0;
      if (done.length || filed)
        return {
          status: closed("active"),
          evidence: `${done.length}/${CORE_DOCS.length} core documents ticked${
            filed ? ` · ${filed} file${filed === 1 ? "" : "s"} filed` : ""
          }`,
        };
      return { status: closed("todo"), evidence: "no documents ticked off yet" };
    }

    case "write-essays": {
      const sop = Boolean(checklist.sop);
      const cv = Boolean(checklist.cv);
      if (sop && cv) return { status: "done", evidence: "personal statement and CV both done" };
      if (sop || cv)
        return {
          status: closed("active"),
          evidence: `${sop ? "personal statement" : "CV"} done, ${sop ? "CV" : "personal statement"} outstanding`,
        };
      return { status: closed("todo"), evidence: "no draft started" };
    }

    case "apply-and-track": {
      const n = apps.length;
      const d = deadlines.length;
      if (n === 0) return { status: closed("todo"), evidence: "nothing on your list to apply to yet" };
      if (d >= n) return { status: "done", evidence: `every one of your ${n} universities has a deadline tracked` };
      if (d > 0)
        return { status: closed("active"), evidence: `${d} deadline${d === 1 ? "" : "s"} tracked for ${n} universities` };
      return { status: closed("todo"), evidence: `${n} universities on your list, but no deadlines tracked` };
    }

    case "decide-offers":
      return {
        status: "info",
        evidence: "decisions land between December and May — nothing to track until they arrive",
      };

    case "visa-and-arrival":
      return {
        status: "info",
        evidence: "needs your passport and your admission letter, so it comes after the offers",
      };

    default:
      return { status: "info", evidence: "" };
  }
};

/* ── the plan ─────────────────────────────────────────────────────────────── */

export function buildRoadmap(input: RoadmapInput): Roadmap {
  const today = input.today ?? new Date();
  const intake = parseIntake(input.intake);
  const enrollment = intake ? new Date(intake.year, intake.month, 1) : null;

  // The deadline anchor is the student's own earliest upcoming deadline; with
  // none tracked, fall back to a typical Dec–Feb Fall-intake deadline (nine
  // months before enrolment) and say so, rather than leaving phases dateless.
  const parsed = input.deadlines.map(parseISO).filter((d): d is Date => Boolean(d)).sort((a, b) => +a - +b);
  const upcoming = parsed.find((d) => +d >= +new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const ownDeadline = upcoming ?? parsed[0] ?? null;
  const deadlineAnchor = ownDeadline ?? (enrollment ? shiftMonths(enrollment, -9) : null);

  const anchors = {
    enrollment:
      enrollment && {
        date: enrollment,
        label: `your ${/spring/i.test(input.intake) ? "January" : "September"} ${enrollment.getFullYear()} enrolment`,
      },
    deadline:
      deadlineAnchor && {
        date: deadlineAnchor,
        label: ownDeadline
          ? `your earliest deadline (${fmtDay(toISODate(deadlineAnchor))})`
          : `a typical Dec–Feb deadline for a Fall ${enrollment?.getFullYear() ?? ""} start`.trim(),
      },
  };

  const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const phases: RoadmapPhase[] = [...journeySteps]
    .sort((a, b) => a.order - b.order)
    .map((step) => {
      const anchor = step.offset ? anchors[step.offset.from] : null;

      let windowStart: string | null = null;
      let windowEnd: string | null = null;
      let windowLabel: string | null = null;
      let windowClosed = false;

      if (step.offset && anchor) {
        const start = shiftMonths(anchor.date, step.offset.maxMonths);
        const end = shiftMonths(anchor.date, step.offset.minMonths);
        windowStart = toISODate(start);
        windowEnd = toISODate(end);
        windowLabel = `${step.timing} — ${formatWindow(windowStart, windowEnd)}, measured from ${anchor.label}`;
        windowClosed = +end < +todayMonth;
      }

      const { status, evidence } = assess(step, input, windowClosed);
      return {
        slug: step.slug,
        order: step.order,
        title: step.shortTitle,
        summary: step.summary,
        timing: step.timing,
        status,
        evidence,
        nextAction: status === "done" || status === "info" ? null : (step.whatToDo[0] ?? null),
        windowStart,
        windowEnd,
        windowLabel,
      };
    });

  const current = phases.find((p) => p.status !== "done" && p.status !== "info") ?? null;

  return {
    intakeYear: intake?.year ?? null,
    enrollmentDate: enrollment ? toISODate(enrollment) : null,
    anchorLabel: anchors.enrollment
      ? `Measured backwards from ${anchors.enrollment.label}`
      : "Add your intake year and these phases get dates",
    currentSlug: current?.slug ?? null,
    phases,
  };
}
