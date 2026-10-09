# SPEC — First-Visit Onboarding + Personalization

> Spec-driven (spec-kit style): spec → tasks → implementation → verification. Status: implemented.
> Companion to PLAN.md and the impeccable `onboard` playbook.

## Goal

When a visitor first opens AdmissionHack, the site **asks where they want to go** — country, level,
budget, scores — in under 60 seconds, and turns the answers into a working personalized workspace
(profile → match engine → dashboard). The onboarding is the fastest path to the product's "aha"
moment: *a university list built for you*.

## Design principles (from the onboard playbook)

1. **Time to value** — 4 questions, ~30 seconds; answers are used immediately (match engine).
2. **Optional, never blocking** — "explore first" skip on every screen; skip is as easy as start.
3. **Real functionality, not a tutorial** — every answer writes the real profile.
4. **Never shown twice** — completion or skip sets a persistent flag; returning users never see it.
5. **One authored motion moment** — the finish screen "compiles" the workspace with typed output,
   then lands on the dashboard. This is the site's signature motion beat.

## Flow

| Step | Question | Control | Writes |
|---|---|---|---|
| 0 Welcome | — (value line + time estimate) | start · explore first | — |
| 1 | Where do you want to study? | 14 flag cards (13 guides + "Not sure yet") | `profile.country` |
| 2 | What's your mission? | bachelor's / master's cards | `profile.level` |
| 3 | What's the yearly budget? | big slider (0–70k, live label) | `profile.budget` |
| 4 | Scores (optional) | IELTS / TOEFL / SAT / GPA inputs | `profile.*` + exams |
| 5 Done | "compiling your workspace" | typed terminal output → auto-redirect | `ah.onboarded = true` |

- ESC = skip. Skip stores the flag and never re-shows; profile stays unset until dashboard setup.
- Back navigation between steps; progress bar + "step n / 4" always visible.
- Returning users (profile exists) never see the overlay.

## After-effect (personalization)

- **Welcome strip** on the home page for onboarded users: name, target country, next deadline
  countdown, one-click dashboard link. The site remembers you.
- Match engine + dashboard read the profile — onboarding output is immediately useful.

## Visual spec (committed world: dark terminal, SAThack lineage)

- Full-screen takeover over `bg-ink` + aurora + grid; content in the terminal window motif.
- Type: JetBrains Mono; question ≥2.5rem; answers as large tappable cards; lime selection states
  with ✓; the gradient headline reserved for the welcome line.
- Motion: exponential ease-out fade+rise per step; typed-output finale; blinking cursor. Nothing
  else moves on the site — this is the one moment.
- Craft floor targets: ≥4.5:1 text contrast, generous step spacing, focus-visible rings, real
  hover/selected/disabled states, themed selection & caret already global.

## Acceptance criteria

- [ ] Fresh visit shows the overlay on any page; ESC/skip dismisses permanently.
- [ ] Completing flow lands on `/dashboard` with profile applied; match tab pre-personalized.
- [ ] Second visit (or skip) never re-shows; returning users see the welcome strip instead.
- [ ] Works at 390px (cards stack, all controls reachable).
- [ ] Keyboard: all steps operable (tab/enter/esc), focus lands in the overlay on open.

## Tasks

1. Store: `ah.onboarded` flag + `setOnboarded`.
2. `OnboardingOverlay` component (steps, motion, finale, redirect) mounted in layout.
3. `WelcomeStrip` for onboarded users on the home page.
4. Verify: fresh state, completion path, skip path, returning path, mobile 390px, impeccable detect.
