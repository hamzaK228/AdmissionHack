# What only you can write

Everything below is a blank in the project that I cannot fill, because it is either **a fact about you**
(an entity, an address, a jurisdiction) or **a judgement that has to be yours** (how you want people to be
treated, what you promise, what you refuse). Where it helps, I have written a suggested wording you can
accept, edit or throw away — but the decision is yours, and a document nobody owns is worth less than one
you mean.

Find the code-level blanks with `grep -rn "\[" src/app/privacy src/app/terms`.

---

## 1. Facts about you — paste these in

| # | What | Goes where | Suggested text |
|---|---|---|---|
| 1 | **Legal entity name** — your own name, or a registered company if you have one | `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`, replacing `[LEGAL ENTITY NAME]` | *"AdmissionHack, operated by [Your Name]"* tells a reader honestly that this is one person today |
| 2 | **Registered address** — a real address where you can receive legal post | both pages, `[REGISTERED ADDRESS]` | If you do not want your home address public, use a company or virtual-office address — but it must be one that reaches you |
| 3 | **Contact email** — monitored, and ideally a dedicated `privacy@` rather than your personal inbox | both pages, `[CONTACT EMAIL]` | Requests for copies of data, deletion and complaints all arrive here, and the law gives you a deadline to answer |
| 4 | **Governing law** — the country whose law applies | Terms §14, `[JURISDICTION]` | Usually where you live or where the entity is registered |
| 5 | **Where disputes are heard** | Terms §14, `[JURISDICTION / CITY]` | Same country; the city is usually yours |
| 6 | **Liability cap** | Terms §12, `[CURRENCY AND AMOUNT …]` | For a free service the honest answer is often *"nothing, because the service is free and no fee is charged"* — say that rather than inventing a number |

## 2. Judgements that have to be yours

These change what the product promises, so nobody should make them for you.

**a. Do you promise no advertising and no tracking — permanently?**
The Privacy Policy already states, as fact, that there is no analytics, no advertising, no tracking and no
cookies. That is true today and it is a strong thing to be able to say. My recommendation is to make it an
explicit promise rather than a description, because it is the kind of promise that earns a student's trust:

> *"We do not run advertising, analytics or tracking, and we do not intend to. If that ever changed, we
> would say so on this page before it happened, not after."*

**b. What is your age policy?** Privacy §11
Applicants are often 16–17, and the service can hold a passport and a family's financial documents. Decide
the line and write it plainly — for example *"you may use this service from 16; if you are younger, use it
with a parent or guardian"*. Naming an age is more defensible than a vague "minors need permission".

**c. How long do you keep things?** Privacy §9 currently says "until you delete it".
If a counsellor or a school asks you to hold records for a set period, or you want abuse records kept
longer, that is a decision to make now — it is far cheaper to write it into the policy than to explain it
later.

**d. What is your stance on AI-written essays?** Terms §6
The Terms currently say: we do not write essays, the reviewer can be wrong, and following each university's
AI rules is the student's responsibility. If you hold a firmer line — for example that the reviewer's output
may never be submitted as a student's own — say so, because a stated position is what a school will look for.

**e. Where does your own voice belong?**
Four places are opinion rather than fact, and they read as mine because I drafted them. They should sound
like you:

- **The footer blurb** (`src/components/site-footer.tsx`) — one sentence on what this is.
- **The home page statement** — the "why this exists" line.
- **The "short version" box on `/privacy`** — the plain-language summary is the part people actually read.
- **The mission on the home page** — who it is for, and what you refuse to do to them.

## 3. Decisions that are not sentences

| Decision | Why it matters | Options |
|---|---|---|
| **Licence for the public repo** | There is none today, which means *all rights reserved* — the strictest setting, and a legitimate choice. See `docs/ip-and-licensing.md`. | Keep proprietary; or a source-available licence (PolyForm / BUSL) if you want people to read but not resell it; or a permissive licence (MIT / Apache-2.0) if you want it reused freely |
| **Brand / domain** | The site is on a `vercel.app` subdomain, which is fine for now and weak for a product with schools as a channel | A domain, and the name as a trademark (see the IP page) |
| **Email provider** | Blocks deadline reminders, the last unbuilt Phase-1 item | Resend / SES / Postmark — any of them unblocks it |
| **Where the database lives** | Free tier today, self-hosted later | See `docs/database-migration.md`; two decisions needed in advance: backups, and how passwords migrate |

---

## If you only do three things

1. **Fill the six placeholders in §1.** A privacy policy naming no entity and no contact address is not a
   privacy policy in any useful sense.
2. **Write the age policy in §2b.** This service holds minors' documents; a named age line is the single
   most protective sentence in either document.
3. **Decide the licence.** Right now the code is public and all rights reserved, which is a deliberate
   position you should be holding on purpose rather than by omission.
