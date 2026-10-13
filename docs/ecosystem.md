# The admission ecosystem — how the two products fit together

Two live products, one story:

- **SAThack** — [sathack-smoky.vercel.app](https://sathack-smoky.vercel.app) — the SAT itself: a
  bank of official College Board questions, an adaptive diagnostic, drills, timed modules,
  error-log review, full-length mocks and a score predictor. Repo
  [github.com/hamzaK228/SAThack](https://github.com/hamzaK228/SAThack).
- **AdmissionHack** — [admissionhack-seven.vercel.app](https://admissionhack-seven.vercel.app) —
  everything after the score: the university directory, country guides, scholarships, exam guides,
  and a workspace holding documents, lists, deadlines, scores and a counselor.

The hand-off between them is the whole ecosystem argument: SAThack answers "what will I score",
AdmissionHack answers "where does that score take me, what does it cost, what do I submit, and when".

## What is connected today (verified live, 2026-10-13)

- **AdmissionHack → SAThack.** A "full SAT hub" card on `/exams/sat`, plus a pointer from the SAT
  practice intro, both driven by `src/data/hubs.ts` — a registry keyed by exam, so a third site for
  another exam is a data entry rather than a page edit.
- **SAThack → AdmissionHack.** An "After the SAT" column in SAThack's footer with three links (the
  platform, the university directory, scholarships). Its base URL sits in one constant in
  `src/components/Footer.tsx`, so a custom domain later is a one-line change.
- The copy is deliberate about **provenance**: SAThack drills *official* College Board questions, the
  in-platform set is *original* writing. Both are useful and they are not interchangeable, so each
  side says which one you are looking at.

## The gap: two account pools

Each app authenticates against its **own** Supabase project, so a login in one does nothing in the
other:

| | project | who |
|---|---|---|
| SAThack | `sathack` (`arpwvfphzryaaxrvegju`) | 114 existing users, plus its questions, attempts, duels, community tables |
| AdmissionHack | `admissionhack` (`nkqjlccomtcqwsawbndp`) | the `ah_*` tables |

**A shared login is only possible if both authenticate against one project.** No amount of linking
gets around that; it is an identity fact, not a routing one.

## The plan: consolidate onto the `sathack` project

This is feasible precisely because AdmissionHack's schema was written to allow it:

- every table is **`ah_`-prefixed**, so it lives in the shared `public` schema with no collision
  against SAThack's `profiles`, `questions`, `practice_attempts`, `duels`, `community_*` and the rest;
- there is **no trigger on `auth.users`** — deliberate, so a fault in this schema can never roll back
  SAThack's signups, which is the failure mode that would matter most;
- storage buckets are namespaced **`ah-documents` / `ah-score-reports`**, so question media and
  student passports never share a namespace, and the storage read helper ignores foreign buckets
  instead of raising on them.

Steps, in order:

1. Apply `supabase/migrations/0001_admissionhack_schema.sql`, then `0002_document_folders_and_groups.sql`
   to the **`sathack`** project. Both files are guarded and re-runnable. (One quirk found the hard way:
   `CREATE TRIGGER` stalls on that project — this schema defines none, so there is nothing to hit.)
2. Repair anything half-applied if a call times out: re-run the same file; that is what the guards are for.
3. Repoint AdmissionHack's environment at the sathack project — `.env.local` and the Vercel project
   (production **and** preview):
   `NEXT_PUBLIC_SUPABASE_URL=https://arpwvfphzryaaxrvegju.supabase.co` and that project's publishable key.
4. Redeploy. Nothing else changes in the app.
5. Verify with `node supabase/verify-backend.mjs` (it reads the env), then sign in on the deployed site.
6. Keep the `admissionhack` project **paused, not deleted**, as the rollback.

Afterwards, SAThack's existing users have an AdmissionHack workspace the moment they open it —
`ah_ensure_profile` creates their row on first authenticated load. One login, one identity.

## The trade-offs, honestly

- **Shared blast radius.** A bad migration in this schema now runs in the same database as the live
  SAT app. The `ah_` prefix and the no-trigger rule keep that risk small; they do not make it zero.
- **Shared 1 GB of free storage.** Question media and student documents would compete for it. Uploads
  are capped at 12 MB per file, but the ceiling is real and shared.
- **A project slot frees up**, because AdmissionHack's own project can then be paused.
- **If that trade is unwanted:** keep two projects, accept two logins, keep the links. Only the shared
  identity is lost — and that is a legitimate choice rather than a failure.

## Going further, once the projects are one

- A mock score from SAThack appearing in the AdmissionHack exams tab becomes straightforward: same
  JWT, same database, so it is a small table read rather than an API.
  Until then it needs an explicit export/import or a bridge endpoint.
- A student's admission workspace could then inform their SAT plan (a target university's requirement
  as the score goal), which is the reverse direction and the more interesting one.
