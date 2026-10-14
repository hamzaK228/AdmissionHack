# Before you spend money on advertising

A checklist for the moment you start promoting the site — Instagram account, first paid posts. Written
after checking the live system on **14 October 2026**, so the facts below are observed, not assumed.

## The headline: nobody has ever signed up

`select count(*) from public.ah_profiles;` → **0**.

All 114 confirmed accounts in the shared database belong to the other product. That means **the entire
signup-to-sync journey has never been completed by a real user in production.** The 39-assertion suite
(`node supabase/verify-backend.mjs`) proves the *API and the consent model* with throwaway accounts; it does
not prove the *screens*. Before paying for traffic, walk the whole path once, by hand:

1. Sign up with a real email address you can open.
2. Click the confirmation link, and check where it lands.
3. Sign in, fill the profile wizard, add a university, tick a document.
4. Upload a file in the document vault.
5. Open `/counselors` in another browser as a counselor, create a class, join it as the student, revoke it.

Anything that breaks in that walk will break for every visitor an advert sends you — silently, and at your
expense.

## Blocker 1 — email, and it is the serious one

**Confirmation is ON:** the auth settings report `mailer_autoconfirm: false`. A new student therefore
**cannot sign in until they click a link in an email.** The signup path depends entirely on mail delivery.

Delivery currently goes through **Supabase's built-in mailer**, which is documented as intended for testing
and is heavily rate-limited (a small number of messages per hour). The other product's 114 users arrived
organically over weeks, so it never mattered. **An advertising campaign produces signup bursts, and that is
exactly when a testing mailer fails** — each failure is a lost student who will not try twice.

**Fix: configure a custom SMTP provider.** Resend's free tier covers 3,000 emails a month, which is far
beyond what an early campaign will generate. Check the current state in the Supabase dashboard under
**Authentication → Emails**.

**The good news is that this one decision pays for itself twice:** the same SMTP provider unblocks
**deadline reminders**, the last unbuilt item of the plan's first phase. Email was blocking both, and only
one of them is optional.

## Blocker 2 — the legal placeholders are visible on the live site

`/privacy` and `/terms` name `[LEGAL ENTITY NAME]`, `[REGISTERED ADDRESS]` and `[CONTACT EMAIL]` in
brackets. A visitor from an advert who clicks through to a policy with placeholders in it has a reasonable
ground for trusting the whole thing less. `docs/owner-input.md` lists every blank with suggested wording.

## Blocker 3 — decide how ads will be measured, on purpose

The Privacy Policy states, as fact, that this service runs **no analytics, no advertising, no tracking and
no cookies**. Instagram advertising normally wants a pixel for conversion tracking. Choose deliberately,
because drifting into it makes the policy false the day it ships:

**Option A — keep the promise (recommended).** Measure with two honest sources:
- **The optional question now on the profile wizard:** *"how did you hear about us?"*, asked once, skippable,
  stored on the profile. No tracking, no cookie, and it answers the question that matters.
- **Server-side counts**, because a signup *is* a row:

```sql
-- signups per day: does the campaign actually produce accounts?
select date_trunc('day', created_at)::date as day, count(*) as signups
from public.ah_profiles group by 1 order by 1 desc limit 30;

-- where they said they came from
select coalesce(referral_source, '(not said)') as channel, count(*) as students
from public.ah_profiles group by 1 order by 2 desc;
```

Attribution will be approximate. It is also free, honest, and consistent with the product's strongest
privacy claim.

**Option B — add a pixel or UTM tracking.** Then the policy must be rewritten, and if you are taking traffic
from the EU you will need a cookie/consent banner. Do it as a decision with its consequences, not as a
shortcut.

## Two operational ceilings to keep in mind

- **Storage is shared and finite:** 1 GB across every bucket, including the other product's question media.
  Documents, score reports and uploads all draw on it, and advertising is what fills it.
- **The free tier pauses after about a week of inactivity.** A campaign makes that unlikely, but a pause
  takes *both* products down at once rather than one.

## In order

1. Walk the signup path once, by hand (above).
2. Configure custom SMTP — unblocks signups at scale *and* deadline reminders.
3. Fill the legal placeholders.
4. Decide the measurement question (A or B), and if A, nothing to do — it is already built.
5. Point the ad at the home page; the first-visit onboarding takes a new visitor to a personalised
   dashboard without an account being required, which is the product's best argument.
