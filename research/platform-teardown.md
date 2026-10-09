# Best-Platform Teardown + Feature Roadmap — researched Sept 2026

Sources verified: topuniversities.com, mastersportal.com, shiksha.com, timeshighereducation.com, idp.com (+ search-sourced: collegevine.com, applyboard.com).

## Key findings per platform (condensed)
- **QS (topuniversities)**: ranking authority as the trust signal; profiles show subject-strength ranks, student/staff ratios, international-student counts, program tuition; no deadlines/acceptance rates. Programmatic families: 5,000+ university pages, year-stamped ranking URLs, subject/destination guides.
- **Mastersportal (Studyportals)**: 95k+ program pages = the atomic unit; BestFit matching tool; per-program deadlines (national/international), scholarships attached; "Study in {Country} {Year}" programmatic guides.
- **Shiksha**: cutoff-centric pages ("{University} Admission {Year}: deadlines, eligibility, fees") win geo-queries; profiles show acceptance rate, GPA cutoffs (country-specific conversion), per-course fees, **"Last updated" dates on every profile** (huge trust win), counselor CTAs, community Q&A long tail.
- **CollegeVine**: Chancing Engine (~75 factors → school-specific admit probability), Tier 1–4 extracurricular taxonomy, balanced reach/match/safety list builder, per-school essay-guide programmatic family. The moat: chancing.
- **IDP/ApplyBoard**: product = human counselor + application tracker; partner-institution marketplace (125k+ programs); free for students, monetize via institutions.
- **THE**: data-provenance footnotes on every stat; honest banded ranks; authority over conversion.

## Complete university profile data model (grouped)
- **Identity**: name, aliases, city/country, founded, type (public/private), website, logo
- **Rankings**: multi-publisher (QS/THE/ARWU) + year, subject ranks, history trend
- **Costs**: int'l UG/PG tuition, per-program tuition, application fee, living costs, attached scholarships
- **Requirements**: acceptance rate, GPA norms + country conversion, required tests with minimums, waivers, prerequisites, document checklist
- **Deadlines**: per intake, per applicant type (national/international, ED/EA/RD), decision dates
- **Programs**: degree, field, duration, start dates, format, language, tuition
- **Student life**: total students, international share, gender ratio, staff ratio, housing
- **Outcomes**: employment rate, salary, recruiters, notable alumni
- **Trust**: last-updated date, per-field source, verified badge

## Page map: SEO-driven vs retention-driven
SEO: university profiles; program pages; country guides + comparisons; cutoff/eligibility pages ("GPA/IELTS needed for X"); essay-guide families ("How to write {University} essays {Year}"); scholarship listings; exam content; rankings lists; community Q&A.
Retention: chancing/match engine; shortlist + deadline tracker with alerts; cost calculators; score predictor/GPA converter; comparison tool; counselor/agent flow; reviews; events.

## Top 10 build order (solo founder, impact/effort)
1. University profiles with the full data model + visible last-updated dates
2. Program-level pages (tuition + deadlines + requirements)
3. Country guides + comparisons (cheap, evergreen)
4. Multi-filter search (country/level/tuition/deadline)
5. Shortlist + deadline tracker with email alerts (cheapest retention hook)
6. Cutoff/eligibility programmatic pages
7. Cost calculator (geo-aware tuition + living)
8. Scholarship directory per university/country
9. Comparison tool (2–3 universities side by side)
10. Chancing/match score — heuristic v1 now, ML later (CollegeVine's moat)
