# The finish plan — step by step

Everything left, in the order it has to happen, with **who** does each step. The dependency chain is the
important part: steps 1–4 gate the launch, and the rest can go in any order you like.

Legend: **[you]** needs your hands or a decision · **[me]** I can build it · **[you + me]** a decision first,
then code.

---

## Phase 0 — do these four before advertising

| # | Step | Who | Why it is in this position |
|---|---|---|---|
| 1 | **Walk the signup path by hand.** Sign up with a real address → confirm the email → sign in → fill the wizard → add a university → upload a file → create a class as a counselor, join it, revoke it. | **[you]** | `ah_profiles` is 0. This journey has **never** been completed by a real user; the 39-assertion suite proves the API with throwaway accounts, not the screens. Do this first, because it may reveal a step 2 problem. |
| 2 | **Configure custom SMTP** (Resend free = 3,000/month). Supabase → Authentication → Emails. | **[you]** | Confirmation is ON, so signups depend on mail delivery, and the built-in mailer is a testing service with a per-hour limit that a campaign burst will hit. **This one decision also unblocks deadline reminders.** |
| 3 | **Fill the six legal placeholders** — entity, address, contact email, jurisdiction, venue, liability cap. See `owner-input.md`. | **[you]** | You cannot advertise a site whose privacy policy names `[LEGAL ENTITY NAME]`. |
| 4 | **Decide how ads will be measured.** Option A is already built (the optional field plus server-side counts). Option B means a pixel, a rewritten policy and a consent banner for EU traffic. | **[you]** | Decide it on purpose rather than drifting into it. See `launch.md`. |

**After 1–4, you can advertise.** Not before — every one of them is a way to spend money on traffic that
cannot convert.

### Also worth doing early, but not blocking

| # | Step | Who |
|---|---|---|
| 5 | **Rotate the DeepSeek key** — it went through a chat transcript. | **[you]** |
| 6 | **Rename the Supabase project** from "sathack" to something neutral. It hosts several products, and the name has already caused one confusing debugging session. | **[you]** |
| 7 | **Decide the licence.** Right now the repo is public with no licence = all rights reserved. Legitimate, but should be on purpose. Options and trade-offs in `ip-and-licensing.md`. | **[you]** |
| 8 | **Check the QS/ARWU terms.** The directory republishes their rankings; attribution is not a licence. | **[you]** |
| 9 | **Have a lawyer read `/privacy` and `/terms`**, in your jurisdiction. Especially the age policy — this holds minors' passports. | **[you]** |

---

## Phase 1 — mine, no dependency on you

Do these in this order; that is the order I would pick.

| # | Step | Why | Status |
|---|---|---|---|
| 10 | **CV builder** | The last named gap in the Apply pillar, and the one document every application needs that the app cannot yet produce. Uses portfolio data that already exists. | **built 2026-10-14** |
| 11 | **Translations workflow** | Today a single tick for "sworn translations"; no way to track which documents need them, from which issuer, in what state. | next |
| 12 | **AI advisor** | The reviewer's route and key already work; this is mostly a different prompt and a conversation surface. High student value. | after 11 |
| 13 | **Timed mock tests + adaptive sections** | The practice engine has no clock and no scored full-length paper. | later |
| 14 | **More data: tuition for more universities** | Only 48 of 1,504 carry a tuition range. That caps the arcade deck *and* weakens the match engine's budget reasoning for the other ~1,456. Data entry, not code. | continuous |
| 15 | **More practice questions** (currently 60) and more Writing School models | Content volume; the engine takes a new exam in one file plus one line. | continuous |

---

## Phase 2 — needs your input first

| # | Step | Who | Needs |
|---|---|---|---|
| 16 | **Deadline reminder emails** | **[you + me]** | Your SMTP setup (step 2) plus a server-only `SUPABASE_SERVICE_ROLE_KEY`, because a cron job that mails everyone must read every user's deadlines and Supabase's REST API does not expose the email column. This is the last unbuilt item of the plan's first phase. |
| 17 | **Domain + trademark** | **[you]** | The brand decision; a school that adopts this asks who runs it. |
| 18 | **Move the database to your own server** | **[you + me]** | Two decisions first: how backups get taken, and whether everyone keeps their password (staying on GoTrue means yes). Full plan in `database-migration.md`. |
| 19 | **Per-university document requirements** | **[you + me]** | A data field the university records do not have. The country-level checker is already built; this is the finer version, and it is data entry. |

---

## Phase 3 — only if you want them

| # | Step | Note |
|---|---|---|
| 20 | **Moderation admin page** | Today hiding is one SQL statement, which is fine at this size. A page becomes worth it when reports arrive faster than you read them. |
| 21 | **Analytics** | Only by rewriting the privacy promise. Deliberately absent, and it is one of the product's strongest claims — I would keep it absent. |
| 22 | **A `/counselors` outreach push** | Counselors are the adoption channel: one teacher brings a class, one student brings nobody. The page is built and ready to send. |

---

## The shortest path to "finished"

1. Steps **1–4** — about an afternoon, mostly waiting for email to arrive.
2. Steps **10–13** — my remaining feature work; 10 is done, 11 and 12 are the ones worth having.
3. Step **16** — the moment your SMTP works, reminders become a small job rather than a project.

After that, everything left is either **content** (more data, more questions), **growth** (domain, counselors),
or **infrastructure you have already decided to defer** (self-hosting).
