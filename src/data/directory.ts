import qsData from "./ranking-qs.json";
import arwuData from "./ranking-arwu.json";
import { universities as richUniversities } from "./universities";
import { countryByCode } from "./countries";
import { RANKING_EDITIONS, type University } from "./types";

/**
 * Merged university directory:
 * - 48 richly curated entries (exams, tuition, selectivity, guides)
 * - the full QS World University Rankings 2027 list (1504 institutions) as "basic" profiles
 * - ARWU 2025 ranks merged by name matching
 * The long tail follows the data strategy: rank + country + city now, deep fields later
 * via the ingestion pipeline.
 */

interface QsEntry {
  rank: string;
  name: string;
  country: string;
  city: string | null;
  region: string | null;
}
interface ArwuEntry {
  name: string;
  rank: string | number;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/&/g, " and ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseRank = (r: string): number | null => {
  // QS writes ties as "=2" and the final band as "1401+" — strip markers before parsing
  const n = parseInt(r.replace(/[=+\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const qsMap = new Map<string, { rank: number; country: string; city: string | null; region: string | null }>();
for (const e of qsData as QsEntry[]) {
  const rank = parseRank(e.rank);
  if (rank === null) continue;
  const key = norm(e.name);
  if (!qsMap.has(key)) qsMap.set(key, { rank, country: e.country, city: e.city, region: e.region });
}

const arwuMap = new Map<string, string | number>();
for (const e of arwuData as ArwuEntry[]) {
  const key = norm(e.name);
  if (!arwuMap.has(key)) arwuMap.set(key, e.rank);
}

/** Rich entries whose official QS name differs from our display name */
const QS_ALIASES: Record<string, string> = {
  "university of california berkeley": "University of California, Berkeley (UCB)",
  "university college london ucl": "UCL",
  "london school of economics lse": "The London School of Economics and Political Science (LSE)",
  "university of british columbia ubc": "University of British Columbia",
  "technical university of munich tum": "Technical University of Munich",
  "heidelberg university": "Universität Heidelberg",
  "freie universitat berlin": "Freie Universitaet Berlin",
  "delft university of technology tu delft": "Delft University of Technology",
  "university of amsterdam uva": "University of Amsterdam",
  "eindhoven university of technology tu e": "Eindhoven University of Technology",
  "middle east technical university metu": "Middle East Technical University",
  "nanyang technological university ntu": "Nanyang Technological University, Singapore (NTU Singapore)",
  "seoul national university snu": "Seoul National University",
};

/** Rich entries whose official ARWU name differs from our display name */
const ARWU_ALIASES: Record<string, string> = {
  "nyu abu dhabi": "New York University Abu Dhabi",
};

const universities: University[] = [];

/**
 * Curated entries that fail to match a ranking are a maintenance signal (a
 * renamed institution, a missing alias), so they are worth reporting — but this
 * module is evaluated once per rendered page, which turned a single unmatched
 * entry into ~1,500 identical build-log lines. Keeping the seen-set on
 * globalThis collapses that to one line per build without losing the signal.
 */
const seenUnranked: Set<string> =
  ((globalThis as { __ahUnrankedWarned?: Set<string> }).__ahUnrankedWarned ??= new Set<string>());

// 1) Rich curated entries — ranks come from the fetched datasets (current editions)
const richKeys = new Set<string>();
for (const u of richUniversities) {
  const key = norm(u.name);
  richKeys.add(key);
  richKeys.add(norm(QS_ALIASES[key] ?? ""));
  const qs = qsMap.get(norm(QS_ALIASES[key] ?? "")) ?? qsMap.get(key);
  const arwu = u.arwuRank ?? arwuMap.get(key) ?? arwuMap.get(norm(QS_ALIASES[key] ?? "")) ?? null;
  // `unranked` marks an institution that is absent from the global rankings on
  // purpose (specialist schools), so its absence is not a data fault.
  if (qs == null && arwu == null && !u.unranked && !seenUnranked.has(u.name)) {
    seenUnranked.add(u.name);
    console.warn("[directory] rich entry not matched in any ranking:", u.name);
  }
  universities.push({
    ...u,
    countryName: countryByCode(u.country ?? "")?.name ?? qs?.country ?? u.country ?? "",
    qsRank: qs?.rank ?? null,
    arwuRank: arwu ?? arwuMap.get(norm(ARWU_ALIASES[key] ?? "")) ?? null,
    region: qs?.region ?? null,
  });
}

// 2) Basic profiles for every remaining QS-ranked institution
const usedSlugs = new Set(universities.map((u) => u.slug));
const seenKeys = new Set<string>();
for (const e of qsData as QsEntry[]) {
  const key = norm(e.name);
  if (richKeys.has(key) || seenKeys.has(key)) continue;
  seenKeys.add(key);
  const rank = parseRank(e.rank);
  if (rank === null) continue;

  let slug = slugify(e.name);
  while (usedSlugs.has(slug)) slug = `${slug}-uni`;
  usedSlugs.add(slug);

  universities.push({
    slug,
    name: e.name,
    countryName: e.country,
    city: e.city ?? "",
    founded: null,
    region: e.region,
    qsRank: rank,
    arwuRank: arwuMap.get(key) ?? null,
    selectivity: "unknown",
    tuitionUsdPerYear: null,
    tuitionNote: "",
    fields: [],
    languages: [],
    acceptedExams: [],
    description: `Ranked #${e.rank} in the QS World University Rankings ${RANKING_EDITIONS.qs}${
      e.city ? ` — ${e.city}` : ""
    }. Detailed admission profile is being researched — verify programs, requirements and deadlines on the official website.`,
    website: "",
    dataStatus: "basic",
    lastVerified: "2026-09-27",
  });
}

universities.sort((a, b) => (a.qsRank ?? 99999) - (b.qsRank ?? 99999));

const universityBySlug = (slug: string) => universities.find((u) => u.slug === slug);
const universitiesByCountry = (name: string) =>
  universities
    .filter((u) => u.countryName === name)
    .sort((a, b) => (a.qsRank ?? 99999) - (b.qsRank ?? 99999));

export { universities, universityBySlug, universitiesByCountry };
