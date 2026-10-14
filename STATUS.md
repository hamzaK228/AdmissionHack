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

## Backend is live (2026-10-13)

Project **`admissionhack`** (`nkqjlccomtcqwsawbndp`) in the **AdmissionHack** org, region
`eu-central-1`. `supabase/migrations/0001_admissionhack_schema.sql` was applied verbatim.

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` live in `.env.local` (publishable
  key; both values are public by design and ship to the browser). **Changing them needs a
  rebuild** — they are inlined into the client bundle at build time.
- **19/19** — `node supabase/verify-backend.mjs`. The consent model is exercised through the real
  API with real JWTs, not a SQL simulation: a counselor is blind before the student accepts,
  sighted after, and blind again the moment it is revoked; the owner cannot insert a pre-verified
  score report nor write into another workspace; a counselor can verify a report but cannot
  rewrite the evidence it attested to; anonymous reads nothing at all. Re-runnable — it cleans up
  after itself.
- Profiles are created lazily by `ah_ensure_profile` on first authenticated load, and the same
  call claims any invite already addressed to that email. **There is no trigger on `auth.users`**
  — deliberate, so a fault in this schema can never roll back another app's signups, and so the
  schema stays portable between a dedicated project and a shared database.
- Verified in the browser end to end: sign in → **upload this workspace** (rows confirmed in SQL)
  → **restore from cloud** → student accepts a counselor invite → counselor opens the read-only
  workspace and sees profile, universities and scores.
- Throwaway test accounts `student@example.com` / `counselor@example.com` (password
  `TestPassword123!`) back that walkthrough — **delete them before real use.**
- **Signup needs one dashboard toggle**: Authentication → Email → turn *off* "Confirm email".
  With it on, `signUp` sends a confirmation mail and the default SMTP is rate-limited (429), so a
  real signup cannot complete until that is off or SMTP is configured.
- **Files reach the cloud, official reports included.** Vault documents go to the `ah-documents`
  bucket and score reports to `ah-score-reports`; a counselor's read-only panel lists both and opens
  them through short-lived signed URLs, and can mark a report verified. The student sees that state.

## Consistency pass (2026-10-13)

- **Score reports went to the cloud** — finally the piece that was written but not wired.
  `uploadScoreReport` / `listCloudReports` / `setReportVerified` / `signedReportUrl`, and the
  student's block now says which state each file is in: *on this device only*, *shared with your
  counselor*, or *verified by your counselor*.
- **Fixed a bug I had introduced myself:** `deleteCloudFile` keyed the row deletion on a row id the
  caller never had (I passed `""`), so it removed the object and left the row behind — which reads
  to a counselor as a link that opens nothing. Both deletes now key on `file_path`, which is what
  the caller actually holds.
- **A counselor can verify a report from the UI.** The column-level grant and the update policy
  existed and were proven by the script, but no screen offered the control, so the feature was only
  half-reachable.
- **Files added while signed out can now be shared** (the `↑` action) rather than forcing the
  student to delete and re-add them.
- **The checklist and the folders are no longer presented as the same thing.** They are different
  axes — the application's requirements versus where files live — and the tab now says so instead of
  leaving the reader to work it out. The list was renamed accordingly.
- **Removed dead code:** `welcome-strip.tsx` was referenced by nothing, and `terminal-hero.tsx` was
  imported by the home page but never rendered. Also corrected a stale header comment in `doc-vault.ts`
  that still claimed files never leave the device.
- **`PLAN.md`'s decision table** no longer lists the tech stack as open; stack and accounts/data are
  marked decided, with a pointer to STATUS.md.
- **39/39** — the script now also proves the student uploads a report into `ah-score-reports`, the
  accepted counselor can mint a signed link **and receive the bytes**, and a report path that does
  not exist is not a way in.
- Walked in the browser: the counselor's panel renders `Personal files → passport.pdf → open ↗` and
  `official reports → sat.pdf · sat · verified → open ↗ / unverify`; the student's exams tab renders
  `official SAT report · 1 file on record · ✓ verified by a counselor`.

## Where this stops (2026-10-13)

Everything that can be finished without you is finished.

- `npm run build` clean, ~1,550 pages. `npx tsc --noEmit` clean. All 13 routes return 200.
- `node supabase/verify-backend.mjs` — **39/39**, through the real API with real JWTs.
- The dashboard hydrates with all ten tabs and no page errors; mobile at 390×844 has no horizontal
  overflow.
- **README rewritten.** It was still untouched `create-next-app` scaffolding claiming port 3000, so
  the repository now has a real front door: what it is, the honest status, how to run it, that the
  backend is optional, and how to run the security suite.
- `NEXT_PUBLIC_SITE_URL` is now the single knob for the site's own origin, instead of a placeholder
  hard-coded in `sitemap.ts`.

**Waiting on you, and only you:**

1. ~~**Publish.**~~ **Done, 2026-10-13** — `gh` is authenticated on this machine as `hamzaK228` and all
   commits are on `main` at https://github.com/hamzaK228/AdmissionHack (public, default branch `main`).
   `./push-to-github.sh` stays for future pushes.
2. **Turn off "Confirm email"** (Authentication → Email), or configure SMTP. Until then `signUp()`
   hits the default mailer's rate limit and no real account can finish signing up.
3. **Delete the throwaway accounts** (`student@example.com`, `counselor@example.com`, password
   `TestPassword123!`) before real use. They exist so `verify-backend.mjs` can run, and they
   currently hold demo data — a workspace, a group membership and a verified report.
4. **Decide about the paused project.** The Supabase slot was freed by pausing one of your other
   projects, and it stays paused while three are active.

**What remains is the product, not loose ends.** Pillar 3 (exam-prep academy and the Writing School
— where your SAT site plugs in), Pillar 6 (visa and arrival), Pillar 7 (community and mentorship),
Pillar 8 (AI advisor). That is the bulk of the roadmap in PLAN.md. One practical ceiling to keep in
mind: the free plan gives 1 GB of storage, which student documents will eventually exhaust.

## Deployed (2026-10-13)

**Live at https://admissionhack-seven.vercel.app** — Vercel project `admissionhack` in
`hamzak228s-projects`, production, Node 24 (matching this machine).

- The three `NEXT_PUBLIC_*` values are set on the project for production **and** preview. They are
  inlined at build time, so changing any of them needs a redeploy — which is why `NEXT_PUBLIC_SITE_URL`
  was added and the site rebuilt, so `sitemap.xml` names the real host instead of the placeholder.
- **Verified on the deployment, not locally:** all 12 routes return 200, including deep pages; the
  account tab renders `[ sign in ]` rather than "accounts not configured" (**which is what proves the
  credentials reached the build**); signing in as the test student produces a real Supabase session
  (`sb-nkqjlccomtcqwsawbndp-auth-token`) and reads back `Aisultan · role: student` from the database;
  and "restore from cloud" pulled the workspace across origins, reporting *1 universities* with
  `workspace restored from cloud ✓`.
- **Found by deploying:** `sitemap.xml` listed **85** URLs while the site generates ~1,550 pages.
  `sitemap.ts` imported the *curated* 48 universities rather than the merged 1,504, so ~1,456 live,
  statically generated pages were invisible to crawlers — the one audience a directory product exists
  for. Importing from `./all` took the sitemap to **1,543** URLs.
- `.gitignore` had gained `.env*` from the Vercel CLI, which also swallowed `.env.example`; a negation
  keeps the file that documents the configuration tracked.
- **Deploys come from GitHub**: the repo is connected to the project, so **a push to `main` deploys to
  production by itself** — verified by pushing and watching a new deployment appear plus the new route
  answer 200 on the alias, with no CLI command run. (An earlier note here claimed Vercel was building
  from the local source; that was wrong.) `npx vercel --prod` also works and is useful for deploying
  without a commit.
- Not done: **no custom domain.** The site sits on a `vercel.app` subdomain and `NEXT_PUBLIC_SITE_URL`
  points at it; both follow from the brand/domain decision, which is still open.

## Auth, finished on the client (2026-10-13)

- **Password reset** at `/auth/reset` — one route for both halves: the page a user visits to ask for a
  link, and the page that link returns to. Because the link carries a recovery session, the route can
  tell the two situations apart instead of needing a second one.
- **Resend the confirmation email**, and the panel now distinguishes *"this address is not confirmed
  yet"* from *"wrong password"* — only one of those is fixed by typing the password again.
- **Sign-up reports whether a session came back**, because whether a new account is signed in
  immediately is a server-side setting (Confirm email) that the client must not assume either way.
- **A signed-in user can change their password** from the account tab.
- **Two dashboard settings remain, and no amount of code can do them:** 
  1. Authentication → Email → **turn off "Confirm email"** (or configure SMTP). Until then the default
     mailer rate-limits, so confirmation *and* reset mail both fail and no real signup can finish.
  2. Authentication → URL Configuration → **add the deployed origin to Redirect URLs**. Without it
     GoTrue silently falls back to Site URL and the reset link lands somewhere that cannot finish.
- Verified in the browser: with a session, `/auth/reset` renders *"Your link worked. Choose a new
  password."*; without one it renders the request form; the account tab exposes both the resend and the
  change-password controls. The emailed round trip itself cannot be verified while the mailer is
  rate-limited — that is the honest limit of this check.

## Pillar 3 started — the exam academy (2026-10-13)

The largest hole in the product, and the place the user's own SAT site plugs in. The shared engine
from `docs/exam-hub-blueprint.md` is now real, with its first content.

- `src/data/practice/` — exam-agnostic question types plus an **SAT bank of 24 original questions**
  (12 Math, 12 Reading & Writing). Every answer is verifiable by construction and every explanation
  says why the wrong choices are wrong; a practice question with no defensible explanation teaches
  nothing.
- **The questions are original writing in the exam's style — not released material from a testing
  body** — and the intro screen says so. That matters twice over: copied questions would make the hub
  worthless, and labelled practice must never be confused with an official score.
- `src/lib/practice.ts` — scoring, section breakdown and history. An unanswered question counts as
  wrong, because on the real test it is.
- `/exams/[id]/practice` — intro → runner → results. Instant feedback rather than a silent scored test,
  because that is how practice teaches; the clock counts up and never cuts anyone off; answers are
  scored only when asked for, so a stray click costs nothing; 1–4/A–D and Enter drive it from the
  keyboard.
- Results: score, per-section bars, time, a review list of what was missed with its explanations, and
  "retry the N I missed" which re-runs exactly those. The dashboard exams tab shows the history, so the
  promise that attempts are kept is real rather than dangling.
- **Adding an exam is one content file plus one registry line** — now confirmed rather than claimed.
  The IELTS Academic Reading bank (12 questions on two passages, including three-choice
  True/False/Not Given) went in as `src/data/practice/ielts.ts` plus one line in the registry, with
  **no change to the engine**, and the runner needed nothing to handle a 3-choice question. The
  passage is carried on every question rather than once per group, deliberately: the runner shuffles,
  so a question must bring its own context or a shuffled set would show one passage beside another's
  question.
- Verified by driving the whole set in the browser: 6/24 with always-choice-A, split Reading & Writing
  5/12 and Math 1/12, which is arithmetic one can check by hand; the retry then re-ran exactly the 18
  missed, and the attempt appeared in the dashboard as *weakest: Math*. For IELTS, the keyboard path
  was exercised directly — `2` selected False, Enter revealed *correct* with the explanation.
- Also this round: **`robots.txt`** — public pages allowed, `/dashboard` and `/auth/` disallowed, with
  the sitemap declared. The site had a sitemap and no robots policy.
- **The user's SAThack site is now the SAT companion hub** (`src/data/hubs.ts`, keyed by exam so the
  next exam site is a data entry rather than another special case in a page). The exam page shows it
  beside our own practice set, and the practice intro — which used to say only "use official papers" —
  now points at it.
- The copy draws the line on **provenance**, which is the distinction that matters here: SAThack drills
  **official College Board questions**, the in-platform set is **original writing**. Both are useful
  and they are not interchangeable, so a student should know which one they are looking at.
- The card says plainly that the **accounts are separate** and nothing is carried between the sites.
  This is a hand-off, not single sign-on, and implying otherwise would be the easy lie.

## The college list IS the application tracker (2026-10-13)

Pillar 5's core. Two things share one key — the tier is how the student balances risk, the status is
how far each application has got — and both hang off (student, university), so they live on one
screen rather than making the student maintain the same list twice.

- **The tier move was already built and invisible.** Three single-letter chips ("🏆 D", "🎯 T",
  "🛡️ S") per card did the job; they read as decoration. Each card now says "move to Target" and
  shows the current column as a marked, disabled chip, and the card glides between columns on a
  shared `layoutId` so the move lands visually (instantly under `reducedMotion="user"`).
- **Every application has a life:** planning · preparing · submitted · waitlisted · offer ·
  rejected · enrolled. `src/lib/applications.ts` holds the one vocabulary, because four things have
  to agree on it: this module, the UI, the database CHECK, and the sync.
- **Dates are stamped, never typed.** Moving to `submitted` stamps a submission date; an outcome
  stamps a decision date and keeps the submission one. Moving back clears the stamp, so a mis-tap
  cannot leave a phantom submission date behind. A list saved before the tracker existed reads as
  "planning", so nobody's workspace breaks.
- **The header summarises it** ("6 on your list · 2 still need you · 3 submitted · 1 offer") and each
  column shows its count against the recommended spread, so an unbalanced list is visible.
- **The counselor sees the status and both dates.** The payload already carried them; only the
  rendering was missing them. Visibility is the point of the consent model, so it is not optional.

### The one thing to paste (and why the app works before you do)

`supabase/migrations/0003_application_tracker.sql` — additive, guarded, idempotent, ~40 lines. Run it
in the **sathack** project's SQL editor like the ecosystem migration.

The tracker works without it, because the workspace is local-first. What the migration adds is the
**cloud mirror** of the statuses. And it must be applied before the sync carries them, for a specific
reason: `pushWorkspace` replaces a student's list with a **delete-then-insert**, so writing a column
the database does not have would fail the insert *after* the delete had run — silently emptying that
list in the cloud. So the tracker fields ride along only when a probe confirms the columns exist, and
the probe runs **before** the delete rather than after. Without them the list still syncs, just
without statuses.

The probe was verified against the live database rather than reasoned about: an unknown column returns
`400` with code `42703`, and `select=status` returns exactly that today — so the deployed app is
correctly omitting the tracker fields right now. Only a positive probe is cached, so a transient
network failure retries instead of disabling the tracker for the session. Reading is defensive too:
two literal selects rather than a column-list variable (PostgREST infers the row type from the string,
so a variable defeats it), falling back to the pre-tracker columns, because a failed read would look
like an empty list.

**After applying the migration, regenerate `src/lib/database.types.ts`**: its three new columns were
hand-added so the code typechecks before the database had them, and a real regeneration should
replace that guess.

Verified: 24 assertions over the lifecycle, the stamping rules and the summary; the college list
driven in a real browser (moved ETH Zurich Dream → Target, confirmed in the store and the rendered
columns; set it to submitted and watched the date get stamped; then to offer and confirmed the
submission date was kept and a decision date added; moved another card while it held a status to prove
the move preserves it). tsc, eslint and a 1,554-page build pass; the three eslint errors in
`counselor-view.tsx` and the two in `dashboard-client.tsx`/`store.tsx` all pre-date this change, which
was confirmed by linting with the change stashed.

## The timeline — Pillar 2's "when" (2026-10-13)

The deadlines tab was a flat list the student had to fill in themselves. The dashboard already
knew enough to derive it, so it now does.

- **The offsets became data.** `journeySteps` carried its timing as prose ("take exams 8–12 months
  before enrollment"). Each step now also carries `offset: { from, minMonths, maxMonths }` — the
  prose stays for humans, `src/lib/roadmap.ts` does the arithmetic, and a step with no usable offset
  gets **no** window rather than an invented one. The two window-less phases show their curated
  sentence instead.
- **Two anchors, both the student's own:** their intake month (`profile.intake`, "Fall 2027" →
  September 2027) and their earliest tracked deadline. With no deadline tracked, the fallback is a
  typical Dec–Feb window, **and the card says so** rather than implying it is theirs.
- **Status is never assumed.** It is derived from data the dashboard already holds — scores ticked
  in exams, documents ticked in the checklist, the university list, tracked deadlines — and every
  card carries an evidence line naming the data it used. A phase that cannot be observed says
  "later" instead of pretending.
- **A closed window outranks "in progress".** If the latest sensible month has passed and the phase
  is unfinished it reads **BEHIND**, while still reporting how much is done ("2/6 core documents
  ticked"). Flattering the student here would defeat the point of a plan.
- **It writes into the existing deadline list**, so the timeline and the deadline radar are one list
  rather than two that drift. "Track all" adds the window-end date for each unfinished phase.
- Verified by 30 assertions over the date maths and status rules (run directly under Node's type
  stripping — no test dependency added) plus a real browser run: eight phases rendered, statuses
  correct for a seeded mid-process student, and "track all 3" wrote exactly three deadlines while
  leaving the existing one untouched.

## One login across both products (2026-10-13 — DONE and verified)

Both SAThack and AdmissionHack now authenticate against the **sathack** project
(`arpwvfphzryaaxrvegju`), so one account pool covers both. The dedicated `admissionhack` project
(`nkqjlccomtcqwsawbndp`) is left in place, paused, as rollback.

- `supabase/ecosystem-migration.sql` — both migrations in one file, pasted into that project's SQL
  editor. Safe against a live app: everything is `ah_`-prefixed, there is **no trigger on `auth.users`**,
  buckets are namespaced, and it is idempotent.
- `scripts/switch-to-ecosystem.sh` — repoints this app, updates the Vercel env for production and
  preview, rebuilds, deploys, and re-runs the suite. Reversible: it copies `.env.local` to
  `.env.local.pre-ecosystem` first.
- **The interlock was tested, not trusted.** It asks the target project for `ah_profiles` and refuses to
  continue if the table is missing — switching early would leave the live site with accounts, sync and
  documents that all fail. Run before the migration it correctly refused, left `.env.local` untouched
  and exited 1.
- **Verified after the switch, not assumed:** all 11 tables present in the shared project;
  `verify-backend.mjs` **39 passed, 0 failed** there (group-join consent, folder enforcement and
  counselor file access included); and the **deployed** bundle was checked directly — it ships
  `arpwvfphzryaaxrvegju` and **zero** references to the old project, which is the only honest way to
  confirm a build-time `NEXT_PUBLIC_*` variable took effect.
- **Remaining, and it is one dashboard entry:** add `https://admissionhack-seven.vercel.app` to
  **Redirect URLs** in the sathack project. GoTrue does not error on an unlisted `redirect_to` — it
  silently substitutes SITE_URL — so without it the reset and confirmation links finish on SAThack's
  domain. Worth one glance at **Site URL** on the same screen. Also **delete the two throwaway test
  accounts**: they now live in the shared pool, so they are sign-inable on the live site, and the public
  repo documents their password.
- **Corrected:** earlier notes here said to turn "Confirm email" off. Do not. SAThack's existing users
  signed up by email+password against this same project and its `/auth/confirm` route works, so the
  mailer delivers; confirmation stays ON.
- **No `/auth/callback` route is needed, deliberately.** `flowType` defaults to `implicit`, so email
  links arrive as a `#access_token` hash that the client picks up. A server route cannot read a hash, so
  adding one would have broken the path that works.
- **"One login" means one account pool, not single sign-on.** Supabase keeps the session in per-origin
  localStorage, so signing in on SAThack does not light up AdmissionHack. Same credentials, same data,
  two sessions — cross-origin handoff would be real work, not a setting.
- Not built yet in this pillar: timed mock tests with a real score estimate, an adaptive section, and
  AI essay grading. Local practice history is not synced to the account — a counselor sees the entered
  scores, not the practice attempts.

## Document folders and counselor groups (2026-10-13)

Migration `0002_document_folders_and_groups.sql`, applied to the live project.

- **Six folders**, the ones a counselor asks an applicant for: Tests · CV, Essays · Recommendation
  Letters · College List · Extracurricular Activities · Personal files. The vocabulary is a database
  CHECK constraint, so `src/data/document-folders.ts` and the migration have to change together.
- **Files are real files.** A document is written to the local vault first — so the workspace still
  works with no account at all — then mirrored into the `ah-documents` bucket at
  `{user_id}/{folder}/{name}` and recorded in `ah_documents`. Every row states which state it is in:
  *shared with your counselor* or *on this device only*. A counselor cannot open a file that never
  left the browser, so the UI does not imply otherwise.
- **Counselor groups.** A counselor creates a group and shares its join code; a student enters the
  code to join. **Entering the code is the consent** — the student's own request creates the
  membership row — so there is deliberately **no INSERT policy** on `ah_group_members`: joining goes
  only through `ah_join_group()`, a SECURITY DEFINER function. That is also why a student cannot
  enumerate groups or codes.
- **The visibility rule stayed in one place.** `ah_is_counselor_of()` gained the group case, and
  because every table policy and the storage read helper already call it, group membership reached
  all nine tables and the objects in storage without a second copy of the rule.
- **35/35** — `node supabase/verify-backend.mjs`, now also covering: a student who has not joined
  sees no groups; a wrong code is refused; a membership row cannot be written directly; joining
  grants the workspace with no 1:1 link; a bad folder name is rejected by the database; the
  counselor can mint a signed link to the student's file **and receive the bytes**; a guessed path
  is not a way in; and leaving the group revokes both the rows and the file.
- Walked in the browser: all six folders and their guidance render; a counselor creates a group and
  reads code `HACK01`; a student joins with lowercase `hack01`; the counselor then opens the
  student's workspace from the group roster and sees the profile, the universities, and
  **`Personal files → passport.pdf → open ↗`**.
- **Not testable in this harness:** the upload click itself. The in-app browser cannot set files on
  a file input, so the drag-drop/picker path is covered by the storage assertions in the script,
  not by a simulated click.

## Offer comparison, calendar export, tracker polish (2026-10-14)

Completing the student journey end-to-end: the moment offers arrive, the question shifts from
"will I get in?" to "which one should I take?" — and the tracker now answers it.

- **Offer comparison tab (`/dashboard` → decisions 🎓)** — Pillar 6. Side-by-side comparison of every
  university with a decision status (offer, waitlisted, rejected, enrolled). For offers, a table
  shows: name + country, QS/ARWU rank, tuition range, a cost bar against the student's own budget,
  and a **value score** that balances cheapness and high rank. The best-value offer is starred.
  Single offer? It shows the data plainly and says "one data point is not a comparison." Waitlists
  get the continued-interest reminder; rejections are greyed and marked "not this time"; enrolled
  gets a 🎓 badge. `src/components/dashboard/offer-comparison.tsx`.
- **Calendar export** — every deadline on the deadlines tab now has an `→ export to calendar (.ics)`
  link. RFC 5545-ish, good for Apple Calendar, Google Calendar and Outlook. All-day events, folded
  lines, proper escaping. `src/lib/calendar-export.ts`.
- **Counselor view: real university names** — the read-only workspace for counselors was showing
  `u.slug.replace(/-/g, " ")` (raw slugs like "university-of-michigan-ann-arbor"). It now resolves
  through `universityBySlug` from the directory, so counselors see "University of Michigan, Ann
  Arbor".
- **Per-application checklist hints on tracker cards** — each `AppCard` now shows a mini checklist
  based on its status: planning → check requirements + English policy; preparing → transcripts,
  recommendations, personal statement, fee; submitted → track portal; waitlisted → letter of
  continued interest; offer → compare scholarship and confirm before reply date. Plus a tuition
  hint when the directory knows it.

**Build verification:** `npm run build` passes (1,554 pages), `npx tsc --noEmit` clean.

**Still waiting on you:**
1. Add `https://admissionhack-seven.vercel.app` to **Redirect URLs** in the sathack project
   (Authentication → URL Configuration).
2. Delete the throwaway test accounts (`student@example.com`, `counselor@example.com`).
3. Decide: email provider (Resend/SendGrid/AWS SES) for deadline reminders, and whether you have
   an OpenAI/Anthropic key for the AI essay reviewer / AI advisor — three features are blocked on
   those two choices alone.
4. Custom domain and license file — repo is public with all rights reserved by default.

## TOEFL Reading bank (2026-10-14)

Pillar 3's third exam, and the blueprint's claim proven again: one content file
(`src/data/practice/toefl.ts`) plus one registry line, and the exams hub, the exam page and the
practice route all picked it up with no other change — `hasPractice()` is what they read.

- Twelve original questions on two academic passages (horse domestication, and memory
  consolidation during sleep). Deliberately a different question mix from IELTS: vocabulary in
  context, EXCEPT ("all of the following are true except"), rhetorical purpose, inference and
  sentence simplification — none of which the SAT or IELTS sets use, so the bank exercises the
  engine rather than repeating it.
- Validated mechanically before shipping: 12 unique ids, every `answer` present among its choices,
  four choices each with no duplicate ids, a passage on every question, and an explanation long
  enough to teach. `npx tsc --noEmit` clean; the build emits `/exams/toefl` and
  `/exams/toefl/practice` (1,555 pages).
- DET (Duolingo) is the one remaining language-hub gap, and it is the same one-file job.

## Types regenerated against the live project (2026-10-14)

`src/lib/database.types.ts` no longer describes the retired project.

- The `ah_*` tables were checked against `generate_typescript_types` on the **live** sathack
  project (`arpwvfphzryaaxrvegju`) and match — including the tracker columns `status`,
  `submitted_on` and `decided_on`. Those columns are present in the live database, so **nothing
  needs pasting for the tracker** (whether they came from `0003_application_tracker.sql` or the
  ecosystem migration, the effect is the same).
- Two stale things were corrected: the header named `nkqjlccomtcqwsawbndp` (the old project, no
  longer reachable from this account), and `__InternalSupabase.PostgrestVersion` said `14.18`
  where the live project reports `14.17` — the file's own contract is that this value must match
  the live project.
- The generator also returns ~40 SAThack tables that share this database; only the `ah_*` tables
  are kept, and the header now says why.

## The AI essay reviewer (2026-10-14)

Pillar 2's missing piece, and the first thing in this app that talks to a language model.

- `src/app/api/essay-review/route.ts` — **server-side on purpose**. The key is read from
  `GLM_API_KEY` with no `NEXT_PUBLIC_` prefix, so it never reaches the browser; a key in the client
  bundle is readable by anyone. The provider is Zhipu's GLM (OpenAI-compatible), and `GLM_MODEL` /
  `GLM_API_BASE_URL` let the model change without a code change (defaults `glm-4.6`,
  `open.bigmodel.cn/api/paas/v4`).
- **Optional like everything else.** `GET` reports `configured`, so with no key the writing tab says
  the reviewer is not configured rather than showing a form that fails — the same posture as the
  optional Supabase client.
- **It returns structure, not prose:** an overall read, what is working, issues with a severity and a
  concrete fix, notes on quoted lines, and ordered next steps. The model is asked for JSON and parsed
  defensively anyway — fences stripped, missing fields tolerated, array caps enforced — because a
  whole review should not be discarded over a stray backtick.
- **It spends the owner's money and the app has no login**, so the route carries a best-effort
  in-memory rate limit (8 per 10 minutes per IP) plus a length cap. That limit is honest but weak:
  serverless instances are recycled and not shared, so it throttles one abuser well and a distributed
  one poorly. A shared store is the real fix, and this app does not have one yet.
- `src/components/dashboard/writing-coach.tsx` — the **writing ✍** tab: a short primer on what a
  reader is doing (they read fast, they are looking for you, they distrust big claims), then the draft
  box. The draft persists in the browser, survives a tab switch, and is cleared by the profile tab's
  reset. A review sends the text to the provider once, for that request; the UI says so, and says the
  result is an opinion rather than a decision.
- **Error classification that tells the truth.** Zhipu reports an *uncredited* account as `429` +
  code `1113`, not as `402`, so a balance problem would otherwise present as a rate limit. The route
  separates `upstream_quota`, `upstream_auth`, `upstream_model`, `upstream_busy` and
  `upstream_error`, and the UI gives different advice for each.

**Blocked on a top-up, not on code.** The GLM key authenticates and lists models up to `glm-5.3`, but
**every** model returns 429/1113 — the account has no credit. The key is already set as a Vercel
production secret, so the reviewer begins working the moment the account is funded; until then it says
exactly that instead of failing vaguely. Verified: `GET /api/essay-review` → `configured: true`, and a
`POST` returns `upstream_quota` rather than a generic error.

## DET bank, and the model vendor becomes configuration (2026-10-14)

- **DET is the fourth practice bank**, and the last of the language exams the plan lists:
  `src/data/practice/det.ts`, live at `/exams/det/practice`. Twelve original questions, and
  deliberately not a fifth reading-comprehension set — DET is adaptive and leans on recognising and
  completing language, so this bank leads with the word-level types the other three do not use at all
  ("which of these is a real English word", and fill-the-blank sentences where grammar *and* meaning
  must both fit) before one ordinary passage. **The four banks now total 60 questions**: SAT 24,
  IELTS 12, TOEFL 12, DET 12. All four validated mechanically (unique ids, every answer among its
  choices, no duplicate choices, a substantive explanation on each).
- **The model vendor is now configuration rather than code.** The essay reviewer reads
  `AI_API_KEY` / `AI_API_BASE_URL` / `AI_MODEL` and defaults to **DeepSeek**
  (`deepseek-chat`, `api.deepseek.com`); moving back to Zhipu GLM, or to OpenAI, is three env vars
  and no code change. The provider has already changed once — from GLM, which was out of credit — and
  it should not cost an edit again.
- **Both dialects of "no money" are handled**, which matters because they look like different bugs:
  DeepSeek answers with `402`, while Zhipu answers `429` + code `1113` (indistinguishable from a rate
  limit). Both now map to `upstream_quota`, kept apart from `upstream_busy`.
- The dead GLM secret was deleted from the Vercel project rather than left lying around.

**Waiting on you for the reviewer to actually answer:** a **DeepSeek API key**. The code and the env
names are ready; pasting the key into `.env.local` and the Vercel production secret is the whole of
the work, and it needs no redeploy because the route reads the key at request time.

## The Writing School (2026-10-14)

Pillar 3's last substantial content gap: the essay, taught by annotated example rather than described
in the abstract.

- `src/data/writing-school.ts` and the public `/writing` page. Five sections: what the reader is doing
  (five constraints, not opinions), the spine that works (a specific moment → what you noticed → what
  you did → what that says about how you work → why here), **two fully annotated model essays**, three
  before-and-after rewrites, and the five ways drafts fail — each with a test you can apply to your own
  draft in a minute.
- **The models are labelled, and the label is load-bearing.** They carry a provenance note saying they
  were written for the guide: not a real applicant's essay, and not one that was admitted anywhere.
  Peddling "the essay that got someone into Harvard" is unfalsifiable, and it is precisely the claim an
  anxious seventeen-year-old believes hardest. The exam banks already take this line about question
  provenance; here it matters more, because a model essay is the thing a student is most tempted to copy.
- **Technique is invisible in a finished essay and obvious in an annotated one**, so each model renders
  as paragraph-then-note: the text, and beside it what that paragraph is *doing* — why the opening is a
  bus shelter rather than a childhood dream, why admitting a nine-month reporting error is the strongest
  sentence available, why "this experience taught me" throws the work away.
- Wired into the header and footer nav, linked from the dashboard's writing tab so the primer there and
  the public guide are one tool rather than two opinions, and added to the sitemap.
- **Fixed while passing through:** `/scholarships` had never been in `sitemap.ts` — the same class of
  omission as the earlier 85-vs-1,543 bug, a public content hub invisible to crawlers. Added, along
  with `/writing`.

