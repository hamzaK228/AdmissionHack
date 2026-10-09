import type { JourneyStep } from "./types";

export const journeySteps: JourneyStep[] = [
  {
    slug: "choose-destination",
    order: 1,
    title: "Choose your destination and field",
    shortTitle: "Destination & field",
    summary:
      "Before any exam or application: where do you want to live and study, and what do you want to become? Destination decides everything downstream — language, exams, costs, visa rules.",
    timing: "12–18 months before enrollment",
    whatToDo: [
      "List your priorities: cost, language, quality of education, work rights after graduation, safety, distance from home.",
      "Pick 2–3 candidate countries — compare tuition and living costs, not just rankings.",
      "Decide your field of study at the same time: the same university can be strong in engineering and weak in business.",
      "Check the language of instruction: 'study in English in Germany' is possible for many programs, but not all.",
    ],
    commonMistakes: [
      "Choosing a country because a friend went there, without checking costs and work rights.",
      "Rankings obsession: a top-200 university strong in your exact field beats a top-20 one weak in it.",
      "Ignoring total cost of living — some 'cheap tuition' countries have expensive capitals.",
    ],
    howAdmissionHackHelps: "Country guides with real cost breakdowns, and the university directory filterable by country, field and tuition.",
  },
  {
    slug: "shortlist-universities",
    order: 2,
    title: "Shortlist universities",
    shortTitle: "Shortlist",
    summary:
      "Build a realistic list of 6–10 universities across three bands: reach (ambitious), match (realistic), safety (very likely). Every slot should be a university you would actually attend.",
    timing: "12–15 months before enrollment",
    whatToDo: [
      "For each country, find how your certificate (GPA, national exam, IB, A-Levels) converts to their requirements.",
      "Split your list: 2–3 reach, 3–4 match, 2 safety. Never apply to only top-ranked schools.",
      "Check each university's specific requirements: which exams, which minimum grades, which documents.",
      "Note deadlines immediately — they range from October (Oxbridge) to July (some systems).",
      "Check scholarship options per university — some (like NYU Abu Dhabi or Khalifa) fund internationals almost fully.",
    ],
    commonMistakes: [
      "Applying only to reaches — one bad year of luck = zero options.",
      "Skipping the 'would I actually go?' test for safety choices.",
      "Not checking program-specific requirements (some CS programs need math scores even if the university doesn't).",
    ],
    howAdmissionHackHelps: "The university directory shows accepted exams, selectivity and fields side by side; the match engine (coming) will score your real chances.",
  },
  {
    slug: "plan-exams",
    order: 3,
    title: "Plan and take the required exams",
    shortTitle: "Exams",
    summary:
      "English proficiency plus (often) academic aptitude. English tests are needed by almost everyone; SAT/ACT for US and many competitive programs; national systems have their own gates (CSCA for China from 2026, EJU for Japan, IMAT for Italy-medicine).",
    timing: "Take exams 8–12 months before enrollment (scores need to exist before deadlines)",
    whatToDo: [
      "Identify the exact exam set for your shortlist — often one English test + one academic test covers everything.",
      "Check score requirements per university before booking (IELTS 6.5 vs 7.0 changes prep length).",
      "Remember validity: English test scores expire after 2 years — don't take them too early.",
      "Register early: popular dates and centers fill up, especially Aug–Oct for SAT and Sep–Nov for IELTS.",
      "Plan one retake buffer into your calendar — first-attempt scores are often not enough for reaches.",
    ],
    commonMistakes: [
      "Taking IELTS a year before needed — score expires before enrollment.",
      "Preparing for two months and booking a test two weeks later; plan 3–6 months of prep.",
      "Missing that some US universities still require SAT while others are test-optional — requirements changed recently.",
    ],
    howAdmissionHackHelps: "The exams hub breaks down every major exam: format, cost, dates, validity — and prep hubs are being built for each.",
  },
  {
    slug: "prepare-documents",
    order: 4,
    title: "Prepare your documents",
    shortTitle: "Documents",
    summary:
      "Transcripts, diplomas, translations, recommendations, passport. The most mechanical step — and the one that causes the most missed deadlines. Many documents need weeks of lead time.",
    timing: "6–10 months before deadlines",
    whatToDo: [
      "Order official transcripts from your school — sealed and signed versions for each application.",
      "Check translation and legalization requirements: some countries need sworn translations or apostilles.",
      "Request recommendation letters early — teachers need 4–6 weeks, and their semester is busy too.",
      "Get your passport valid well beyond your intended travel date.",
      "Scan and organize everything in one place — you will reuse the same files across 8 applications.",
    ],
    commonMistakes: [
      "Discovering in the deadline week that a translation needs an apostille that takes 3 weeks.",
      "Asking for a recommendation letter two weeks before the deadline.",
      "Uploading the wrong (unsigned/unofficial) transcript version.",
    ],
    howAdmissionHackHelps: "The Document Vault (coming) lets you upload once and attach everywhere, with a per-university requirement checklist.",
  },
  {
    slug: "write-essays",
    order: 5,
    title: "Write your personal statement and essays",
    shortTitle: "Essays",
    summary:
      "The part of the application that is fully yours. A personal statement is not a CV in prose — it's the argument for why you, this field, this university. UK universities and US colleges read them very differently.",
    timing: "4–8 months before deadlines (essays take 3+ serious drafts)",
    whatToDo: [
      "Read the question/prompt precisely — 'why this program' essays fail when they could be sent to any university.",
      "Show, don't claim: concrete projects, competitions, reading and experiences beat adjectives.",
      "Draft, rest, redraft: 3–5 serious versions is normal. Get feedback from people who got in.",
      "Respect the format rules (UCAS has a character limit; US essays have word limits; some have no essays at all — Germany mostly).",
      "Never buy or heavily outsource essays — detection is getting better and the penalty is a ban.",
    ],
    commonMistakes: [
      "Writing one generic statement and submitting it everywhere.",
      "Spending 80% of the essay on childhood inspiration and 20% on actual substance.",
      "Exceeding limits or ignoring the platform's format (UCAS 47 lines, Common App 650 words).",
    ],
    howAdmissionHackHelps: "The Writing School (coming) teaches statement structure with annotated real examples, plus AI feedback scored against real rubrics.",
  },
  {
    slug: "apply-and-track",
    order: 6,
    title: "Apply and track every deadline",
    shortTitle: "Apply & track",
    summary:
      "The submission sprint: application portals, fees, final documents, confirmations. Each university has its own portal, its own deadlines, its own document upload quirks.",
    timing: "Deadlines run October (UK/Oxbridge) through July (some systems) — most are Dec–Feb for Fall intake",
    whatToDo: [
      "Create a master deadline sheet: per university — deadline, portal, fee, documents, exam scores to send.",
      "Pay application fees and send official score reports (SAT/IELTS/TOEFL reporting takes days).",
      "Submit at least a week early — portals crash on deadline day, payment failures happen.",
      "Save every confirmation email and application ID.",
      "Track post-submission items: interviews (US/UK), additional forms, mid-year grade reports.",
    ],
    commonMistakes: [
      "Submitting at 23:50 on the deadline with a payment error and no time to fix it.",
      "Forgetting that official score reports are sent by the testing organization, not by you.",
      "Applying to the wrong intake or campus of the same university.",
    ],
    howAdmissionHackHelps: "The application tracker (coming) is one board for all universities with per-application checklists and deadline reminders.",
  },
  {
    slug: "decide-offers",
    order: 7,
    title: "Compare offers and decide",
    shortTitle: "Decide",
    summary:
      "Offers arrive between December and May. Now the decision inverts: instead of universities choosing you, you choose them — with real numbers: total cost, scholarship, program, city.",
    timing: "December–May (most US decisions land in March–April; UK follows your exam results)",
    whatToDo: [
      "Build a total-cost sheet per offer: tuition + housing + living − scholarship, for all 3–4 years.",
      "Check conditions: many offers are conditional on final exam scores — know exactly what you need.",
      "Compare program substance: curriculum, internships/co-op, exchange options, career services.",
      "Respect deadlines to accept (US: May 1 common date; UK: UCAS reply dates) — acceptance usually needs a deposit.",
      "Decline others politely — waitlists move, and it's the right thing to do.",
    ],
    commonMistakes: [
      "Comparing tuition without living costs — the expensive city changes everything.",
      "Ignoring conditional-offer requirements until results day.",
      "Missing the acceptance deposit deadline and losing the place.",
    ],
    howAdmissionHackHelps: "Offer comparison (coming) lines up total cost, scholarship, ranking and city side by side.",
  },
  {
    slug: "visa-and-arrival",
    order: 8,
    title: "Visa, housing and arrival",
    shortTitle: "Visa & arrival",
    summary:
      "Acceptance letter in hand → student visa → housing → insurance → arrival logistics. Processing times vary from 2 weeks (some countries) to 3+ months, and some need financial proofs you should prepare early.",
    timing: "3–5 months before departure",
    whatToDo: [
      "Start the visa immediately after acceptance — blocked accounts (Germany), GIC (Canada), I-20 (US) all take weeks.",
      "Apply for university housing at the first moment, or research private housing markets early.",
      "Buy the required health insurance (OSHC in Australia, TK/Mawista in Germany, school plan in US).",
      "Prepare finances: a student bank account needs documents you should bring from home.",
      "Book flights for orientation week, not the last legal arrival date.",
    ],
    commonMistakes: [
      "Waiting for the 'perfect' dorm and losing both dorm and affordable private options.",
      "Underestimating visa queues in peak season (June–August).",
      "Arriving without proof of funds documents for border control.",
    ],
    howAdmissionHackHelps: "Arrival checklists per country (coming) — visa documents, housing, insurance, banking, step by step.",
  },
];

export const journeyStepBySlug = (slug: string) => journeySteps.find((s) => s.slug === slug);
