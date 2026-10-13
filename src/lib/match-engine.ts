import type { Profile, ExamResults, Tier } from "@/components/dashboard/store";

/** Slim university shape the dashboard ships to the client for matching. */
export interface SlimUni {
  slug: string;
  name: string;
  countryName: string;
  qsRank: number | null;
  arwuRank?: number | string | null;
  selectivity: string;
  tuitionMin: number | null;
  tuitionMax: number | null;
}

export interface MatchReason {
  label: string;
  detail: string;
  ok: boolean | null; // true = helps, false = hurts, null = neutral info
}

export interface MatchCandidate {
  uni: SlimUni;
  chance: number; // 0..1 estimated admit chance
  category: Tier;
  reasons: MatchReason[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** How hard a university is to get into, 0 (easy) .. 1 (brutal). */
function difficulty(u: SlimUni): number {
  switch (u.selectivity) {
    case "very-high": return 0.92;
    case "high": return 0.78;
    case "moderate": return 0.58;
    case "open": return 0.42;
  }
  // unknown selectivity → derive from rankings
  if (u.qsRank != null) {
    if (u.qsRank <= 25) return 0.92;
    if (u.qsRank <= 50) return 0.88;
    if (u.qsRank <= 100) return 0.78;
    if (u.qsRank <= 200) return 0.7;
    if (u.qsRank <= 400) return 0.6;
    if (u.qsRank <= 800) return 0.5;
    return 0.42;
  }
  if (typeof u.arwuRank === "number") {
    if (u.arwuRank <= 50) return 0.85;
    if (u.arwuRank <= 200) return 0.7;
    if (u.arwuRank <= 500) return 0.55;
  }
  if (typeof u.arwuRank === "string") {
    const low = parseInt(u.arwuRank, 10);
    if (Number.isFinite(low)) {
      if (low <= 200) return 0.7;
      if (low <= 500) return 0.55;
      if (low <= 800) return 0.48;
    }
  }
  return 0.5;
}

/** The applicant's academic strength, 0..1 — from whichever scores exist. */
export function academicsScore(profile: Profile, exams: ExamResults): number | null {
  const parts: { v: number; w: number }[] = [];

  const gpa = parseFloat(profile.gpa ?? "");
  const scale = parseFloat(profile.gpaScale ?? "4") || 4;
  if (Number.isFinite(gpa) && scale > 0) parts.push({ v: clamp(gpa / scale, 0, 1), w: 0.4 });

  const ielts = parseFloat(exams.ieltsOverall ?? profile.ielts ?? "");
  if (Number.isFinite(ielts)) parts.push({ v: clamp(ielts / 9, 0, 1), w: 0.3 });

  const toefl = parseFloat(exams.toefl ?? profile.toefl ?? "");
  if (Number.isFinite(toefl)) parts.push({ v: clamp(toefl / 120, 0, 1), w: 0.3 });

  const satE = parseInt(exams.satEbrw ?? profile.sat ?? "", 10);
  const satM = parseInt(exams.satMath ?? "", 10);
  if (Number.isFinite(satE) && Number.isFinite(satM)) {
    parts.push({ v: clamp((satE + satM) / 1600, 0, 1), w: 0.3 });
  }

  if (parts.length === 0) return null;
  const wsum = parts.reduce((s, p) => s + p.w, 0);
  return parts.reduce((s, p) => s + p.v * p.w, 0) / wsum;
}

function englishRequirementFor(diff: number): number {
  return diff > 0.8 ? 7.0 : 6.5;
}

/**
 * Heuristic match, v1 — transparent on purpose:
 * chance = 1 − difficulty + (academics − 0.65) × 0.55, clamped.
 * Categories: ≥0.65 safe · 0.35–0.65 target · <0.35 dream.
 */
export function matchUniversities(
  unis: SlimUni[],
  profile: Profile,
  exams: ExamResults,
  opts: { onlyTargetCountry: boolean; hideOverBudget: boolean },
): { dream: MatchCandidate[]; target: MatchCandidate[]; safe: MatchCandidate[]; academic: number | null } {
  const academic = academicsScore(profile, exams);
  const english = parseFloat(exams.ieltsOverall ?? profile.ielts ?? "");
  const hasEnglish = Number.isFinite(english);
  const toefl = parseFloat(exams.toefl ?? profile.toefl ?? "");
  const targetCountry = profile.country !== "undecided" ? profile.country : null;

  const out: MatchCandidate[] = [];
  for (const u of unis) {
    const diff = difficulty(u);
    const chance = clamp(1 - diff + ((academic ?? 0.65) - 0.65) * 0.55, 0.04, 0.96);
    const category: Tier = chance >= 0.65 ? "safe" : chance >= 0.35 ? "target" : "dream";

    const reasons: MatchReason[] = [];

    if (academic != null) {
      reasons.push({
        label: "your academics",
        detail: `strength ${Math.round(academic * 100)}/100 vs ${Math.round(diff * 100)}/100 selectivity`,
        ok: chance >= 0.5 ? true : null,
      });
    }
    if (u.tuitionMax != null) {
      const within = u.tuitionMax <= profile.budget;
      reasons.push({
        label: "tuition",
        detail: within
          ? `≈$${Math.round(u.tuitionMax / 1000)}k/yr — within your $${Math.round(profile.budget / 1000)}k budget`
          : `≈$${Math.round(u.tuitionMax / 1000)}k/yr — about $${Math.round((u.tuitionMax - profile.budget) / 1000)}k over budget`,
        ok: within,
      });
    } else {
      reasons.push({ label: "tuition", detail: "not published — check the official site", ok: null });
    }
    if (hasEnglish || Number.isFinite(toefl)) {
      const req = englishRequirementFor(diff);
      const myBand = hasEnglish ? english : toefl / 120 * 9;
      const meets = myBand >= req;
      reasons.push({
        label: "English",
        detail: meets
          ? `your ${hasEnglish ? `IELTS ${english}` : `TOEFL ${toefl}`} covers the typical ${req}`
          : `typical requirement ${req} — your score is below`,
        ok: meets,
      });
    }
    if (targetCountry) {
      const match = u.countryName === targetCountry;
      reasons.push({
        label: "country",
        detail: match ? `matches your target country` : `${u.countryName} — not your stated target`,
        ok: match ? true : null,
      });
    }
    if (u.qsRank != null && u.qsRank <= 200) {
      reasons.push({ label: "rank", detail: `QS #${u.qsRank} globally`, ok: true });
    }

    // filters
    if (opts.onlyTargetCountry && targetCountry && u.countryName !== targetCountry) continue;
    if (
      opts.hideOverBudget &&
      u.tuitionMin != null &&
      u.tuitionMin > profile.budget * 1.15
    ) {
      continue;
    }

    out.push({ uni: u, chance, category, reasons });
  }

  const sortFn = (a: MatchCandidate, b: MatchCandidate) =>
    b.chance - a.chance || (a.uni.qsRank ?? 9999) - (b.uni.qsRank ?? 9999);

  return {
    dream: out.filter((c) => c.category === "dream").sort(sortFn),
    target: out.filter((c) => c.category === "target").sort(sortFn),
    safe: out.filter((c) => c.category === "safe").sort(sortFn),
    academic,
  };
}
