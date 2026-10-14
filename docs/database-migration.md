# Moving the database off Supabase Cloud

**Status: plan, not scheduled.** The intention is to move the database onto a server we run, so it stops
costing money and stops being capped by the free tier. This file records what that move actually costs,
which decisions determine the cost, and the few things worth doing *now* while they are cheap.

## Why this is mostly an operations change, not a rewrite

Three properties of the current build make the move small:

1. **The client knows two knobs** — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Nothing else points at the host, so repointing is a rebuild with new values, not a code change.
2. **The security model lives in the database, not the app.** Every rule is an RLS policy in Postgres, and
   they all call one helper (`ah_is_counselor_of()`). Policies travel with the schema, so the consent model
   that took the longest to get right survives the move untouched.
3. **The only cloud-specific feature in use is Storage** (a single `storage.from` call site). There are no
   Edge Functions and no Realtime subscriptions — the two things that would have tied the app to Supabase
   Cloud specifically.

The product also tolerates a backend outage: the workspace is offline-first with localStorage
authoritative, so during a cutover the app still works and only sync, accounts and the counselor view go
quiet.

## The decision that determines the cost

**Option A — self-host the Supabase stack** (Postgres + PostgREST + GoTrue + Storage, via the official
Docker Compose). **Recommended.** The client does not change at all, the RLS model carries over as-is, and
the verification suite still applies. The work is: provision the box, run the stack, restore the dump,
repoint two env vars, run the suite.

**Option B — replace the stack** (plain Postgres plus a hand-written API, or a different BaaS). This means
rewriting `supabase.ts`, `workspace-sync.ts`, `community.ts`, `groups.ts`, `cloud-files.ts` and the auth
flow — and, worse, **re-implementing the consent model**, which today is enforced by the database. The
policies *are* the asset; a rewrite discards them and asks for them to be got right a second time in a
layer with no equivalent of RLS.

Only choose B if there is a reason A cannot serve.

## The one genuine risk: passwords

Users live in `auth.users`, and their passwords are bcrypt hashes, which cannot be reversed. So:

- Staying on **GoTrue** (option A): the `auth` schema comes across in the dump and everybody keeps their
  password. Another argument for A.
- Leaving **GoTrue**: either the new system accepts bcrypt hashes, or **every user must reset their
  password** — 114 existing accounts on SAThack plus whoever has joined AdmissionHack by then. That is an
  event to plan, not a footnote.

## The move, in order

1. Provision the server and run the Supabase stack (or plain Postgres, for option B).
2. Apply the schema — `supabase/migrations/0001` → `0005` in order, or restore a `pg_dump`.
3. Move the objects in the four buckets (`ah-documents`, `ah-score-reports`, `practice-tests`,
   `question-media`), **keeping the same paths**. Rows address files by path, so preserving paths means
   existing documents keep working.
4. Copy `auth.users` and the rest of the `auth` schema (option A).
5. Repoint `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, rebuild, redeploy.
6. **Prove it:** `node supabase/verify-backend.mjs`. It walks the consent model through the real API — a
   counselor is blind before the student accepts, sighted after, and blind again the moment it is revoked.
   A migration that passes is verified; one that fails hands you a specific thing to chase. It needs the
   two throwaway accounts from `supabase/create-verify-accounts.sql`.

## Worth doing now, because it is cheap now

- **Do not adopt Supabase-Cloud-only features** (Edge Functions, Realtime, cron). Each one is a thing that
  would have to be rebuilt on the way out.
- **Keep new tables in Postgres with RLS, `ah_`-prefixed.** That is what keeps this a move rather than a
  rewrite, and it is also what lets several products share one database without seeing each other's rows.
- **Keep the schema files honest.** ⚠️ `supabase/ecosystem-migration.sql` is **stale** — it predates the
  community board and its moderation, so provisioning a fresh database from it alone would produce one
  missing `ah_posts`, `ah_comments` and `ah_post_reports`. The canonical order is `migrations/0001`–`0005`.
- **Backups become ours.** Supabase takes them today; on our own box nobody does unless it is arranged. A
  nightly `pg_dump` plus a copy of the storage buckets is the minimum, and it is the thing self-hosting
  most often loses.

## What "free" still costs

A free server removes the Supabase bill and the 1 GB cap, and replaces them with somebody else's disk
limit, an uptime we own, backups we must run, and upgrades we must apply. That is usually a good trade —
but it is a trade, and the two lines above (backups, and the password decision) are worth settling in
advance rather than on the night.
