import { ARRIVAL_STEPS, type ArrivalStep } from "@/data/arrival";
import { parseIntake, toISODate, formatWindow, shiftMonths } from "@/lib/roadmap";

/**
 * The arrival timeline, dated for one student.
 *
 * Same rule as the admission timeline, and for the same reason: every date is the
 * student's own enrolment month minus an offset the curated data states, so nothing
 * is invented. A step whose window has fully passed is history; the first step that
 * has not is "you are here".
 *
 * Visa processing is the one place where a schedule deserves visible suspicion —
 * published times are medians that lengthen in summer — so the page says so rather
 * than implying the dates are commitments.
 */

export type ArrivalStatus = "past" | "now" | "later" | "info";

export interface DatedArrivalStep extends ArrivalStep {
  windowStart: string | null;
  windowEnd: string | null;
  /** "Mar – Jun 2027" */
  windowLabel: string | null;
  status: ArrivalStatus;
}

export interface Arrival {
  enrollmentDate: string | null;
  anchorLabel: string;
  /** the first step that is not already behind you */
  currentSlug: string | null;
  steps: DatedArrivalStep[];
}

export function buildArrival(intake: string, today: Date = new Date()): Arrival {
  const parsed = parseIntake(intake);
  const enrollment = parsed ? new Date(parsed.year, parsed.month, 1) : null;
  const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const steps: DatedArrivalStep[] = [...ARRIVAL_STEPS]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      let windowStart: string | null = null;
      let windowEnd: string | null = null;
      let windowLabel: string | null = null;
      let status: ArrivalStatus = "info";

      if (enrollment) {
        const start = shiftMonths(enrollment, s.offset.maxMonths);
        const end = shiftMonths(enrollment, s.offset.minMonths);
        windowStart = toISODate(start);
        windowEnd = toISODate(end);
        windowLabel = formatWindow(windowStart, windowEnd);
        status = +end < +todayMonth ? "past" : +start <= +todayMonth ? "now" : "later";
      }

      return { ...s, windowStart, windowEnd, windowLabel, status };
    });

  const current = steps.find((s) => s.status !== "past") ?? null;

  return {
    enrollmentDate: enrollment ? toISODate(enrollment) : null,
    anchorLabel: enrollment
      ? `Measured backwards from your ${/spring/i.test(intake) ? "January" : "September"} ${enrollment.getFullYear()} enrolment`
      : "Add your intake year on the profile tab and these steps get dates",
    currentSlug: current?.slug ?? null,
    steps,
  };
}
