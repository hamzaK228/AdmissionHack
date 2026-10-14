# Legal documents — what still needs doing

**These are drafts written from the code, not legal advice.** They are accurate about what the system
does, which is the part an engineer can get right and the part that is expensive to get wrong — a policy
claiming something the software does not do is worse than having no policy. But they have not been
reviewed by a lawyer, and the parts that depend on jurisdiction have not been decided at all.

Two pages are live: `/privacy` and `/terms`, linked from the footer and from the sign-up form.

## 1. Fill in every placeholder

The documents deliberately contain visible `[BRACKETS]` so an unfilled one cannot ship unnoticed:

| Placeholder | Where | What it needs |
|---|---|---|
| `[LEGAL ENTITY NAME]` | both pages | Who operates the service — a person or a registered company |
| `[REGISTERED ADDRESS]` | both pages | The address of that entity |
| `[CONTACT EMAIL]` | both pages | A monitored address for privacy and legal requests |
| `[JURISDICTION]` | Terms §14 | Governing law |
| `[JURISDICTION / CITY]` | Terms §14 | Where disputes are heard |
| `[CURRENCY AND AMOUNT …]` | Terms §12 | The liability cap, or a statement that it is nil because the service is free |
| `[If you operate in a jurisdiction with a specific digital age of consent …]` | Privacy §11 | The age policy, named properly (see §3 below) |

Find them with: `grep -rn "\[" src/app/privacy src/app/terms`

## 2. The one substantive risk: the AI provider

The essay reviewer sends a student's draft to **DeepSeek**. That draft is user content, it may be
personal, and it is processed under *their* terms rather than ours. Before launch, check:

- **Does the provider retain submitted text, and may it train on it?** If the answer is anything other
  than "no", this is a disclosure problem under most data protection regimes, and possibly a promise the
  Privacy Policy cannot honestly make.
- **Is the provider in a country you can transfer personal data to** under the rules that apply to you?
- If either answer is uncomfortable, the fix is a provider with a no-retention/no-training guarantee.
  The route is provider-agnostic — `AI_API_BASE_URL` and `AI_MODEL` are environment variables, so
  switching is configuration, not code.

## 3. The thing most likely to be missed: this holds children's data

University applicants are typically 16–18. With that in mind:

- The service stores **passports, transcripts, recommendation letters and family financial documents** for
  people who may be minors. That is not ordinary personal data.
- Many jurisdictions set a **digital age of consent** (16 in parts of the EU, 13 elsewhere). Below it,
  parental consent is required, and the Privacy Policy has to say so specifically rather than in general
  terms.
- If **counselors use this with a class**, the school is very likely the *controller* and we are the
  *processor*. That relationship needs a written data processing agreement, and it is usually the school
  that insists on one — so having it ready is a sales asset, not only a compliance cost.
- `docs/database-migration.md` records where the data physically sits (Supabase, Seoul) and what a
  transfer involves.

## 4. Decisions the documents assume

- **Retention.** The policy says "until you delete it". If you ever want a longer or shorter period —
  for abuse records, or for analytics you do not currently run — that changes the policy, not the code.
- **No analytics is a fact, not a plan.** There is no analytics, tracking, advertising or error-reporting
  SDK in this application, and no cookies. If one is ever added, the Privacy Policy becomes false on the
  day it ships. Keep the two in step, or do not add it.
- **Nothing is charged**, so the Terms say so plainly and there is nothing to refund. If that ever
  changes, §10 and the liability cap both need revisiting.

## 5. Before launch, in order

1. Fill every placeholder above.
2. Decide the operating jurisdiction, then **have a lawyer in that jurisdiction read both pages.** The
   cost of this is small next to the cost of holding a minor's passport under a policy that does not say
   the right things.
3. Check the AI provider's data terms (§2) and switch provider if needed.
4. Decide the age policy and write it into Privacy §11.
5. Add the near-inevitable extra: a short **acceptable use** summary already lives in Terms §5, and the
   board's own footer repeats it in one sentence — keep them consistent if either changes.
