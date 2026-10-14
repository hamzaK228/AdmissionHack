/**
 * The application document checklist, in one place.
 *
 * It used to live inside the dashboard component, which was fine while only the
 * student saw it. The counselor now needs the same list — to show "6 of 10 ready"
 * for each student in a class — so the vocabulary moved here, where both can read
 * it and where the ids stay next to the `ah_checklist.doc_key` values they are
 * stored under.
 */

export interface ChecklistItem {
  /** stored as `ah_checklist.doc_key` */
  id: string;
  label: string;
}

export const CHECKLIST: ChecklistItem[] = [
  { id: "passport", label: "Passport (valid 6+ months beyond enrollment)" },
  { id: "transcripts", label: "Official school transcripts (sealed)" },
  { id: "diploma", label: "Diploma / completion certificate" },
  { id: "translations", label: "Sworn/notarized translations" },
  { id: "english", label: "English test certificate (IELTS/TOEFL/DET)" },
  { id: "lor", label: "Recommendation letters ×2–3 (requested early!)" },
  { id: "sop", label: "Personal statement / motivation letter draft" },
  { id: "cv", label: "CV (academic format)" },
  { id: "financial", label: "Financial proof documents (bank/GIC/blocked account)" },
  { id: "aps", label: "APS / equivalency certificate (DE·CN·IN·AE if applicable)" },
];
