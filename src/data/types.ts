export type Selectivity = "very-high" | "high" | "moderate" | "open";

/** Ranking editions used across the dataset */
export const RANKING_EDITIONS = { qs: 2027, arwu: 2025 } as const;

export const FIELDS = [
  "Engineering & Tech",
  "Computer Science",
  "Business",
  "Economics & Finance",
  "Medicine & Health",
  "Natural Sciences",
  "Social Sciences",
  "Politics & IR",
  "Arts & Humanities",
  "Law",
  "Architecture & Design",
] as const;
export type Field = (typeof FIELDS)[number];

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  slug: string;
  flag: string;
  /** Short summary of how admission works for international students */
  systemSummary: string;
  /** The main application channel(s) */
  applicationPlatforms: string[];
  /** Typical international undergrad tuition, USD per year (approximate) */
  tuitionUsdPerYear: { min: number; max: number; note: string };
  /** Language(s) of instruction commonly available */
  languages: string[];
  /** Typical English requirements */
  englishRequirement: string;
  visaNote: string;
  intakes: string[];
  /** When applications open/close (verified 2025–26 cycle) */
  applicationWindows: string;
  /** What you pay to apply */
  applicationFeeNorm: string;
  /** Financial proof required for the visa */
  visaFinancialProof: string;
  /** Typical visa processing time */
  visaProcessing: string;
  /** Work rights after graduation */
  postStudyWork: string;
  /** Flagship scholarships with application months */
  scholarshipAnchors: string[];
  /** Top mistakes applicants make in this country */
  gotchas: string[];
}

export interface University {
  slug: string;
  name: string;
  /** ISO code of the guided country (present only when a country guide exists) */
  country?: string;
  /** Display country name — always present, also for countries without a guide */
  countryName: string;
  city: string;
  founded: number | null;
  region?: string | null;
  /** QS World University Rankings position (edition in RANKING_EDITIONS); undefined/null = unranked */
  qsRank?: number | null;
  /** ARWU (Shanghai Ranking) position — exact in top 500, band beyond; undefined/null = unranked */
  arwuRank?: number | string | null;
  selectivity: Selectivity | "unknown";
  /** Approximate international tuition, USD per year. null = unknown (basic profiles) */
  tuitionUsdPerYear: { min: number; max: number } | null;
  tuitionNote: string;
  fields: Field[];
  languages: string[];
  acceptedExams: string[]; // exam ids
  description: string;
  website: string;
  /** Data quality marker per our data strategy */
  dataStatus: "community-contributed" | "verified" | "basic";
  /**
   * Absent from QS/ARWU on purpose — a specialist institution that neither
   * ranking covers. Keeps the "no rank found" check meaningful by separating
   * intent from a failed name match.
   */
  unranked?: boolean;
  lastVerified: string; // ISO date
}

/** Shape of hand-curated entries before the merge layer computes ranks/countryName */
export type CuratedUniversity = Omit<
  University,
  "countryName" | "qsRank" | "arwuRank" | "region"
> & {
  countryName?: string;
  qsRank?: number | null;
  arwuRank?: number | string | null;
};

export interface ExamSectionInfo {
  name: string;
  durationMin: number;
  detail: string;
}

export interface Exam {
  id: string;
  name: string;
  administrator: string;
  tier: 1 | 2 | 3 | 4; // 1 = launch, 2 = scale, 3 = niche, 4 = corridor-only
  purpose: string;
  whoNeedsIt: string;
  sections: ExamSectionInfo[];
  scoreScale: string;
  feeUsd: string;
  frequency: string;
  validity: string;
  deliveryMode: string;
  popularity: string;
  prepHubStatus: "live" | "planned" | "roadmap" | "corridor";
  officialSite: string;
  /** Typical minimum scores by destination (English tests) */
  typicalMinimums?: { destination: string; scores: string }[];
}

export interface JourneyStep {
  slug: string;
  order: number;
  title: string;
  shortTitle: string;
  summary: string;
  timing: string;
  /**
   * The machine-readable form of `timing`, so the dashboard can put a real date
   * on the phase instead of leaving it as prose. Measured backwards from the
   * enrolment month (`from: "enrollment"`) or from the student's earliest
   * application deadline (`from: "deadline"`); `minMonths`/`maxMonths` are the
   * usual range, and a phase with no meaningful offset simply omits it — the
   * generator then presents that phase without dates rather than inventing them.
   */
  offset?: { from: "enrollment" | "deadline"; minMonths: number; maxMonths: number };
  whatToDo: string[];
  commonMistakes: string[];
  howAdmissionHackHelps: string;
}
