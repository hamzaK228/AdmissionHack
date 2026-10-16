# Documentation index

Start where you are, not at the top.

| If you are… | Read |
|---|---|
| **The owner**, deciding what to do next | [`../STATUS.md`](../STATUS.md) — the running log and the honest ledger of what is built, what is not, and whose action unblocks the rest |
| **The owner**, filling in what only you can | [`owner-input.md`](owner-input.md) — every blank, with suggested wording |
| **The owner**, working out what to do next | [`finish-plan.md`](finish-plan.md) — **your actions, step by step**: exact clicks, how to verify each step, and what to do if it fails |
| **The owner**, about to advertise | [`launch.md`](launch.md) — the pre-launch checklist: the email blocker, the untested signup path, and how to measure ads without tracking |
| **The owner**, on the legal and IP ground | [`ip-and-licensing.md`](ip-and-licensing.md) · [`legal.md`](legal.md) |
| **A developer**, changing code | [`architecture.md`](architecture.md) — the reference: data model, consent model, operations, failure modes |
| **A developer**, planning work | [`../PLAN.md`](../PLAN.md) — the roadmap and its phases |
| **A developer**, running it | [`../README.md`](../README.md) — install, run, the environment variables |
| **Anyone**, wondering why a decision was made | [`../STATUS.md`](../STATUS.md) — every significant choice is recorded with its reasoning, including the mistakes |

## The documents

- **[`architecture.md`](architecture.md)** — what the system is: the 14 tables, the consent model as one
  database function, why several products share one database, the AI layer, how to add content, and the
  operational commands with the failure modes they cause.
- **[`email-templates/`](email-templates/)** — the two Supabase auth emails to paste into the dashboard
  (**Confirm signup** and **Reset password**). They name the product from the signup metadata, because one
  shared Supabase project has one sender address.
- **[`finish-plan.md`](finish-plan.md)** — the step-by-step to done: the four steps that gate advertising,
  the feature work that does not depend on the owner, what needs an owner decision first, and the shortest
  path to "finished".
- **[`launch.md`](launch.md)** — what to check before paying for traffic, written from a live check of the
  system: confirmation email is on so signups depend on mail delivery, no real user has yet completed the
  signup path, and the two honest ways to measure an advert without adding tracking.
- **[`owner-input.md`](owner-input.md)** — the facts and judgements only the owner can supply: entity, address,
  contact, jurisdiction, the age policy, and the four places where the product's *voice* should be the
  owner's rather than mine.
- **[`ip-and-licensing.md`](ip-and-licensing.md)** — the IP position, including the disclosed-repository
  problem for patents, the licence options, the trademark step, and the third-party ranking-data risk.
- **[`legal.md`](legal.md)** — what remains before the privacy policy and terms are launch-ready, and why the
  minors/DPA question is the one most likely to be missed.
- **[`ecosystem.md`](ecosystem.md)** — how this product and the others share one account pool and one database.
- **[`database-migration.md`](database-migration.md)** — the plan for moving off hosted Supabase onto a server
  we run, and the two decisions to make in advance.
- **[`exam-hub-blueprint.md`](exam-hub-blueprint.md)** — the design that makes a new exam one content file plus
  one registry line.
- **[`SPEC-onboarding.md`](SPEC-onboarding.md)** — the first-visit onboarding flow.
- **[`../research/`](../research)** — the source research behind the guides: admission mechanics, exams,
  scholarships, and a teardown of comparable platforms. Content, not code.

## Still unwritten

Named rather than implied, so the gap is visible:

- **A contributing guide** — conventions, commit style, and what a reviewer would want. Only worth writing
  once someone other than the original author is committing.
- **A per-route reference** — `architecture.md` covers the shape of the app; a table of all seventeen routes
  with their purpose would help a newcomer navigate. It is the kind of thing that rots quickly, which is why
  it is not here yet.
- **A runbook for incidents** — what to do when the database is down, the AI key is exhausted, or storage
  fills. The failure-mode table in `architecture.md` is the useful half; the other half is `docs/database-migration.md`.
