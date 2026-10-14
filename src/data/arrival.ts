/**
 * After the offer: the visa and arrival sequence, and the first two weeks.
 *
 * The eight admission phases stop at "decide offers". This is what happens next,
 * and it is where a season can still be lost — not by rejection but by a deposit
 * deadline nobody read, or a financial statement that has to sit in an account for
 * weeks before it counts.
 *
 * Every step is measured backwards from the enrolment month, the same convention
 * the admission journey uses (`offset.minMonths`/`maxMonths` are months before
 * enrolment), so the dashboard can put real dates on this exactly as it does on
 * the timeline. The ranges are typical, not guarantees: visa processing in
 * particular swings wildly by country and by season, and the verified per-country
 * figures live in the country guides, not here.
 */

export interface ArrivalStep {
  slug: string;
  order: number;
  title: string;
  /** what you actually do */
  what: string;
  /** why it is here, and what breaks when it slips */
  why: string;
  /** the human-readable range, kept alongside the machine-readable offset */
  timing: string;
  offset: { from: "enrollment"; minMonths: number; maxMonths: number };
  mistakes: string[];
}

export const ARRIVAL_STEPS: ArrivalStep[] = [
  {
    slug: "decide-the-offer",
    order: 1,
    title: "Decide which offer to take",
    what:
      "Compare the offers properly — total cost after any scholarship, the conditions attached, and the reply deadline on each — then pick one.",
    why:
      "Reply deadlines are hard, and a missed one forfeits the place with no appeal. This is also the last moment when the decision is entirely yours.",
    timing: "5–6 months before enrollment",
    offset: { from: "enrollment", minMonths: 4, maxMonths: 6 },
    mistakes: [
      "Choosing on prestige alone and discovering the funding gap later.",
      "Missing that an offer is conditional — on final grades, or on a test score still to come.",
      "Letting the deposit deadline pass while waiting for another university.",
    ],
  },
  {
    slug: "accept-and-deposit",
    order: 2,
    title: "Accept, and pay the deposit",
    what:
      "Accept formally through the university's own portal and pay the deposit it asks for. Keep every receipt and the confirmation email.",
    why:
      "The deposit is what actually reserves your place, and it usually counts toward tuition rather than being an extra fee. It is also normally non-refundable if you change your mind.",
    timing: "3–5 months before enrollment",
    offset: { from: "enrollment", minMonths: 3, maxMonths: 5 },
    mistakes: [
      "Paying from an account in someone else's name without a sponsorship letter alongside it.",
      "Paying late and being moved to a waiting list for the place you had already won.",
    ],
  },
  {
    slug: "sponsorship-document",
    order: 3,
    title: "Get the document the visa is built on",
    what:
      "Once you accept, the university issues the document your visa application rests on — an I-20 (US), a CAS (UK), a CoE (Australia), an admission letter for the German or Dutch route. It takes weeks, not days.",
    why:
      "Without it you cannot even book a visa appointment. And you have to check it before you do: a misspelled name or a wrong date on this document is the single most common cause of a refused or delayed application.",
    timing: "3–4 months before enrollment",
    offset: { from: "enrollment", minMonths: 3, maxMonths: 4 },
    mistakes: [
      "Not checking the spelling of your name against your passport.",
      "Starting the visa paperwork only after it arrives, rather than preparing everything in parallel.",
    ],
  },
  {
    slug: "financial-proof",
    order: 4,
    title: "Prepare the financial proof — and let it age",
    what:
      "Assemble bank statements, a sponsor letter or a blocked account in the exact form your destination wants.",
    why:
      "This is the step that silently costs people a year. Many countries require the money to have been in the account for a period before the statement is issued — the UK, for instance, effectively wants it held for 28 consecutive days. Money that arrives the week before the statement does not count, and no explanation at the counter fixes it.",
    timing: "4–6 months before enrollment",
    offset: { from: "enrollment", minMonths: 4, maxMonths: 6 },
    mistakes: [
      "A large deposit made just before the statement, which reads as manufactured.",
      "Funds in a relative's account with no sponsorship letter establishing the relationship.",
      "Assuming last year's requirement still applies — these figures change annually.",
    ],
  },
  {
    slug: "apply-for-visa",
    order: 5,
    title: "Apply for the visa and book the appointment",
    what:
      "Complete the visa application, pay the fee, and book a biometrics or interview appointment — then attend it with the original documents, not copies.",
    why:
      "In peak season, appointment slots in the busiest countries can be weeks out, and the appointment is a hard gate: nothing moves while you wait for a slot.",
    timing: "2–3 months before enrollment",
    offset: { from: "enrollment", minMonths: 2, maxMonths: 3 },
    mistakes: [
      "Booking flights before the visa is granted.",
      "Arriving at the appointment with copies when originals were required.",
      "Applying in a country where you cannot prove residence, which some consulates refuse outright.",
    ],
  },
  {
    slug: "visa-decision",
    order: 6,
    title: "The visa decision",
    what:
      "Wait, and keep the university informed if it runs long. Chase only through official channels.",
    why:
      "Published processing times are a median, not a promise, and they lengthen sharply in the summer. This window is why everything before it is measured in months rather than weeks.",
    timing: "1–2 months before enrollment",
    offset: { from: "enrollment", minMonths: 1, maxMonths: 2 },
    mistakes: [
      "Booking a departure date the week the window opens.",
      "Sending documents the consulate did not ask for, which can slow the case rather than help it.",
    ],
  },
  {
    slug: "housing-and-practicalities",
    order: 7,
    title: "Housing, insurance, money",
    what:
      "Secure accommodation for at least the first month, arrange health insurance, and get a card that works abroad.",
    why:
      "Student accommodation in university cities fills months ahead, and landlords in many countries will not sign to someone with no local bank account. Getting this wrong is expensive in a way the visa is not.",
    timing: "1–3 months before enrollment",
    offset: { from: "enrollment", minMonths: 1, maxMonths: 3 },
    mistakes: [
      "Renting sight-unseen from an unverified listing — advance-fee rental fraud targets exactly this moment.",
      "Arriving with nowhere to stay and no way to pay a deposit.",
    ],
  },
  {
    slug: "arrive-and-register",
    order: 8,
    title: "Arrive and register",
    what:
      "Enrol at the university, register your address with the local authority where that is required, and start the residence-permit process.",
    why:
      "Registration has its own deadlines, and the residence permit is usually time-limited from the day you arrive: a window you can miss by simply not knowing it exists. Some steps — a local bank account, an address registration — are prerequisites for each other, so the order matters.",
    timing: "0–1 months before enrollment",
    offset: { from: "enrollment", minMonths: 0, maxMonths: 1 },
    mistakes: [
      "Assuming the student visa is the same as a residence permit — in much of Europe it is only the entry document.",
      "Missing the permit application window, which can mean leaving the country to restart it.",
    ],
  },
];

/** The first fortnight, once you are actually there. */
export interface ArrivalTask {
  title: string;
  detail: string;
  /** country-specific notes, kept separate so the generic task stays generic */
  where?: string;
}

export const FIRST_WEEKS: ArrivalTask[] = [
  {
    title: "Enrol and collect your student card",
    detail:
      "This is what makes you a student rather than an admitted one — it unlocks the library, the campus systems and usually the transport discount.",
  },
  {
    title: "Register your address with the local authority",
    detail:
      "Many countries require you to register where you live within days of moving in.",
    where: "Germany calls it the Anmeldung and you cannot open a bank account or get a residence permit without it.",
  },
  {
    title: "Apply for the residence permit",
    detail:
      "A student visa is usually permission to enter, not permission to stay. The permit is a separate application with its own deadline, counted from your arrival.",
  },
  {
    title: "Open a local bank account",
    detail:
      "Needed for rent, for the permit in some countries, and for getting paid if you take a student job.",
    where: "In several EU countries the address registration must be done first.",
  },
  {
    title: "Sort out health insurance",
    detail:
      "Check what the university provides and what your visa already required — do not pay twice for the same cover.",
  },
  {
    title: "Keep copies of everything",
    detail:
      "Passport, visa, permit paperwork, insurance, admission letter, tenancy. Photographs on your phone and one set somewhere else — you will be asked for these more often than seems reasonable.",
  },
  {
    title: "Go to orientation",
    detail:
      "It is where the practical answers live: the permit desk, the bank that accepts students, which office actually replies to email.",
  },
  {
    title: "Find out how your course is assessed, early",
    detail:
      "Grading conventions differ between countries more than anyone warns you. Ask in week one, not in the week before the first exam.",
  },
];
