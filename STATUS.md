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
