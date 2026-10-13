/**
 * Where each application stands.
 *
 * One vocabulary, in one place, because four things have to agree on it: this
 * module, the dashboard UI, the CHECK constraint in the database, and the
 * workspace sync. A status is not a label — moving to `submitted` is what
 * stamps a submission date, and that rule is tested rather than assumed.
 *
 * Order matters: the array runs from the earliest state to the last, so the UI
 * can present it as a progression and `isPast` can compare two states.
 */

export const APP_STATUSES = [
  "planning",
  "preparing",
  "submitted",
  "waitlisted",
  "offer",
  "rejected",
  "enrolled",
] as const;

export type AppStatus = (typeof APP_STATUSES)[number];

export type StatusTone = "idle" | "work" | "waiting" | "good" | "bad";

export interface StatusSpec {
  id: AppStatus;
  /** what the student sees on the chip */
  short: string;
  /** the full sentence for a control that needs one */
  label: string;
  /** the honest next move from this state — a dead end is a bad status */
  next: string;
  tone: StatusTone;
  /** an outcome, not a to-do: nothing more for the student to do here */
  settled: boolean;
}

const SPECS: Record<AppStatus, Omit<StatusSpec, "id">> = {
  planning: {
    short: "planning",
    label: "Planning — deciding whether to apply",
    next: "Decide whether this one is worth an application, and check what it asks for.",
    tone: "idle",
    settled: false,
  },
  preparing: {
    short: "preparing",
    label: "Preparing — documents, essays and the form",
    next: "Work through what it asks for: essays, recommendations, transcripts, fee.",
    tone: "work",
    settled: false,
  },
  submitted: {
    short: "submitted",
    label: "Submitted — sent, waiting for the decision",
    next: "Nothing to do now: track the decision date and keep your inbox watched.",
    tone: "waiting",
    settled: false,
  },
  waitlisted: {
    short: "waitlisted",
    label: "Waitlisted — a place may open up",
    next: "Send a short letter of continued interest if the university allows one.",
    tone: "waiting",
    settled: false,
  },
  offer: {
    short: "offer",
    label: "Offer — admitted",
    next: "Compare the offer against your others: cost, conditions, and the deposit deadline.",
    tone: "good",
    settled: true,
  },
  rejected: {
    short: "rejected",
    label: "Not this time",
    next: "Nothing to do here — move the effort to the applications still open.",
    tone: "bad",
    settled: true,
  },
  enrolled: {
    short: "enrolled",
    label: "Enrolled — you accepted and you are going",
    next: "Now the practical part: visa, housing, and the deposit.",
    tone: "good",
    settled: true,
  },
};

export const isAppStatus = (v: unknown): v is AppStatus =>
  typeof v === "string" && (APP_STATUSES as readonly string[]).includes(v);

export const statusSpec = (s: AppStatus): StatusSpec => ({ id: s, ...SPECS[s] });

/** Row position in the lifecycle, for ordering and comparisons. */
export const statusRank = (s: AppStatus) => APP_STATUSES.indexOf(s);

/** Has the application reached `target`, or gone past it? */
export const isAtLeast = (s: AppStatus, target: AppStatus) => statusRank(s) >= statusRank(target);

/** Anything the student still has to act on. */
export const isOpen = (s: AppStatus) => !SPECS[s].settled && s !== "submitted";

export interface TrackedApp {
  slug: string;
  tier: string;
  status?: AppStatus;
  /** ISO yyyy-mm-dd, stamped when the status becomes `submitted` */
  submittedOn?: string;
  /** ISO yyyy-mm-dd, stamped when an outcome lands */
  decidedOn?: string;
}

/** An entry with no status predates the tracker: treat it as still being planned. */
export const statusOf = (app: TrackedApp): AppStatus => (isAppStatus(app.status) ? app.status : "planning");

const OUTCOMES: readonly AppStatus[] = ["offer", "waitlisted", "rejected", "enrolled"];

const todayISO = (today: Date) =>
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

/**
 * Move an application to a new status, stamping the dates that follow from it.
 *
 * The stamping is the reason this is a function and not `{...app, status}`:
 * a submission date that the student has to type is one they will get wrong or
 * leave blank, and an outcome with no date makes the tracker's own history
 * unreadable. Moving *back* to an unfinished state clears the stamp, so an
 * accidental tap cannot leave a phantom submission date behind.
 */
export function withStatus(app: TrackedApp, status: AppStatus, today: Date = new Date()): TrackedApp {
  const todayStr = todayISO(today);
  const next: TrackedApp = { ...app, status };

  if (status === "submitted") {
    next.submittedOn = app.submittedOn ?? todayStr;
  } else if (statusRank(status) < statusRank("submitted")) {
    delete next.submittedOn;
    delete next.decidedOn;
  }

  if (OUTCOMES.includes(status)) {
    next.decidedOn = app.decidedOn ?? todayStr;
  } else if (!OUTCOMES.includes(statusOf(app))) {
    delete next.decidedOn;
  }

  return next;
}

export interface AppSummary {
  total: number;
  planning: number;
  preparing: number;
  submitted: number;
  /** any outcome at all: offer, waitlist or rejection, plus enrolled */
  decided: number;
  offers: number;
  enrolled: number;
  /** still needing the student's attention */
  open: number;
}

export function summarize(apps: TrackedApp[]): AppSummary {
  const counts: Record<AppStatus, number> = {
    planning: 0,
    preparing: 0,
    submitted: 0,
    waitlisted: 0,
    offer: 0,
    rejected: 0,
    enrolled: 0,
  };
  for (const a of apps) counts[statusOf(a)]++;

  const decided = counts.offer + counts.waitlisted + counts.rejected + counts.enrolled;
  return {
    total: apps.length,
    planning: counts.planning,
    preparing: counts.preparing,
    submitted: counts.submitted,
    decided,
    offers: counts.offer + counts.enrolled,
    enrolled: counts.enrolled,
    open: apps.filter((a) => isOpen(statusOf(a))).length,
  };
}
