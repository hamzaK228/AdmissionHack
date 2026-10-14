import { countries } from "@/data/countries";

/**
 * The requirement checker — what each application actually asks for, and whether
 * the student has it.
 *
 * The dashboard's document checklist is a flat list of ten things every applicant
 * needs. This is the other half: the requirements that depend on *where* you are
 * applying. A German application is not a British one — it may want an APS
 * certificate and a blocked account with a specific balance, and it goes through
 * uni-assist rather than UCAS. None of that is visible in a generic checklist, and
 * it is exactly the sort of thing that surfaces late and costs a season.
 *
 * Nothing here is invented. The country-specific facts are read straight from the
 * country guides, which carry verified windows, fees and visa figures, and they
 * are displayed verbatim so the amount stays attached to its source. Readiness is
 * derived only from data the dashboard already holds — the checklist, recorded
 * exam scores — and anything we cannot observe reports `null` and is left out of
 * the score rather than guessed at.
 */

export interface RequirementItem {
  id: string;
  label: string;
  detail: string;
  /** true = we can see it done · false = missing · null = we cannot observe it here */
  met: boolean | null;
  /** which of the student's own data this was read from */
  evidence: string;
}

export interface CountryRequirements {
  countryName: string;
  /** the guided country's slug, when a guide exists */
  slug: string | null;
  universities: { slug: string; name: string }[];
  items: RequirementItem[];
  /** the guide's own guidance, shown verbatim */
  facts: { label: string; value: string }[];
  gotchas: string[];
  /** items we could observe and that are done */
  ready: number;
  /** items we could observe at all */
  observable: number;
}

export interface CheckerInput {
  checklist: Record<string, boolean>;
  exams: { ieltsOverall?: string; toefl?: string; satEbrw?: string; satMath?: string };
  apps: { slug: string; tier: string }[];
  /** slug → the display info the dashboard holds for that university */
  uniBySlug: Record<string, { name: string; countryName: string }>;
  level: "bachelor's" | "master's";
}

/**
 * Countries whose applications commonly require an APS / equivalency certificate,
 * matching the label on the checklist item itself (DE·CN·IN·AE). Kept as a list of
 * country names because that is the key the university records actually carry.
 */
const APS_COUNTRIES = ["Germany", "China", "India", "United Arab Emirates"];

const truthy = (v: boolean | undefined) => Boolean(v);

export function requirementsFor(input: CheckerInput): CountryRequirements[] {
  const { checklist, exams, apps, uniBySlug, level } = input;

  const hasEnglish = Boolean(exams.ieltsOverall || exams.toefl);

  /** Group the student's list by country, keeping the order they first appear. */
  const byCountry = new Map<string, { slug: string; name: string }[]>();
  for (const a of apps) {
    const u = uniBySlug[a.slug];
    if (!u) continue;
    const list = byCountry.get(u.countryName) ?? [];
    list.push({ slug: a.slug, name: u.name });
    byCountry.set(u.countryName, list);
  }

  const out: CountryRequirements[] = [];

  for (const [countryName, unis] of byCountry) {
    const guide = countries.find((c) => c.name === countryName) ?? null;

    const items: RequirementItem[] = [
      {
        id: "passport",
        label: "Passport",
        detail: "Valid for at least six months beyond your intended enrolment.",
        met: truthy(checklist.passport),
        evidence: "your checklist",
      },
      {
        id: "transcripts",
        label: "Official transcripts",
        detail: "Sealed and signed by the issuing school or university.",
        met: truthy(checklist.transcripts),
        evidence: "your checklist",
      },
      {
        id: "diploma",
        label: "Diploma / completion certificate",
        detail: "Or a predicted-grade letter, if you have not finished yet.",
        met: truthy(checklist.diploma),
        evidence: "your checklist",
      },
      {
        id: "english",
        label: "English test certificate",
        detail: guide
          ? `This country typically asks for ${guide.englishRequirement}`
          : "IELTS / TOEFL / DET, per the university you are applying to.",
        met: hasEnglish || truthy(checklist.english),
        evidence: hasEnglish ? "the scores on your exams tab" : "your checklist",
      },
      {
        id: "lor",
        label: "Recommendation letters",
        detail: "Two or three, requested early — the people writing them are busy.",
        met: truthy(checklist.lor),
        evidence: "your checklist",
      },
      {
        id: "sop",
        label: "Personal statement / motivation letter",
        detail: "Say this early too: writing it happens once, badly, before it happens well.",
        met: truthy(checklist.sop),
        evidence: "your checklist",
      },
      {
        id: "financial",
        label: "Financial proof",
        detail: guide
          ? `This country's visa expects: ${guide.visaFinancialProof}`
          : "Bank statements or a sponsor letter covering tuition and living costs.",
        met: truthy(checklist.financial),
        evidence: "your checklist",
      },
      {
        id: "translations",
        label: "Sworn / notarised translations",
        detail: "Needed whenever your documents are not issued in the language of the course.",
        met: truthy(checklist.translations),
        evidence: "your checklist",
      },
    ];

    // CV matters more at master's level, where it is usually a named requirement
    if (level === "master's") {
      items.push({
        id: "cv",
        label: "CV / résumé",
        detail: "Academic format, one or two pages.",
        met: truthy(checklist.cv),
        evidence: "your checklist",
      });
    }

    // The country-specific one a generic checklist cannot know about
    if (APS_COUNTRIES.includes(countryName)) {
      items.push({
        id: "aps",
        label: "APS / equivalency certificate",
        detail: `${countryName} commonly requires this, and it takes weeks — start it before anything else.`,
        met: truthy(checklist.aps),
        evidence: "your checklist",
      });
    }

    if (level === "bachelor's" && guide?.applicationPlatforms?.length) {
      items.push({
        id: "platform",
        label: "Application account",
        detail: `This country applies through ${guide.applicationPlatforms.join(" · ")}.`,
        met: null, // we cannot see whether an account exists, and will not pretend to
        evidence: "the country guide",
      });
    }

    const observable = items.filter((i) => i.met !== null);
    out.push({
      countryName,
      slug: guide?.slug ?? null,
      universities: unis,
      items,
      facts: guide
        ? [
            { label: "apply through", value: guide.applicationPlatforms.join(" · ") },
            { label: "application window", value: guide.applicationWindows },
            { label: "application fee", value: guide.applicationFeeNorm },
            { label: "visa financial proof", value: guide.visaFinancialProof },
            { label: "visa processing", value: guide.visaProcessing },
            { label: "after graduation", value: guide.postStudyWork },
          ]
        : [],
      gotchas: guide?.gotchas ?? [],
      ready: observable.filter((i) => i.met).length,
      observable: observable.length,
    });
  }

  // most-at-risk first: the country you are least ready for
  return out.sort((a, b) => a.ready / Math.max(a.observable, 1) - b.ready / Math.max(b.observable, 1));
}

/** Everything that is missing across the whole list, for a one-line summary. */
export const gapsIn = (groups: CountryRequirements[]): number =>
  groups.reduce((n, g) => n + g.items.filter((i) => i.met === false).length, 0);
