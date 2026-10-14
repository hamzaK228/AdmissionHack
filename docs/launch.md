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

## Blocker 1 — signups, and it is *not* what I first said

**Corrected 2026-10-14 after reading the logs, because my first diagnosis was wrong.** I said the mailer was
the problem. It is not. The auth records show users on 9–10 October being confirmed **about a minute after
signing up**, so delivery works.

What actually happened on 14 October, from the edge logs:

```
10:01:29  POST | 200 | /auth/v1/signup?redirect_to=.../dashboard
10:02:36  POST | 200 | /auth/v1/resend?redirect_to=.../dashboard
```

Both returned **200** — and **no account was created and no email was sent**. That is GoTrue's behaviour for
an address that **already has an account**: it returns a success carrying an empty `identities` array and
stays silent, deliberately, so a stranger cannot discover which addresses are registered.

Because the account pool is **shared with the other product**, this is easy to hit: anyone who has signed up
there **already has an account here**, and signing up again does nothing whatsoever.

**Fixed in the app:** the sign-up form now distinguishes the case and says so — *"that email already has an
account — sign in, or use forgot password"* — and switches to the sign-in form. Silently doing nothing was
the worst behaviour available, and it is now impossible.

**If it happens to you:** the address you tried already has an account. Use **sign in**, or **forgot
password** if you do not know the password.

**Still worth doing before a campaign — but for a different reason.** Configure custom SMTP. Not because
delivery is broken, since it demonstrably works at this volume, but because Supabase's built-in mailer is
documented as a testing service that is rate-limited per hour, and a campaign produces bursts. **The same
provider unblocks deadline reminders**, the last unbuilt item of the plan's first phase.

**Confirmation is ON** (`mailer_autoconfirm: false`), which is fine and working — a new student does have to
click a link, and the links do arrive.

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
