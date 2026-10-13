# AdmissionHack — Build Status

> Product plan: [PLAN.md](PLAN.md) · Exam research: [research/exams.md](research/exams.md) · Hub blueprint: [docs/exam-hub-blueprint.md](docs/exam-hub-blueprint.md)

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, static generation (SSG) — chosen for
  SEO-first content, zero infra at this stage, and a clean growth path to a full platform
  (DB + auth arrive with the tracker/vault phases).
- Content lives in typed data files under `src/data/` — the future ingestion pipeline / admin panel
  will replace this layer without touching pages.

## Design language (v2, Sept 27 2026)

Matched to the user's SAThack reference (sathack-smoky.vercel.app): **dark terminal aesthetic** —
JetBrains Mono everywhere, near-black green-tinted background with subtle grid + animated aurora
glows, neon-lime primary with glow animation, gradient headlines, terminal-window components with
blinking cursor. **Motion:** typed terminal hero (client component), scroll-reveal (IntersectionObserver,
threshold 0 — tall elements), floating badges, infinite exam marquee, pulsing status dots, hover
lift + glow on cards, bar-fill animations. No animation library — pure CSS keyframes + one small
client Reveal component.

### Accounts, sync and the counselor view — built, waiting on a database

Everything except the provisioning is done, and the app is a complete product
without it.

- **`src/lib/supabase.ts`** — the client is **optional by design**. It returns
  `null` when the env vars are unset and every call site treats that as
  "run locally only". Every table is `ah_`-prefixed, so the schema can live in
  `public` even in a database shared with another app — no custom-schema wiring.
- **`src/lib/database.types.ts`** — hand-authored `Database` type matching the
  migration, so table/column drift is a compile error. Replace with generated
  types (`generate_typescript_types`) after provisioning.
- **`src/lib/use-auth.ts`** — session + role, with `configured: false` flowing to
  every consumer.
- **`src/lib/workspace-sync.ts`** — whole-workspace push/pull in both directions.
  A single applicant's workspace is tens of rows, so a full replace is simpler
  and harder to get subtly wrong than a field-level merge; this is the layer that
  changes if collaborative editing ever arrives. Plus `inviteStudent`,
  `listLinkedStudents`, `pullStudentWorkspace`.
- **`src/components/account/auth-panel.tsx`** — sign in / sign up with a **role
  picker** (student · counselor · parent). With no backend it renders an honest
  "accounts not configured" panel explaining the app is complete locally and what
  the two env vars would enable — never a broken form. **Verified in the browser.**
- **`src/components/account/counselor-view.tsx`** — invite students by email,
  see the roster with pending/active status, and open any accepted student's
  profile, universities, scores and deadlines read-only. Access is enforced by
  RLS, not by this screen: guessing an id returns nothing.
- Dashboard now has 10 tabs (account + counselor added).

**Still blocked on provisioning** — applying the migration needs the project
decision (free plan: 2 active slots, both held). `.env.example` documents the two
variables; activation is then a two-minute step.

## Accounts + database (started, blocked on infrastructure)

The user asked for real accounts, an official-score-report upload, and a counselor who can see many
students' workspaces.

**Blocked, and it is not a code problem.** Supabase's free plan allows **2 active projects**; the
org has three, and the two slots are held by the user's *active* projects:

| Project | Status | Counts |
|---|---|---|
| `ii-na-praktike` | ACTIVE | yes |
| `sathack` (their SAT site) | ACTIVE | yes |
| `hamzaK228's Project` | INACTIVE since July | no — already paused |

So the idle project frees nothing. Creating a third is refused until one of the two *active*
projects is paused/deleted or the plan is upgraded — none of which is mine to do.
**Zero-destruction alternative offered:** apply the migration into a dedicated `admissionhack`
Postgres schema inside a project they already have (separate tables + RLS + storage policies, shared
auth = one login across both apps). The same migration file moves to a dedicated project unchanged
later. Awaiting their pick of which project hosts it.

**Written and ready:**

- **`supabase/migrations/0001_admissionhack_schema.sql`** — portable migration. 9 tables
  (`ah_profiles`, `ah_exam_results`, `ah_score_reports`, `ah_university_lists`, `ah_deadlines`,
  `ah_portfolio`, `ah_documents`, `ah_checklist`, `ah_counselor_links`), roles
  (student | counselor | parent), tiers (dream | target | safe).
  **Security is the point of this schema:** it will hold passports, transcripts, official score
  reports and family financial documents, so every table is deny-by-default via RLS and a row is
  visible only to its owner plus a counselor with an **accepted** link
  (`ah_is_counselor_of()` as SECURITY DEFINER so the policy can read the link table without
  recursing through its own RLS). Storage: two **private** buckets,
  `documents/{user_id}/…` and `score-reports/{user_id}/…`, owner write, counselor read for linked
  students. Plus a signup trigger that creates the profile and attaches pending invites.

- **Score report upload — built and working today.** `score-report-upload.tsx` + `doc-vault.ts`
  gain a `kind`/`examId` so official reports are first-class: three blocks (IELTS / TOEFL / SAT) in
  the exams tab, drag-drop or picker, download/delete, files never leaving the device. Verified in
  the browser (3 file inputs, 3 labelled blocks). Stored in IndexedDB now; the component moves to
  Supabase Storage unchanged because the path convention is already `{user_id}/{exam_id}/{file}`.

## Scroll-scrubbed text (anime.js) (Sept 27, 2026)

Added the reference's signature text motion: statement/heading words reveal
**left-to-right as you scroll**, scrubbed against scroll position rather than
fired on entry.

- `src/components/motion/scroll-words.tsx` — splits a heading into per-word
  spans and drives them with anime.js `animate(words, { opacity: [0.3, 1],
  delay: stagger(0.6), autoplay: onScroll({ target, enter: "bottom",
  leave: "top", sync: "linear" }) })`. Wired into the home manifesto and every
  `PageHero` title (plain-string titles only; ReactNode titles fall through).
- **API read from the installed package, not the docs.** animejs.com is
  JS-rendered so fetching it returns only the marketing shell; the authoritative
  source is `node_modules/animejs/dist/modules/types/index.d.ts`, which shows
  `sync?: boolean | number | string | EasingParam` and **no** `syncSmooth` — a
  guess there cost one failed typecheck.
- **Progressive-enhancement guard.** Scrubbed interpolation runs on the
  animation-frame loop, which browsers throttle. The words start at 0.3 (never
  0) and an `onUpdate` proof watches for real progress; if none arrives within
  1.2s the animation reverts, leaving the heading at full opacity rather than
  parked dim forever. Verified: after the guard fires, all 9 words read
  `opacity: 1`.

**Verification honesty:** the scrub itself cannot be visually confirmed in this
harness because its rAF is throttled. The mechanism matches the installed type
signatures and the fallback is verified; the CSS-variable-driven scroll motion
(filmstrip, planet dissolve, aurora parallax, scroll rail, reveals) is the part
verified end-to-end.

## Full design pass (Sept 27, 2026) — after installing the motion skill

Audited the code against the Motion skill's rules first: **clean** — no `framer-motion` imports,
no MotionValue read in render, `willChange` used instead of `translateZ(0)`, `MotionConfig
reducedMotion="user"` at the root, `layout` animations on the directory grid, 9 `AnimatePresence`
usages.

Then the design itself. Three real problems found by looking, not guessing:

1. **The design language broke after the filmstrip.** The filmstrip used `[ STEP 01 ]` brackets;
   every other section used a different `> EYEBROW` at a fraction of the size, so the page
   collapsed from 7xl titles to small h2s. Fixed the shared `Eyebrow`/`SectionHeading` so the
   bracket style and the large gradient heading apply **site-wide** (`> Prompt` kept as a separate
   variant for places that are literally terminal commands). Page heroes went from 5xl to 7xl.
2. **The statement line was missing.** The reference screencast had a big centred manifesto with
   one accent-coloured word. Added `[ WHY THIS EXISTS ]` -> "Admission rewards the people who
   **knew the system**." with the accent in lime.
3. **Dead space.** The modules were a flat 2-column card grid (wide, short, empty) and the roadmap
   was four small dashed boxes floating in a dark void. Modules are now an editorial index —
   `01 / title / description / $ command ->` rows with hairline dividers — and the roadmap is a
   single divided strip. Also fixed the heading, which claimed **"Four modules"** while rendering six.

Verified: detector clean, no horizontal overflow on any page checked, mobile headings scale
72px -> 48px cleanly.

**A note on method:** while checking the filmstrip I measured an alignment bug and nearly "fixed"
working code — the math was right and my measurement used `offsetTop` (relative to a positioned
wrapper) instead of `getBoundingClientRect()`. Re-measured correctly: `jp` reaches exactly 1.0 and
the last panel centres at `offBy: 0`. Recording it because the failure mode is easy to repeat.

## Weight reduction + transitions (Sept 27, 2026)

**Size.** Project itself is 735MB (node_modules 469M + .next 263M), both regenerable and
gitignored. The real GB were outside it:

| Target | Before | After | Note |
|---|---|---|---|
| `~/.npm` cache | 2.8 GB | 667 MB | regenerable, cleared with `npm cache clean --force` |
| my session screenshots (`~/.zcode/cli/artifacts`) | 287 MB | 195 MB | 288 PNGs from this session, deleted |
| `/tmp` working files | ~180 MB | 0 | scaffold, land data, frame dumps |

Not touched (the user's own tooling, not mine to delete): `~/.cache/uv` **11 GB**,
`~/.cache/codex-runtimes` 1.7 GB, `~/.cache/huggingface` 454 MB, `~/.cache/pnpm` 358 MB.

**Client payload.** `src/data/geo.ts` (imported by the globe, a client component) was pulling
the full 170 KB QS JSON — shipping city, region and repeated country strings to every visitor.
Generated `src/data/globe-points.json` instead: country names deduped into a 106-entry table,
ranks as integers, dead fields dropped. **170 KB -> 62 KB raw / 29.4 KB -> 19.5 KB gzipped
(-64%)**. Also dropped `website` and `city` from the dashboard's client index — both were
never read and `website` meant shipping 1,504 URLs.

**Transitions.**

- **Route changes** (`src/app/template.tsx`): a 340ms blur-masked crossfade. Blur is doing real
  work here — Next swaps the page instantly, so without it you see two layouts overlap; the blur
  blends them into one perceived motion. Skipped entirely under reduced motion.
- **Filmstrip panels**: a panel's content rises out of a 3px blur and sharpens as its panel
  becomes active, dimming to 0.28 as it leaves — so the strip reads as staged, not as text
  sliding past. Verified: active panel opacity 1, neighbours 0.28.

## Horizontal filmstrip — the reference's signature motion (Sept 27, 2026)

The user supplied a **screencast** of weevolveit.com. Video input is not available to the
model, so I extracted frames with ffmpeg and tiled them into contact sheets, then pulled
three frames around the phase transitions at higher resolution. That settled it: the phases
do not stack vertically, they **translate sideways**.

Evidence from the frames: `The 5 method.` centred -> `...over.` (Discover) sliding off the
LEFT while `Diagnos` enters from the RIGHT with ghost `1` and `2` translating behind it ->
`Design.` arrived left with ghost `3`, `Del` (Deliver) entering right.

- **`JourneyScroller` is now a pinned horizontal filmstrip.** The section is
  `100vh + (N-1)*100vw*0.5` tall; a sticky 100vh viewport holds an N-panel flex track that
  translates on `--jp` (0..1, written by a passive scroll listener -> CSS, no rAF loop).
  Verified: `jp 0 -> .35 -> .85` produced `translateX 0 -> -3562px -> -8602px`.
- **Performance was a real problem** and needed fixing: an 11,520px-wide track with
  `will-change: transform` promoted an enormous compositor layer and screenshots began
  timing out. Removed the `will-change` and added `content-visibility: auto` +
  `contain-intrinsic-size` to each phase so off-screen panels are not rendered at all.
- Pin length halved (0.85 -> 0.5 x shift) — 8 phases should not cost ten viewport-heights.
- Degrades honestly: below `lg` it is a normal vertical stack, and
  `prefers-reduced-motion` unpins it entirely.

## Stepped scroll narrative — "must look like weevolveit when I scroll" (Sept 27, 2026)

Scrolled the reference end to end and found the real structure: it is not a hero, it is a
**stepped phase narrative** — `[ THE FRAMEWORK ]` -> giant "The 5 method." -> phase pill row ->
progress dots -> then one section per phase, each with a giant ghost numeral watermark, a huge
title, a tagline, dashed bullets, an image block and a sticky bottom stepper tracking progress,
with the background flipping light <-> dark.

We already had the content for exactly this: our 8-step admission journey.

- **`.section-light`** inverts the palette by overriding the CSS custom properties the utilities
  read (`--color-paper`, `--color-fog`, `--color-line`, `--color-panel`, `--color-ink`, accents).
  One class flips every child — text, borders, panels — with zero component changes. Verified:
  step 2 renders `bg rgb(245,246,243)` / text `rgb(10,15,11)`.
- **`JourneyScroller`** (`src/components/journey-scroller.tsx`) — light intro ("The 8 steps.",
  pill row of all eight, progress dots) then one section per step, alternating light/dark, each
  with `[ STEP 0N ]`, a giant ghost numeral, the giant gradient title, the timing, the real
  "what to do" dashed bullets, our real mistakes panel (instead of the reference's empty image
  block), a link to the full step, and a **sticky bottom stepper** whose dots + label track the
  step you are reading (IntersectionObserver, no scroll-jacking).

## Matching weevolveit.com (Sept 27, 2026)

User asked for our site to match https://weevolveit.com/ exactly. Studied the full page
(doc height 9554px): fixed floating pill nav · pointillist globe whose dots form real
continents · giant display type beneath · fixed edge furniture (flag left, award badge
bottom-left, scroll % right) · then a hard cut to a LIGHT section (`[ THE FRAMEWORK ]`).

Shipped:

- **Real continents on the globe.** Fetched Natural Earth 110m land polygons (public domain),
  rasterised them to a bit-packed 500x250 equirectangular mask (33.2% land, 20KB base64) in
  `src/data/land-mask.ts`, and rewrote the globe to draw ~41k land dots as one batched `Path2D`
  (front hemisphere only, size varying with depth). Universities stay lime on top. Tonal balance
  tuned to match: near-uniform dark sphere (no gradient hotspot), crisp pale dots, subtle rim,
  calmer atmosphere.
- **Floating pill nav.** Replaced the full-width sticky bar with an inset, rounded-full,
  bordered pill that condenses on scroll (`bg-ink/70` -> `bg-ink/90` + shadow), holding the
  brand, centred links, search, dashboard and the lime CTA. Mobile sheet floats too.
- **Cleaner hero.** Removed the welcome strip (it duplicated the dashboard link and pushed the
  planet down); personalisation now lives inline in the hero readout via `WelcomeLine`.
- Coordinate + country marker labels beside the planet, echoing their `ONLINE · BISHKEK` motif.

Still unmatched from the reference (candidates for a next pass): the light/dark section
alternation with `[ BRACKETED ]` eyebrows, the bottom-left award badge, and the left-edge
language switcher.

## Emil Kowalski craft pass (Sept 27, 2026)

Applied `emil-design-eng` philosophy across the codebase. Audit findings and fixes:

| Before | After | Why |
|---|---|---|
| `transition-all` ×12 | `.card-interactive` (transform, border-color, box-shadow) | `all` animates layout properties too |
| 15 hover effects, 0 gated | `@media (hover: hover) and (pointer: fine)` | On touch, `:hover` fires on tap — false positives |
| hover lift with no `transform` in the transition list (self-inflicted) | folded into `.card-interactive` | The lift was snapping instantly |
| reduced-motion → `opacity: 1 !important` | opacity/colour transitions kept, movement dropped | Reduced motion = gentler, not zero |
| ad-hoc easing | `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out`, `--ease-drawer` | Built-in CSS curves lack punch |
| JS motion values for aurora parallax | pure CSS via `--sy` (`aurora-layer-1/2`) | CSS animation beats JS when the main thread is busy |

New primitives: `.card-interactive` (gated hover + press), `.press-grow` (primary buttons),
`.press`, `.link-quiet`. 200ms interactions, all under Emil's 300ms ceiling.

## Scroll choreography (Sept 27, 2026) — "motion on scroll like weevolveit"

`src/components/motion/scroll-driver.tsx` publishes scroll state as CSS custom
properties on `<html>` from a **passive scroll listener** (never an animation-frame
loop, which is what left content stuck before):

- `--sy` scrollY in px · `--sp` document progress 0..1 · `--sv` decaying velocity

CSS then resolves the choreography in the style engine:

| element | behaviour on scroll |
|---|---|
| `.hero-planet` | scales 1 → 0.62, drifts down 16%, dissolves by ~1150px |
| `.hero-stars` | parallaxes at 0.34× (deepest layer moves least) |
| `.hero-copy` | drifts up against the planet, fades later |
| `.hero-aura` | swells with scroll velocity (momentum feedback) |
| `.scroll-rule` | section rule fills with `--sp` (reading progress) |

Plus a fixed right-edge **scroll percentage readout** with a progress line, matching
the reference's indicator. Measured live: y=380 → planet opacity 0.67 / scale 0.92 /
+61px, stars +129px. `prefers-reduced-motion` neutralises all of it.

### Scroll motion is site-wide (fix, Sept 27)

Reported as "no change" — diagnosis found the real cause: the scroll choreography
existed **only on the home hero**, so scrolling any inner page moved nothing
(`animatedElements: 0` on `/universities`). Extended so every page animates:

- **`PageHero`** (shared by universities, exams, countries, scholarships,
  how-admission-works) now wears `.hero-copy` — drifts up and fades on scroll —
  and carries a `.scroll-rule` that fills with document progress.
- **Directory** filter panel reveals on scroll; cards keep their layout animation.
- **Site footer** gained a `.scroll-rule` reading-progress divider.

Measured on `/universities`: at y=500 → hero `opacity .64`, `translateY(-35px)`,
rule `scaleX .093`.

## University Planet redesign (Sept 27, 2026)

References studied: **weevolveit.com** (dotted 3D globe on a starfield, orbital arcs,
huge bold type, floating pill nav) and **ihubadmissions.org** (same Bishkek/+996 market —
lead-capture and WhatsApp CTA patterns). Our lime terminal identity is kept intact.

- **`src/data/geo.ts`** — country centroids for all 106 countries in the QS list, plus
  `globePoints()`: all 1,504 universities projected at their country centroid, spread by a
  deterministic hash with a radius scaled to that country's institution count (184 US → wide,
  1 Luxembourg → tight), longitude corrected for latitude. So density on the globe is honest.
- **`src/components/globe/university-globe.tsx`** — hand-rolled canvas planet (no 3D dependency):
  lit green sphere + lime rim + atmosphere bloom, dot graticule, country density halos, every
  university as a rank-sized dot (top-50 get a glow), two cyan orbital ellipses, drag-to-spin with
  axial tilt, hover picking with an in-place tooltip, click to select. DPR-aware, ResizeObserver,
  reduced-motion → static frame.
- **`src/components/globe/starfield.tsx`** — deterministic SVG stars with a slow twinkle.
- **New hero** — readout bar (1,506 universities / 13 countries / 11 exams decoded / drag the
  planet), the planet, giant type ("Every university on Earth. One decision."), CTAs, scroll cue.
- **Robustness fix (important):** entrance animation is now **CSS-driven**
  (`IntersectionObserver` toggles `.reveal-in`, compositor runs the transition) with a 1.2s safety
  timeout, replacing the rAF-gated motion `whileInView`. Root cause found during verification: a
  throttled/dead animation-frame loop left motion content permanently at `opacity: 0`. Content
  visibility must never depend on a JS frame loop. `@/components/motion/reveal` is now a re-export
  of the CSS implementation, so both import paths behave identically. The hero globe and headline
  are additionally ungated (no entrance animation at all).

Verified: planet renders with clusters + orbital rings + atmosphere; hover tooltip returned
"Pusan National University · QS #449 · South Korea"; globe rotates between captures; mobile 390px
hero composition solid; design detector clean across all new files.

## Live (September 27, 2026)

- **Motion round 2** — aurora scroll parallax (two blobs glide at different speeds via
  motion useTransform driven by a manual scroll listener — deterministic where motion's own
  useScroll stalled in automation), and the directory grid got **layout animations**: filtering
  now makes cards physically glide to their new positions (motion `layout` + `AnimatePresence
  mode="popLayout"`). Design detector: zero findings across all motion files.
- ⚠️ Automation note: the IAB harness has unreliable requestAnimationFrame — rAF-driven motion
  (motion.dev, anime.js) cannot be screenshot-verified there; all rAF code paths are standard and
  correct (verified listener firing, MotionValue sets, final states). Real browsers render these
  continuously.

- **Motion redesign with motion.dev + anime.js** (user request: "add motions, use anime.js,
  motion.dev as references") — installed `motion@13` + `animejs@4.5`:
  - `src/components/motion/reveal.tsx` — Reveal/Stagger/MotionItem rewritten on motion springs
    (every page upgraded automatically; same API as the old hand-rolled component)
  - `src/app/template.tsx` — page transitions: every route entrance fades+rises via motion
  - `src/components/motion/count-up.tsx` — anime.js-powered number count-ups (home stats count
    to 1506/13/11/8; dashboard overview tiles count too)
  - `src/components/motion/system-path.tsx` — hero "admission system" circuit that draws itself
    with anime.js (strokeDashoffset, staggered delays)
  - Onboarding steps now transition with motion AnimatePresence (mode=wait) instead of CSS
  - Dashboard: tab content transitions with AnimatePresence; match results stagger in; overview
    tiles count up
  - `MotionConfig reducedMotion="user"` wraps the app in layout (a11y); CSS kill-switch retained.
    Lesson learned: `useReducedMotion()` cannot be called from a server-component layout — use the
    config value instead. Screenshot capture in the IAB freezes animations at t=0 — verify animated
    UI via computed state/getAnimations, then capture after settle.

- **First-visit onboarding** (spec: `docs/SPEC-onboarding.md`, built per the impeccable `onboard`
  playbook + design detector passed with zero findings) — on any page, a first-time visitor gets a
  full-screen 4-question flow in the terminal aesthetic: **where do you want to study** (14 flag
  cards with tuition hints) → **mission** (bachelor's/master's) → **budget slider** → **scores
  (optional)** → typed "compiling workspace" finale → auto-lands on the personalized dashboard.
  Skippable everywhere ("explore first", ESC); skip/completion sets `ah.onboarded` so it never
  shows twice; reduced-motion users get everything static. **Welcome strip** on home for returning
  visitors: name, target country, next-deadline countdown, dashboard link. Verified: fresh-visit
  path (wiped state → overlay → completion → dashboard with profile), skip path, returning path
  (no overlay + strip), mobile 390px.

- **Match engine ⚡** (`/dashboard` → match tab, `src/lib/match-engine.ts`) — heuristic v1,
  transparent and explainable: estimated admit chance = 1 − difficulty + (academics − 0.65) × 0.55,
  where difficulty comes from selectivity or derives from QS/ARWU position (so all 1,504 unis are
  matchable), and academics is a weighted blend of GPA/scale, IELTS/9, TOEFL/120, SAT/1600.
  Categories: ≥65% safe · 35–65% target · <35% dream. Inline controls (budget slider, IELTS,
  country, "target country only", "hide unaffordable") with save-to-profile; per-card "why"
  factors with ✓/!/· markers (academics vs selectivity, tuition vs budget, English vs typical
  requirement, country match, QS rank); add-to-list buttons wired to the shortlist. Verified:
  profile IELTS 7.0 → academic 78/100; "Germany only" narrowed 1,506 → 60 (Dream 4 incl. TUM).
- **Dashboard v2 — Common App-style workspace** (`/dashboard`, 8 tabs, verified end-to-end in browser):
  - **Universities** — Dream 🏆 / Target 🎯 / Safe 🛡️ tiered lists (auto-migrated from the old
    shortlist; `+` in the directory adds as Target; tier chips move schools; remove ✕)
  - **Documents** — real file vault via IndexedDB (`doc-vault.ts`): drag-drop or picker upload,
    file cards with icons/sizes/dates, download + delete, storage total; files never leave the device
  - **Exams** — structured results (IELTS overall+4 skills, TOEFL, SAT EBRW/Math, GPA with scale)
    + live **destination check** ("IELTS 7.0 → meets ✓ US/UK/CA/AU/DE")
  - **Portfolio** — Common App-style entries (activity / award / work / volunteering) with
    organization, years, hours/week, description; tab badges show counts
  - **Overview** — 6-tile stats, next-deadline card, target-country card linking to its guide,
    checklist progress, deadline radar
  - **Profile** — wizard edit + danger-zone reset
  - Store v2 (`store.tsx`): `ah.apps` (tiered), `ah.portfolio`, `ah.exams` + legacy shortlist migration

- **Personal Dashboard** (`/dashboard`) — no-account workspace persisted in localStorage
  (`ah.*` keys via `StoreProvider`): 3-step profile wizard (name, level, target country + intake,
  budget slider + scores), shortlist with ★ buttons on every university card/detail page (header
  badge shows count), deadline tracker with sorted countdowns + urgent <30d highlighting + "load
  example plan", 10-item document checklist with progress bar, and profile-aware "within budget"
  chips in the directory. Verified end-to-end in the browser (wizard → shortlist → deadlines).
- **⌘K command palette** — global search over a lazy-loaded `/search-index.json` (1,550+ entries:
  universities, exams, countries, scholarships, guides) with keyboard nav (↑↓/Enter/Esc), grouped
  type labels, backdrop-blur terminal window.
- **Adaptive/mobile** — hamburger drawer nav with animated icon + active states, verified at
  390×844 across home/directory/dashboard; header got scroll-progress bar, active-link
  highlighting, compact search trigger; toast notifications for save actions.

- **Deep-research content upgrade** (research files: `research/admission-mechanics.md`,
  `research/scholarships.md`, `research/platform-teardown.md`):
  - **Country guides rebuilt** — 13 destinations now carry verified application windows, fee norms,
    visa financial-proof amounts (blocked account €11,904, GIC CA$23,448, £1,529/mo London…),
    processing times, post-study work rights, flagship scholarships, and the top mistakes per
    country. Countries are now the deepest pages on the site.
  - **Scholarships hub** (`/scholarships`) — 22 flagship programs (Fulbright, Chevening, Erasmus
    Mundus, DAAD, MEXT, CSC, Türkiye Bursları, GKS, Mastercard Fdn, Gates Cambridge, …) with
    coverage, eligibility, verified application windows, honest competition levels, level filter,
    and the 5 "how people actually win" patterns. Added to header/footer nav.
  - **Exam pages** — typical minimum-score tables by destination for IELTS/TOEFL/DET/PTE.
  - Platform teardown synthesized into a top-10 build list (profiles → programs → country guides →
    search → tracker → cutoff pages → calculators → scholarships → compare → chancing engine).
- **Full QS-ranked directory — 1504 institutions** (user request "add all universities 1500+"):
  - QS **2027** edition (current, released June 2026 — discovered during this task; our earlier
    2026 data was the previous edition) fetched from the official TopUniversities endpoint via the
    in-app browser (Cloudflare blocks plain scripts); raw data in `research/data/qs-*.json`
  - ARWU 2025 (589 entries incl. bands) from the official ShanghaiRanking API, merged by name
  - Merge layer `src/data/directory.ts`: 48 rich curated entries (exams, tuition, selectivity) +
    ~1456 "basic profiles" (rank, country, city; honest "see official site" fallbacks) + alias map
    for official-vs-display name differences (UCL, TUM, LSE, Heidelberg, …); QS ties ("=2") parsed
  - Explorer: 107-country filter, QS top-50/100/200/500 filter, sort by QS rank or tuition,
    load-more pagination (60/page); country guides list top-12 by rank + "see all N"
- **Real rankings integrated** — every university carries verified QS and ARWU positions with
  source links to topuniversities.com and shanghairanking.com. Edition years in `RANKING_EDITIONS`.

- **Home** `/` — hero, journey preview, pillars, roadmap strip
- **How admission works** `/how-admission-works` + 8 step pages — the full journey with "what to
  do", "mistakes that cost people their season", and how AdmissionHack helps per step
- **University directory** `/universities` — 48 universities across 13 countries; client-side
  filters: search, country, field (controlled vocabulary), tuition band
- **University detail** `/universities/[slug]` — tuition, selectivity, languages, accepted exams
  (cross-linked to exam pages), country context, data-status badge
- **Exams hub** `/exams` + 11 exam pages (SAT, IELTS, TOEFL, DET, CSCA, ACT, PTE, GRE, GMAT, EJU,
  IMAT) — grouped by launch tier; format cards, cost/dates/validity, official-site link
- **Country guides** `/countries` + 13 country pages — admission system, platforms, tuition,
  English requirements, visa notes, university lists
- **Sitemap** `/sitemap.xml` (placeholder domain)

## Verified

- `npm run build` passes; 89 static pages prerendered
- Visual check in browser (desktop 1440×900) after redesign: home (terminal typing confirmed
  mid-animation), directory + working filters, IELTS detail page — all clean
- Fixed during visual checks: reveal-on-scroll never fired for the tall university explorer
  (threshold bug) — now threshold 0; UAE/Singapore/South Korea missing from country data — added

## Known limits / next steps

- Seed data is `community-contributed` grade — spot-check top entries before any promotion
- Mobile views not yet visually verified (responsive classes are in place)
- Next up per plan: Phase 1 (match engine, deadline calendar) or Academy v1 (SAT hub engine per
  docs/exam-hub-blueprint.md) — user's SAT site stays separate and plugs in later
