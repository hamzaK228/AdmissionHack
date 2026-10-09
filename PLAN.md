# AdmissionHack — Product Plan (v3)

**Locked decisions:** fully global from day 1 · English only at launch · built solo + AI assistance · tech stack TBD
**Scope additions (v3):** exam prep academies per exam · Writing School (personal statements & essays) · full structured mentorship program

> One platform that takes a student from *"I want to study at university"* to *"I'm enrolled"* —
> covering discovery, planning, preparation, application, decision, and arrival.

---

## 1. Vision

Admission season is chaos: deadlines scattered across dozens of university websites, documents
prepared repeatedly for every application, contradictory advice from forums, and expensive
consultants as the only "reliable" option.

**AdmissionHack** is the ecosystem that replaces that chaos with one organized, personal workspace:
a global database of universities and programs, a smart match engine, a step-by-step admission
tracker, a reusable document vault, an AI advisor that actually knows the data, and a community of
students who have been through it.

**North star metric:** number of students who complete an application through the platform.

---

## 2. Who we serve

| Persona | Situation | What they need from us |
|---|---|---|
| **The Explorer** | High schooler, no idea where to apply | Discovery, match by score & budget, cost clarity |
| **The Planner** | Shortlisted 5–10 universities | Deadlines, exam calendar, document requirements |
| **The Applicant** | Mid-application season | Tracker, essay help, AI answers, doc reuse |
| **The Decider** | Holding multiple offers | Offer comparison, visa guidance, housing |
| **Parents** | Paying, anxious, remote | Cost calculators, trusted info, timelines |
| **Mentors** | Current students / alumni | Earn money helping applicants (supply side) |

---

## 3. The Ecosystem — 8 pillars

### Pillar 1 — Discover
- Global **university & program database**: filter by country, tuition, ranking, language, field, intake
- **Match engine**: user enters grades / test scores / budget / preferences → gets
  *reach / match / safety* lists with realistic admission chances
- Side-by-side **university comparison** (cost, acceptance rate, rankings, post-study work rights)
- **Scholarship finder** with eligibility filtering
- **Cost of living calculator** per city

### Pillar 2 — Plan
- **Personal admission roadmap**: generated from target intakes — which exams to take and when,
  when to request transcripts, when each application opens/closes
- **Deadline calendar** with reminders (email / push / Telegram)
- **Exam hub**: IELTS/TOEFL/Duolingo, SAT/ACT, GRE/GMAT, national exams — dates, formats, prep links
- **Country guides**: visa types, financial proof rules, recognition of diplomas

### Pillar 3 — Learn — Exam & Writing Academy
- **Dedicated prep hub per exam** (each feels like its own site): IELTS, TOEFL, SAT, ACT, GRE, GMAT,
  plus key national exams — format breakdowns, section-by-section strategies, practice questions
  with explanations, study plans by target score and weeks available
- **Score tools**: score requirement tables ("which universities accept IELTS 6.5"),
  score calculators and conversion charts
- **Vocabulary & drill trainers** with spaced repetition
- **Writing School**: step-by-step guides for personal statements, motivation letters and
  supplemental essays — annotated real examples, templates by program type, common mistakes
- **AI essay reviewer**: rubric-based feedback on structure, argument, tone and fit;
  guidance on avoiding AI-generated-text detection
- Free to read (SEO engine), premium for drills, mock tests and AI reviews
- Build method: **one shared hub engine + per-exam config & content** — see
  [docs/exam-hub-blueprint.md](docs/exam-hub-blueprint.md)

### Pillar 4 — Prepare
- **Document Vault**: upload transcripts, diplomas, passport, certificates **once** — reuse across
  every application (this is a major pain point and a retention engine)
- Per-university **document requirement checker** against what's already in the vault
- **CV builder** with academic templates
- Guidance on **translation, apostille, credential evaluation** (WES etc.)

### Pillar 5 — Apply
- **Application tracker**: one board for all universities — stage per application
  (research → docs → submitted → interview → decision)
- Per-application **checklists** and fee summaries
- Optional **counselor / parent collaboration** on shared boards

### Pillar 6 — Decide & Arrive
- **Offer comparison**: total cost, scholarship, ranking, city, career outcomes
- **Visa application checklist** per country with document tracking
- Housing, insurance, bank account, SIM — the "arrival" checklist
- Pre-departure timeline

### Pillar 7 — Community & Mentorship
- **Q&A forum** tagged by country / university / program
- **Full mentorship program**, not just ad-hoc sessions:
  - Verified mentor profiles — admit proof, university, program, test scores
  - **Structured packages**: season-long "application buddy", essay-review bundles,
    interview-prep sprints, mock interviews
  - Group cohorts and workshops (e.g. "IELTS 7.0 in 8 weeks")
  - Booking, scheduling, in-platform sessions with notes and summaries
  - Mentor onboarding + training, quality ratings, refund policy — trust is the product
- "What are my chances" threads with real admit data contributed by users
- Success stories mapped to profiles ("someone like you got in here")

### Pillar 8 — AI Advisor
- 24/7 chat **grounded on our own university database** (RAG) — no hallucinated deadlines
- Knows the user's profile: "You haven't added an English certificate — required by 3 of your 5 targets"
- Essay reviewer, chance estimator with explanations, document checker
- Available inside every pillar (finder, tracker, academy, mentorship), not a separate page

---

## 4. The hard part — data strategy (our real moat)

The product is only as good as its data. Wrong deadline = missed admission = lost trust forever.
Going fully global with a solo founder means **we cannot hand-curate the world** — the pipeline must
do the heavy lifting from day one.

**Stage 1 (launch):** build the **ingestion pipeline first, not just the UI** — scrapers + LLM
extraction from official university pages feed a structured template (programs, tuition, deadlines,
requirements, scholarships). Human effort (yours) goes only to **spot-checking** the top ~100
universities in ~10 high-traffic destinations (US, UK, Canada, Germany, Netherlands, Australia,
Turkey, UAE, and the biggest source markets). Seed the long tail from public datasets
(rankings, government education portals, Open Data) marked with a "community-contributed" badge.

**Stage 2 (scale):** every data point carries a **last-verified date** and a source link. Users get
a "report outdated info" button; reports enter a verification queue in the admin panel. LLM agents
re-check high-traffic pages weekly before admission season peaks.

**Stage 3:** partnerships (universities, agencies, test providers) for direct data feeds, and
community editors (like Wikipedia) earn reputation for verified updates.

---

## 5. Differentiation

Existing players are one-dimensional: portals (Mastersportal, Shiksha) are just listings;
consultants are expensive and offline; forums are unstructured; AI tools hallucinate.

**Our edge:** the full journey in one place + reusable Document Vault + AI grounded in our own
verified data + community of real students. We don't just *inform* — we *carry* the student
through every step with their own workspace.

---

## 6. Monetization

1. **Freemium SaaS** — free: discovery, 3 tracked applications, limited AI. Premium: unlimited
   tracking, full AI advisor, reminders, priority features.
2. **Academy premium** — exam hubs stay free-to-read (they are the SEO engine); premium: drill
   trainers, full mock tests, AI essay reviews, personalized study plans.
3. **Mentorship revenue** — 15–20% commission on sessions, margin on structured packages and
   cohort workshops (much higher ARPU than single sessions).
4. **Affiliate/partner revenue**: test prep, translation, insurance, housing, credential evaluation.
5. **B2B**: dashboards for schools and counseling centers; university lead generation (carefully —
   never let it compromise data neutrality).

---

## 7. Roadmap (solo + AI, sequential phases — each phase ships standalone value)

> Sizing assumes AI-assisted development: code moves fast, **data and content are the bottleneck**.
> Every phase ends with something usable, so we can pause or re-prioritize between phases.

| Phase | Duration | Scope |
|---|---|---|
| **0 — Foundation** | weeks 1–3 | Data model & schema, auth + profiles, university/program directory with filters and SEO pages, **ingestion pipeline v1** + admin spot-check panel, seed ~10 countries |
| **1 — Planner** | weeks 4–6 | Match engine v1, deadline calendar + email reminders, roadmap generator, exam hub |
| **2 — Academy v1** | weeks 7–10 | **SAT hub** (already in progress — brought onto the platform), **IELTS + TOEFL + Duolingo DET hubs** (guides, strategies, sample questions), **Writing School** (personal statement / essay guides, examples, templates), AI essay reviewer v1 — starts the SEO flywheel early, since organic traffic takes months to build. One reusable hub template serves all exams ([research/exams.md](research/exams.md)) |
| **3 — Apply** | weeks 11–15 | Application tracker, Document Vault + requirement checker, AI advisor v1 (RAG on our DB) |
| **4 — Community & Mentorship** | weeks 16–21 | Q&A forum (AI-seeded with our guides), **full mentorship program**: profiles, packages, booking + scheduling, payments (manual payouts first), ratings |
| **5 — Monetize** | weeks 22–25 | Premium subscriptions, academy premium (drills, mock tests, AI reviews), mentor payout automation, affiliate links |
| **6 — Scale** | ongoing | More exam hubs (SAT, GRE, GMAT, national exams), deeper country coverage, mobile app / PWA, B2B pilots |

**Solo-founder operating rules:**
- Ship one pillar end-to-end before starting the next — no parallel half-built features.
- English-only keeps content cost at zero for now; keep the data model language-ready (add `locale` fields, don't build UI i18n yet).
- The ingestion pipeline is built in Phase 0, not later — it *is* the product's foundation.

---

## 8. Architecture sketch (final stack decision deferred)

```
[ Web app (SPA/SSR) ]──┐
[ Mobile (later) ]─────┼──[ API Gateway ]──[ Core services: ]
                       │        │           users & auth, catalog,
                       │        │           matching, tracker, vault,
                       │        │           community, billing
                       │        │
              [ AI service: LLM + RAG over our verified DB ]
                       │
[ Postgres ][ Object storage (docs) ][ Search engine ][ Queue/jobs (reminders, data refresh) ]
                       │
              [ Admin panel: curation & data verification queue ]
```

Requirements that will drive the stack choice: SSR/SEO for the directory pages (traffic comes from
Google), strong full-text search, file storage with privacy controls, background jobs for reminders
and scrapers, LLM integration. Candidate stacks: Next.js full-stack vs React + Node (NestJS) vs
React + Python (FastAPI). **Decision: deferred until the idea is locked.**

**Hub strategy:** the exam academies and Writing School are *path-based sections* of the main
platform (`/ielts`, `/toefl`, `/personal-statement`, …) — one domain, one codebase, shared auth and
data. Each hub is designed to feel like a standalone site. Separate domains are an option only if a
hub later outgrows the platform; until then one domain concentrates SEO authority instead of
splitting it across sites a solo founder can't maintain.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Data inaccuracy (fatal for trust) | Human verification queue, last-verified badges, community reports, conservative AI grounding |
| Storing sensitive docs (passports, transcripts) | Encryption at rest & in transit, GDPR-grade privacy, regional storage, strict access logs, user-owned deletion |
| Academy content workload & accuracy | AI-drafted + human-reviewed at launch, start with only 2–3 highest-demand exams, user ratings on every lesson, community contributors earn reputation |
| Scope too big to build at once | Strict phase gating — each phase ships value on its own |
| Cold-start community & mentor supply | Seed Q&A with our own curated content; recruit first 20 mentors from target universities, guarantee their first paid sessions, package earnings prominently |
| Competition from portals/consultants | Full-journey workspace + vault reuse lock-in; stay neutral on university recommendations |

---

## 10. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Launch geography | ✅ Fully global from day 1 (pipeline-first data strategy, Section 4) |
| 2 | Languages | ✅ English only at launch; data model stays language-ready |
| 3 | Team | ✅ Solo founder + AI-assisted development; roadmap re-sized accordingly |
| 4 | Exam scope at launch | ✅ Researched — [research/exams.md](research/exams.md). **SAT hub already in progress**; Tier 1 launch: SAT + IELTS + TOEFL + Duolingo DET; Tier 1.5 new-opportunity bet: CSCA (mandatory China-bound exam from 2026–27, no competition yet); Tier 2: ACT, PTE, GRE, GMAT, AP; Tier 3: corridor/niche exams |
| 5 | Mentorship model | ⬜ Proposed: 1:1 sessions + structured packages from day one of Phase 4 — needs your confirm |
| 6 | Brand name & domain | ⬜ Open — "AdmissionHack" placeholder until we decide |
| 7 | Tech stack | ⬜ Open — recommendation ready once we lock the name (Section 8 has candidate stacks) |
