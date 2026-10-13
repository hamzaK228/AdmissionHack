/**
 * The document workspace's six folders.
 *
 * These are the folders a counselor expects an applicant to have, and the
 * advice is the method itself: pick a CV template you like and adapt it, scan
 * certificates with the phone you already have, keep identity documents in the
 * private folder.
 *
 * The `id` values are a contract with the database — the
 * `ah_documents_folder_check` constraint in 0002 lists exactly these six — so if
 * this array changes, that constraint has to change in the same commit.
 */

export type FolderId =
  | "tests"
  | "cv-essays"
  | "recommendation-letters"
  | "college-list"
  | "extracurriculars"
  | "personal";

export interface DocumentFolder {
  id: FolderId;
  label: string;
  icon: string;
  blurb: string;
  advice: string[];
  /** identity documents — still private, but worth saying so plainly */
  sensitive?: boolean;
}

export const DOC_FOLDERS: DocumentFolder[] = [
  {
    id: "tests",
    label: "Tests",
    icon: "🧪",
    blurb: "Test scores, and everything the testing bodies sent you.",
    advice: [
      "Put the official score reports here — the IELTS Test Report Form, the TOEFL report, the College Board report.",
      "The exams tab also files a report against each exam; either place is fine, and both are read the same way.",
      "Name files so you can tell them apart: ielts-2026-05.pdf, not scan0043.pdf.",
    ],
  },
  {
    id: "cv-essays",
    label: "CV, Essays",
    icon: "✍️",
    blurb: "Your CV, and every draft of your personal statement.",
    advice: [
      "For the CV: find a template online that you actually like, then edit it to fit you. A clean single page beats a decorated two.",
      "Keep every essay draft. Version the names (ps-v3) so you can see the history and never overwrite the one you liked.",
      "Export to PDF before uploading, so the layout cannot drift when a counselor opens it.",
    ],
  },
  {
    id: "recommendation-letters",
    label: "Recommendation Letters",
    icon: "💬",
    blurb: "Letters from teachers, counsellors and employers.",
    advice: [
      "Ask early — give each writer at least a month, and send a brag sheet of what you actually did in their class.",
      "Upload whatever you have: a signed letter, or the confirmation that it was submitted.",
      "Some schools submit letters directly and never show them to you. Note that here, so you do not wait for a file that is never coming.",
    ],
  },
  {
    id: "college-list",
    label: "College List",
    icon: "🎯",
    blurb: "Your shortlist, the requirements you found, and the deadline plan.",
    advice: [
      "Your Dream / Target / Safe lists live in the universities tab — this folder holds the research behind them.",
      "Keep a PDF or screenshot of each programme's entry requirements. Pages change between the day you check and the day you apply.",
      "Record the funding deadline separately from the admission deadline. They are rarely the same day.",
    ],
  },
  {
    id: "extracurriculars",
    label: "Extracurricular Activities",
    icon: "🏅",
    blurb: "Certificates and proof for everything you did outside class.",
    advice: [
      "Scan your certificates with your phone — a straight, well-lit photo is enough, no scanner required.",
      "One file per activity, named after the activity and the year.",
      "Upload the certificate even when the activity feels minor: proof is what turns a claim into a fact.",
    ],
  },
  {
    id: "personal",
    label: "Personal files",
    icon: "🔒",
    blurb: "Identity documents. Only you, and a counselor you accept, can open these.",
    advice: [
      "Scan the photo page of your passport, and check the expiry covers six months past your enrolment date.",
      "Birth certificate scans, plus any official translation you already hold.",
      "These live in a private bucket. Access is enforced by the database on every read, not by a toggle on this screen.",
    ],
    sensitive: true,
  },
];

export const FOLDER_IDS: FolderId[] = DOC_FOLDERS.map((f) => f.id);

export function folderLabel(id: string): string {
  return DOC_FOLDERS.find((f) => f.id === id)?.label ?? "Unsorted";
}

export function isFolderId(v: string): v is FolderId {
  return (FOLDER_IDS as string[]).includes(v);
}
