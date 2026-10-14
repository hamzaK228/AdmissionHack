# Architecture

A reference for someone who has to change this code, rather than a log of what happened — `STATUS.md` is
the log. If you are looking for *why* a decision was made on a given day, it is in there; this file says what
the thing is.

## What it is, in one paragraph

A statically-generated Next.js site that is a university admission guide, plus a client-side dashboard that
holds one applicant's whole application — universities, scores, deadlines, documents, portfolio, essays —
and syncs to a shared Postgres database when the student signs in. A counselor can read students' workspaces
with the student's consent. A small AI feature reviews essay drafts. Nothing about the core product requires
an account: the dashboard works signed-out out of the browser's own storage.

## The shape of the application

| Layer | Where | Notes |
|---|---|---|
| Public content pages | `src/app/**/page.tsx` | Mostly static (`○`) or generated per slug. Guides, directory, exams, countries, scholarships, writing, arrival, counselors, play |
| The workspace | `src/app/dashboard/page.tsx` → `components/dashboard/**` | One client component tree, 15 tabs, state in a React context backed by `localStorage` |
| Content data | `src/data/*.ts` | Typed literal data. `directory.ts` merges 48 curated universities with 1,504 QS-ranked ones |
| Domain logic | `src/lib/*.ts` | Pure or thin: `applications`, `roadmap`, `arrival`, `requirements`, `match-engine`, `practice`, `play` |
| Cloud client | `src/lib/supabase.ts` + `workspace-sync.ts`, `groups.ts`, `community.ts`, `cloud-files.ts` | Optional by design; every call site treats "not configured" as "run locally only" |
| Server route | `src/app/api/essay-review/route.ts` | The only server-side endpoint |

Two deliberate platform choices worth knowing before you change anything:

- **Content visibility never depends on a JS animation frame.** Entrance animations are CSS transitions
  toggled by an `IntersectionObserver`. An earlier version used a rAF loop and content stayed invisible on
  throttled tabs, which is a genuine hazard, not a nicety.
- **`process.env.NEXT_PUBLIC_*` is inlined at build time.** Changing a Supabase URL or key requires a
  **rebuild**, and on Vercel adding a variable requires a **redeploy** — an existing deployment does not
  pick up a new environment variable.

## The data model

Fourteen tables, all `ah_`-prefixed, living in the shared `public` schema beside another product's tables.

**Workspace (one student's private data)**
`ah_profiles` · `ah_exam_results` · `ah_university_lists` · `ah_deadlines` · `ah_portfolio` ·
`ah_documents` · `ah_checklist` · `ah_score_reports`

**Consent and classes**
`ah_counselor_links` (a one-to-one counselor invitation) · `ah_groups` + `ah_group_members` (a class)

**Community and moderation**
`ah_posts` · `ah_comments` · `ah_post_reports`

**Storage buckets:** `ah-documents`, `ah-score-reports` — private, addressed as `{user_id}/{folder}/{name}`.

### The consent model — the one rule to understand

Everything about counselor access reduces to a single database function, `ah_is_counselor_of(student)`,
which is true when there is an **accepted** link *or* the counselor owns a group the student has joined.
Every table policy and the storage read helper call it, so one rule governs all of them and there is no
second copy to drift.

Three consequences that are enforced by the database rather than by the UI:

1. **A counselor who has not been accepted sees nothing at all** — not an empty page, no rows.
2. **Access is read-only.** No policy grants a counselor write access to a student's rows.
3. **Revocation is immediate.** A student leaving a group, or declining a link, ends access on the next query.

A student joins a class by entering a code, and that act *is* the consent: there is deliberately **no INSERT
policy** on `ah_group_members`, so membership can only be created by `ah_join_group()`, a `SECURITY DEFINER`
function. That is also why a student cannot enumerate groups or codes.

Board posts stamp their author server-side (`ah_stamp_author`) rather than trusting the client, so nobody can
post under another name — and so the board never needs to read another student's profile row, which is
deliberately closed. Authors have INSERT and DELETE only: no UPDATE policy exists, which is what stops a
moderated author from un-hiding themselves.

## Why several products can share one database

Every object is prefixed (`ah_` for tables, `ah-` for buckets), and **no trigger is defined on
`auth.users`** — so a fault in this schema can never roll back another product's signups, and the schema
stays portable between a shared database and a dedicated one. `docs/ecosystem.md` covers the arrangement;
`docs/database-migration.md` covers leaving for a self-hosted server.

## The AI layer

One route, `POST /api/essay-review`, and it is deliberately boring:

- **Provider-agnostic.** `AI_API_KEY` / `AI_API_BASE_URL` / `AI_MODEL`, defaulting to DeepSeek. Moving
  vendors is configuration, not code — which has already been worth it once.
- **Server-side only.** No `NEXT_PUBLIC_` prefix; a key in the client bundle is a key given away.
- **Gated behind sign-in**, verified against Supabase's `/auth/v1/user`. The service is free to students and
  the operator pays per review, so an open endpoint is somebody else's bill.
- **Optional.** With no key, `GET` reports `configured: false` and the writing tab says so instead of
  showing a form that fails. The same posture as the Supabase client.
- **Error codes carry advice.** `upstream_quota` (no credit — and note DeepSeek says this with `402` while
  Zhipu used `429` + code `1113`, which looks like a rate limit), `upstream_auth`, `upstream_model`,
  `upstream_busy`, `sign_in_required`.

## Adding content

- **A practice exam:** one file in `src/data/practice/` plus one line in its registry. The hub, the exam
  page and the runner all read `hasPractice()`. This has held three times.
- **A journey step or country:** a typed entry in `src/data/`. Pages are generated from the data.
- **A dashboard tab:** one component in `components/dashboard/` plus an entry in the `TABS` array in
  `dashboard-client.tsx`.

## Operations

```bash
npm run dev            # bare `next dev` — takes whatever port is free, 3000 by default
npx tsc --noEmit       # types
npm run build          # static pages + the one API route
node supabase/verify-backend.mjs   # 39 assertions through the real API (the security suite)
git push origin main   # deploys to production; the repo is connected to Vercel
```

**Common failure modes, in the order they actually happen:**

| Symptom | Cause |
|---|---|
| The account tab says "accounts not configured" | `NEXT_PUBLIC_SUPABASE_*` missing **at build time** — they are inlined; redeploy after setting them |
| Env change had no effect in production | Vercel does not give a new variable to an already-built deployment — redeploy |
| The reviewer says "not configured" | `AI_API_KEY` unset (or the deploy predates it) |
| Data vanished after a sync | The workspace sync is a **whole-workspace replace**, not a merge — a partial local state pushes over a fuller cloud one. This is deliberate and is the layer to change if collaborative editing ever arrives |
| A student's list emptied in the cloud | The tracker columns were missing while a delete-then-insert ran; hence the column probe that now runs *before* the delete |

## Where the documentation lives

`docs/README.md` is the index. The short version: `PLAN.md` is the roadmap, `STATUS.md` is the running log
and the honest ledger, this file is the reference, `docs/owner-input.md` is the list of things only the
owner can write, and `docs/ip-and-licensing.md` and `docs/legal.md` cover the legal ground.
