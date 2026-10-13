# AdmissionHack

A global university-admission platform: a directory of 1,504 QS-ranked universities with
verified QS 2027 and ARWU 2025 positions, step-by-step admission guides, exam hubs, country
guides, and a personal workspace where an applicant builds their shortlist, tracks deadlines,
keeps their documents, portfolio and scores — and can invite a counselor, or join a
counselor's group, to review it.

**Status: not finished, but the hard parts are done and verified.** The directory, the match
engine, the workspace and the whole accounts/consent backend are built and tested. The exam-prep
academy, community/mentorship, visa/housing and AI advisor are not started. `STATUS.md` is the
honest ledger; `PLAN.md` is the plan it is measured against.

## Running it locally

```bash
npm install
npm run dev            # http://localhost:3100
```

**Port 3100, not 3000** — this machine already runs another app on 3000.

For a production-shaped run (the site is fully prerendered, ~1,550 pages):

```bash
npm run build
npx next start -p 3100
```

## The backend is optional by design

With no environment configured, the whole product still works: the workspace lives in the
browser (localStorage + IndexedDB) and nothing is uploaded. Accounts, cloud sync, the
six-folder document workspace and counselor groups switch on when you add:

```bash
cp .env.example .env.local     # then fill in the two values
```

Apply both migrations to a Supabase project first:

```
supabase/migrations/0001_admissionhack_schema.sql          — tables, RLS, storage buckets
supabase/migrations/0002_document_folders_and_groups.sql   — document folders, counselor groups
```

Use the project's **publishable** key (`sb_publishable_…`), not the legacy anon JWT. Both values
are public — they ship to the browser — and grant only what the RLS policies allow, which is
nothing until someone signs in. They are inlined at build time, so **changing them needs a
rebuild**.

One dashboard setting is required for signups to complete: **Authentication → Email → turn off
"Confirm email"**. With it on, `signUp()` sends a confirmation mail and Supabase's default SMTP
rate-limits almost immediately, so a new account never gets past the email step.

## Verifying the security model

The database holds passports, transcripts and official exam reports, so the access rules get a
regression test rather than a promise:

```bash
node supabase/verify-backend.mjs      # 39 assertions, all passing
```

It runs through the real HTTP API with real JWTs — not a simulation of RLS — and asserts the
things that actually matter: a counselor sees **nothing** before a student accepts and nothing
again the moment access is revoked; a student cannot mark their own score report verified, nor
write into anyone else's workspace; a counselor can verify a report but cannot rewrite the
evidence they attested to; a guessed storage path is not a way in; anonymous reads nothing at all.

It needs two throwaway accounts to exist first and cannot create them itself (see the header of
the script for the SQL, which inserts into `auth.users` **and** `auth.identities` — a bare
`auth.users` row is not enough for password sign-in).

## How access is decided

One place decides who may read a student's data — the `ah_is_counselor_of()` function — and every
table policy and the storage read helper call it. A counselor qualifies by an accepted 1:1 invite,
**or** by owning a group the student joined. That is why adding groups reached all nine tables and
the files in storage without touching another policy.

- Every table is deny-by-default via RLS; the anonymous role has no privilege on them at all.
- Consent is explicit and revocable: an invite is accepted by the student, a group is joined by
  entering its code. `ah_group_members` has **no INSERT policy** — joining goes only through
  `ah_join_group()`, so nobody can enumerate groups or codes.
- A score report is immutable to its owner. The owner has no UPDATE policy, and a counselor holds
  a column-level grant covering only `is_verified`, `verified_by`, `verified_at`.
- Documents live in private buckets at `{user_id}/{folder}/{name}`; the first path segment is what
  the storage policy checks, and counselor access follows the same segment.

## Layout

```
src/app/                 11 routes; everything else is dynamic segments off them
src/data/                research-backed content: universities, countries, exams, scholarships
src/components/          globe, journey, motion, dashboard, account
  dashboard/             the workspace: folders, exams, portfolio, match, sync
  account/               auth panel, counselor view, groups
src/lib/                 supabase client, workspace sync, cloud files, groups, match engine
supabase/migrations/     the schema, guarded so either file can be re-applied
supabase/verify-backend.mjs
docs/, research/         the specs and research the content is built from
```

## Deploying

Vercel is the obvious host for a Next.js app of this shape. Two caveats: the two `NEXT_PUBLIC_*`
values must be set in the host's environment (and the build re-run if they change), and
`src/app/sitemap.ts` still points at a placeholder domain until the brand and domain are locked.

## License

No license file yet — all rights reserved by default. Add one before making the repository
public if that is not what you want.
