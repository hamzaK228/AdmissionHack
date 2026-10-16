# Your actions — step by step

Everything that needs **your** hands, in the order it has to happen, with the exact clicks and a way to
check each one worked. Steps 1–6 gate the launch; the rest can go in any order.

> **Status as of 15 October 2026.** Custom SMTP is configured and **verified working** — a recovery email
> sent through your auth API returned 200, which it does not do if the credentials are wrong. The AI key
> works locally but has not been confirmed on the deployment. Signup has still never been walked by a real
> person from a real inbox. These three sentences are the whole launch situation.

Legend: **[you]** your hands or a decision · **[me]** I build it · **[you + me]** decision first, then code.

---

## Phase 0 — the launch blockers

### 1. Walk the signup path by hand, from a real inbox ⏱ 20 min · **[you]**

This is first because it is the only step that can invalidate the others, and because it has **never been
done**: `ah_profiles` has test rows only. The 39-assertion suite proves the API with throwaway accounts; it
does not prove the screens.

1. Open the live site in a **private window** (so no stored session confuses it).
2. Sign up with an address you can actually open — not `@example.com`.
3. Check the **inbox and the spam folder**. The mail should say "Confirm your email address".
4. Click the button. You should land on `/dashboard` **signed in**.
5. Fill the profile wizard, add a university from the directory, and upload any file to the vault.
6. Sign out, sign in again with the same password — your workspace should come back.
7. Request a password reset, and open that link too.

**If the mail never arrives:** tell me and check spam first. If spam is where it lands, that is the
deliverability problem in step 3, and it is not a bug in the app.
**If the link lands somewhere odd:** the redirect allowlist is missing an origin — see step 8.

---

### 2. Put the AI key on the deployment ⏱ 5 min · **[you]** · *highest value per minute*

Local `.env.local` has the key; the deployment may not, and the code defaults will not help because there
is nothing to default to.

1. Vercel → your project → **Settings → Environment Variables**.
2. Add these three, ticking **Production** and **Preview** for each:

   | name | value |
   |---|---|
   | `AI_API_KEY` | your DeepSeek key (`sk-…`) |
   | `AI_API_BASE_URL` | `https://api.deepseek.com` |
   | `AI_MODEL` | `deepseek-chat` |

3. **Redeploy.** Deployments → the newest → **⋯ → Redeploy**. This is not optional: Vercel does not give
   new variables to an already-built deployment.
4. Test on the live site: sign in → **writing ✍** tab → paste a paragraph → run a review. You should get
   feedback, not an error.
5. Same for the AI advisor on the **overview** tab.

**If it says the reviewer is not configured:** the variable did not reach the build — redeploy again.
**If it says quota:** the key is fine but the DeepSeek account has no credit.

---

### 3. Make the mail come from the right place ⏱ 15 min · **[you]** · *files provided*

Two products share one Supabase project, and a project has **one** sender address and **one** sender name.
That cannot be split. What can be split is what the mail *says*, because templates can read the signup
metadata — I have added `product: "AdmissionHack"` to what this app sends.

1. **Set a neutral sender name.** Authentication → **Emails → SMTP Settings → Sender name**. Not
   "SATHack" (wrong for AdmissionHack students) and not "AdmissionHack" (wrong for SAThack's). Use your own
   name or an umbrella brand — it is the only value that is right for both.
2. **Paste the two templates.** Authentication → **Emails → Templates**:
   - **Confirm signup** ← the whole of [`email-templates/confirm-signup.html`](email-templates/confirm-signup.html)
   - **Reset password** ← the whole of [`email-templates/reset-password.html`](email-templates/reset-password.html)

   They say "an account on `{{ .Data.product }}`", so the mail names the product the person actually signed
   up on.
3. **Re-test** with a real signup (step 1) and confirm the product name appears.
4. **Tell SAThack to send its own name** in the same metadata field, or its mail will say "AdmissionHack".

**If the product name comes out blank:** the template is not reading the metadata. Tell me — there is a
second way to do it, and I would rather change the code than leave a template rendering an empty sentence.

---

### 4. Delete the three test accounts ⏱ 5 min · **[you]**

They are in the same auth pool as your 114 real users.

Supabase → **SQL Editor** → paste and run:

```sql
delete from ah_counselor_links
 where counselor_id in ('fc0d18be-302a-4df0-b770-9b62a5027481','51ebbb1c-99e6-4418-ba50-634c3174f4be');

delete from ah_profiles
 where id in ('ca1bfee3-fa5a-4d2d-a9d9-4a535e662c82',
              'fc0d18be-302a-4df0-b770-9b62a5027481',
              '51ebbb1c-99e6-4418-ba50-634c3174f4be');

delete from auth.users
 where email like 'ah-qa-%@example.com';
```

**Verify:** the last statement should report 3 rows deleted. If it reports 0, they are already gone.

Then **rotate the DeepSeek key** — it travelled through a chat transcript, so treat it as exposed. Rotate
it in the DeepSeek console, then update **both** `.env.local` (locally) and the Vercel variable (step 2),
and redeploy.

---

### 5. Fill the legal placeholders ⏱ 30 min · **[you]**

You cannot advertise a site whose privacy policy says `[LEGAL ENTITY NAME]` — and it is on the live site
right now. [`owner-input.md`](owner-input.md) has suggested wording for each.

| placeholder | file | what it needs |
|---|---|---|
| `[LEGAL ENTITY NAME]` | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` | your name, or a registered company |
| `[REGISTERED ADDRESS]` | both | an address that reaches you — a virtual office is fine |
| `[CONTACT EMAIL]` | both | monitored; ideally `privacy@` rather than your personal inbox |
| `[JURISDICTION]` | `src/app/terms/page.tsx` §14 | the country whose law applies |
| `[JURISDICTION / CITY]` | same §14 | where disputes are heard |
| `[CURRENCY AND AMOUNT …]` | same §12 | for a free service, *"nothing, because no fee is charged"* is the honest answer — do not invent a number |

Plus the **age-of-consent sentence** in `privacy` §11, named for your jurisdiction — this app can hold a
minor's passport scan, which is the single most sensitive thing in it.

**Verify:** `grep -rn "\[LEGAL\|\[REGISTERED\|\[CONTACT\|\[JURISDICTION\|\[CURRENCY" src/app` returns nothing.

---

### 6. Decide the licence ⏱ 10 min · **[you]**

The repository is public with **no `LICENSE` file**, which means all rights reserved by default.
Legitimate — but it should be on purpose rather than by omission. Options and trade-offs:
[`ip-and-licensing.md`](ip-and-licensing.md). Tell me which and I will add the file.

While you are there: the directory republishes QS and ARWU rankings. **Attribution is not a licence** —
worth checking their terms before this gets traffic.

---

## Phase 1 — the domain, and the mailer done properly

Do these two together; the second needs the first.

### 7. Buy the domain and point it at Vercel ⏱ 30 min · **[you]**

1. Register the domain (any registrar; Vercel can also sell you one).
2. Vercel → project → **Settings → Domains → Add**, and follow the DNS instructions.
3. **Update `NEXT_PUBLIC_SITE_URL`** in Vercel to the new origin (no trailing slash) and **redeploy** — the
   sitemap and `robots.txt` are generated from it at build time, so they keep pointing at the `vercel.app`
   host until you do.
4. **Verify:** open `https://yourdomain/sitemap.xml` and check the `<loc>` lines use the new host.

### 8. Add the domain to the redirect allowlist ⏱ 5 min · **[you]** · *skipping this breaks signup*

The login flow builds its redirect from `location.origin`, and GoTrue **silently** falls back to the
default Site URL if the origin is not allowed — so the confirmation link lands somewhere that cannot finish
the job, with no error anywhere.

Supabase → Authentication → **URL Configuration**:
- **Site URL** → your new domain.
- **Redirect URLs** → add `https://yourdomain/**` and keep `http://localhost:3100/**` for local work.

**Verify:** sign up from the new domain and complete the confirmation (step 1 again, on the real domain).

### 9. Move to a transactional mailer ⏱ 45 min · **[you]**

Gmail works — I verified yours does — but three things will bite: roughly **500 recipients/day**, worse
deliverability from a `@gmail.com` sender, and the account can be **suspended** for automated bulk mail.
That account is load-bearing for signups in **both** products, so a suspension is an outage for both.

1. Sign up with a transactional provider — **Resend** (3,000/month free, simplest), or Postmark / Brevo /
   SendGrid.
2. **Verify the domain** at the provider and add the **SPF and DKIM** DNS records it gives you. This step
   is what gets you out of spam, more than anything else.
3. In Supabase → Authentication → Emails → SMTP Settings, replace the Gmail host, port, username and
   password with the provider's, and set **Sender email** to something like `noreply@yourdomain`.
4. **Verify:** sign up with a real address and confirm it lands in the **inbox**, not spam.

### 10. Optional, later: per-product auth mail ⏱ half a day · **[you + me]**

If you want the From address itself to differ per product (`auth@admissionhack.com` vs
`auth@sathack.com`), the mail has to be sent by each app's own backend rather than by GoTrue: generate the
link server-side with the Admin API's `generateLink` (which does not send) and email it through the
provider yourself. It needs the **service-role key** — server-side only, never in the browser, because it
bypasses every row-level policy you have. Worth doing once AdmissionHack is the front door; not before.

---

## Phase 2 — the data, which is the thing that makes it good

### 11. Grow the university data ⏱ weeks · **[you]**, then **[me]** to surface it

1,458 of 1,506 university pages are a rank, a country and a city. This is the gap between "works" and
"good", and it is a **sourcing decision**, not a coding one. **Do not scrape** — it is both a legal risk
and a data-quality risk.

**The three fields that pay off most, in this order:**

1. **English requirement** — what the university asks (IELTS/TOEFL/DET minimums, or "taught in English, no test")
2. **Application deadline(s)** — the dates that decide a student's year
3. **Application fee** — the number people are surprised by

**Where it goes:** `src/data/universities.ts`, which already holds 48 curated records. One entry per
university, in the same shape as the existing ones:

```ts
{
  slug: "university-of-toronto",     // must match the directory slug (check /universities/<slug>)
  name: "University of Toronto",
  country: "CA",                     // ISO-2, used for the flag
  city: "Toronto",
  founded: 1827,
  selectivity: "high",              // "very-high" | "high" | "moderate" | "open" | "unknown"
  tuitionUsdPerYear: { min: 45000, max: 65000 },
  tuitionNote: "international rate, 2026 entry",
  fields: ["Computer Science", "Engineering & Tech"],   // must be values from FIELDS in src/data/types.ts
  languages: ["English"],
  acceptedExams: ["ielts", "toefl", "det"],             // ids from /exams
  description: "One or two sentences, factual, no marketing.",
  website: "https://www.utoronto.ca",
  dataStatus: "curated",
  lastVerified: "2026-10-15",
}
```

The directory merges these over the 1,506 basic profiles automatically — a matching slug upgrades the
page, and a new slug adds one. Nothing else needs changing.

**If you would rather supply it as a spreadsheet**, give me the file with those columns and I will write
the importer — that is faster than typing TypeScript, and it makes the next batch easier too.

**Then tell me**, because these become buildable the moment the data exists: the requirements matrix, the
cost chart, the field/program pages, and a genuine fit radar.

---

## Phase 3 — mine, and what is blocking each

| # | Item | Blocked by | Notes |
|---|---|---|---|
| 12 | **Deadline reminder emails** | **nothing now** — your SMTP works | Needs a server-only `SUPABASE_SERVICE_ROLE_KEY` on Vercel, because a cron that mails everyone must read every user's deadlines and the REST API does not expose the email column. Say the word and I will build it: opt-in, weekly digest, off by default. |
| 13 | **Field / program pages** ("Computer Science in Germany") | step 11 | Highest-intent search traffic in this niche. Today the pages would be nearly empty — field data exists for 48 universities. |
| 14 | **Requirements matrix** | step 11 | `acceptedExams` exists on 48 of 1,506, so the grid is mostly blank cells today. |
| 15 | **Cost-of-degree chart** | data | There is **no living-cost data** in the repo, so it could chart tuition only — which would misrepresent a decision that is mostly about living costs. |
| 16 | **Country-scoring world map** | data | 13 of 106 countries have any metrics at all. |
| 17 | **A true fit radar** | per-axis scores | The engine's factors are three-valued (met / not met / not published), so today it draws a spine instead. A radar needs magnitudes. |
| 18 | **Adaptive sections in the practice banks** | nothing | The timer exists now; adaptive ordering by difficulty is the remaining half. |
| 19 | **More practice questions** (60 today) | content | The engine takes a new exam in one file plus one line. |

---

## Phase 4 — only if you want them

| # | Item | Note |
|---|---|---|
| 20 | **Moderation admin page** | Hiding a post is one SQL statement, which is fine at this size. Worth a page when reports arrive faster than you read them. |
| 21 | **Analytics** | Only by rewriting the privacy promise. Deliberately absent, and one of the product's strongest claims — I would keep it absent. |
| 22 | **A `/counselors` outreach push** | Counselors are the adoption channel: one teacher brings a class, one student brings nobody. The page is built and ready to send. |
| 23 | **Self-hosting the database** | Two decisions first: how backups get taken, and whether everyone keeps their password. Full plan in [`database-migration.md`](database-migration.md). |

---

## The shortest path to "finished"

1. **Steps 1–6** — one afternoon, mostly waiting for email. After these, you can advertise, and I would not
   advertise before them: each is a way to spend money on traffic that cannot convert.
2. **Steps 7–9** — one more afternoon, once the domain is chosen.
3. **Step 11** — the weeks-long one, and the only one that changes how good the product is rather than how
   finished it is.

After that, everything left is **content** (more data, more questions), **growth** (counselors, outreach),
or **infrastructure you have already decided to defer**.
