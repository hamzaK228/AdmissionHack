/**
 * The Writing School: the essay, taught by example.
 *
 * Everything here is **original writing produced for this guide**. No line is
 * taken from a real applicant's essay, and none of these was "the essay that got
 * someone in" — that claim is unfalsifiable, and it is the one an anxious
 * seventeen-year-old will believe hardest. The point is not to hand over a model
 * to copy; it is to show, line by line, what a reader is doing when they read,
 * so the same moves can be made in a story that is actually the applicant's.
 *
 * The format is deliberate: a paragraph, then the note explaining what that
 * paragraph is *doing*. Technique is invisible in a finished essay and obvious in
 * an annotated one.
 */

export interface AnnotatedParagraph {
  text: string;
  /** the margin note — what this paragraph is doing, and why */
  note?: string;
}

export interface AnnotatedExample {
  id: string;
  kind: string;
  title: string;
  /** who "the applicant" is here, so the essay has somewhere to stand */
  premise: string;
  paragraphs: AnnotatedParagraph[];
  takeaways: string[];
}

export interface BeforeAfter {
  id: string;
  problem: string;
  before: string;
  after: string;
  why: string;
}

export const PROVENANCE =
  "These are model essays written for this guide to demonstrate technique — not a real applicant's essay, and not one that was admitted anywhere. Copy the moves, never the sentences.";

/** What an admissions reader is actually doing. Short, and true. */
export const READER_RULES: { title: string; body: string }[] = [
  {
    title: "They read fast, and once.",
    body: "Minutes per file, and usually in one pass. If paragraph one is scenery, they are already forming a judgement before you have said anything about yourself.",
  },
  {
    title: "They are looking for a person.",
    body: "Grades, scores and transcripts are numbers. The essay is the only part of the file that is a human being, so the real test is whether you are in it — and whether you can be imagined on the campus.",
  },
  {
    title: "They distrust large claims.",
    body: "“I am passionate about helping people” is unfalsifiable and therefore weightless. A specific Tuesday afternoon with a name and a temperature is evidence, and evidence is what moves a reader.",
  },
  {
    title: "They are assembling a cohort, not a ranking.",
    body: "Among applicants with similar numbers, the question changes to what you would add. That is why the most useful essay is specific rather than impressive.",
  },
  {
    title: "They have read the same essay before.",
    body: "A thousand times. Anything you have seen in a sample essay is the one thing that will not stand out — which is exactly the risk of copying a model.",
  },
];

/** The shape that works, in order. Not a formula to fill in; a spine to hang a story on. */
export const ESSAY_SHAPE: { step: string; what: string; example: string }[] = [
  {
    step: "A specific moment",
    what: "One scene, one place, one object. Start inside it, not above it.",
    example: "The bus shelter outside my old school was designed for rain.",
  },
  {
    step: "What you noticed",
    what: "The moment most drafts skip. Stay in the observation long enough to name the real problem — not the symptom.",
    example: "The shelter was built by competent people for a climate that does not exist here.",
  },
  {
    step: "What you did about it",
    what: "The action, with a real outcome and its honest limit. Small and specific beats large and vague.",
    example: "Two shelters were rotated. It cost almost nothing, and it did not fix the budget.",
  },
  {
    step: "What that says about how you work",
    what: "This is where the essay becomes an argument about your future — and justifies the course you are applying to.",
    example: "I am interested in where a design meets a budget, a standard and a committee.",
  },
  {
    step: "Why here (optional, and short)",
    what: "One specific thing, named. A paragraph of flattery reads as a template.",
    example: "Your fourth-year design project is the closest thing to the work I have been doing badly alone.",
  },
];

export const EXAMPLES: AnnotatedExample[] = [
  {
    id: "ug-engineering",
    kind: "Personal statement · undergraduate engineering",
    title: "The bus shelter built for rain",
    premise:
      "A Kazakhstani applicant to undergraduate engineering in the UK and the Netherlands. The one thing worth knowing: they are interested in why engineering decisions get made, not only in how structures stand up.",
    paragraphs: [
      {
        text: "The bus shelter outside my old school was designed for rain. In Astana, where a January day averages minus fifteen degrees, that is an error you can stand inside: a flat roof that holds snow until it sags, a bench you cannot sit on in a coat, and a gap under the glass that funnels wind exactly where you wait. I used it twice a day for six years, and I never once saw an adult use it.",
        note: "Opens with one object in one place, and a small sharp claim in the last sentence. No childhood dreams, no “ever since I was young”. The reader is standing somewhere within about ten seconds.",
      },
      {
        text: "What bothered me was not the cold. It was that the shelter had been built by people who were not careless. They were competent, and they had built something for a climate that does not exist here; the standard drawings the city used came from somewhere warmer. Nobody had asked what that roof does at minus thirty.",
        note: "The noticing — the paragraph most drafts skip. Sitting in the observation long enough to name the real problem (a borrowed standard, not incompetence) is what makes the next paragraph necessary rather than incidental.",
      },
      {
        text: "So I asked. Over one winter I measured air temperature and wind speed at eight stops, at the hours people actually wait, and put it into a spreadsheet my physics teacher found more amusing than useful. The transport office let me bring it to a meeting, and two shelters were rotated so the glass broke the wind instead of channelling it. It cost almost nothing. What it did not fix is the interesting part: the department's budget is written for maintenance, not for redesign, so a change that pays for itself in five years cannot be paid for this year.",
        note: "Action with a real outcome and its honest limit. “Two shelters rotated” is small and specific — resist inflating it. “I revolutionised public transport” would undo everything the first two paragraphs earned, and the closing sentence shows the institutional thinking the rest of the file cannot.",
      },
      {
        text: "That is why I want to study structural engineering rather than physics. I am interested in the part where a design meets a budget, a standard and a committee. A structure that is correct on paper and unbuildable here is, to the person waiting in the wind, the same as one that was never designed.",
        note: "The paragraph that justifies the field and the degree. It converts a hobby into a professional motivation, and answers the question the reader is silently asking: why engineering school, and why you?",
      },
      {
        text: "Your fourth-year design project, where students take one brief through to a costed proposal, is the closest thing I have found to the work I have been doing badly on my own. I would like to do it properly.",
        note: "One named detail about the university — one is enough. Note the deliberate self-deprecation: “badly on my own” is more credible than confidence, and it is true.",
      },
    ],
    takeaways: [
      "One story, not a list of achievements. Everything in the essay serves a single argument.",
      "It shows a way of thinking, which is not the same thing as showing an interest.",
      "Every claim is small enough to be true, which is why none of it reads as exaggeration.",
      "It answers “why this field”, and then, briefly, “why here”.",
    ],
  },
  {
    id: "pg-biostatistics",
    kind: "Statement of purpose · graduate biostatistics",
    title: "The report I signed for nine months",
    premise:
      "An applicant to a master's in biostatistics who prepares a district health report. The thing to establish: they already do the work, and they know precisely which part of it they cannot yet do.",
    paragraphs: [
      {
        text: "For two years I have prepared the monthly tuberculosis report for a district of about 400,000 people. My job is to turn four clinics' paper registers into one table. The hard part has never been the arithmetic. It is that the clinics define a “new case” slightly differently, and nobody has ever written down how.",
        note: "A statement of purpose is read as evidence that you understand what research is. This opens with an unglamorous job and locates the problem inside it — definitions, not data. That is a statistician's problem, stated in a practitioner's language.",
      },
      {
        text: "In March I found that one clinic had been recording re-treatments in the same column as new cases for eleven months. Nobody was wrong: the form has one column where it needs two. That period's district total is not recoverable, and I had signed the previous nine reports.",
        note: "A real failure, owned by the writer. This is the strongest move available here. Applicants avoid admitting error; readers notice when they do not, and it establishes that the writer treats data quality as an institutional problem rather than a personal one.",
      },
      {
        text: "I have since rewritten the form and trained the four clerks, and the numbers hold. But I fixed one district with a form and a morning of training, and I cannot answer the obvious question: how much of the change is the form, and how much is that the clerks know they are being watched? That is a measurement problem, and I do not have the training to design it.",
        note: "The bridge. It states what they have already built — so they are not arriving empty-handed — and then names the specific gap. The gap has to be something the programme teaches. “I want to learn more” is not a gap; this is.",
      },
      {
        text: "I want to work on the measurement of routine health data in settings where the data is produced by people whose job is not to produce data. At [university] that means the routine-data group and the causal inference sequence in the second term, which is the training I described above.",
        note: "A precise research interest, tied to two named pieces of the actual programme. This is what separates a statement of purpose from a personal statement: it is a research plan, and it should be checkable against the department's own pages.",
      },
    ],
    takeaways: [
      "It opens with the work, not the ambition — and the work is specific enough to be verified.",
      "The admitted failure is the most persuasive sentence in the essay.",
      "The stated gap is a gap a master's actually fills, not a vague appetite for knowledge.",
      "The interest is narrow enough to be real, and it names where it would be pursued.",
    ],
  },
];

export const BEFORE_AFTER: BeforeAfter[] = [
  {
    id: "throat-clearing",
    problem: "The opening that clears its throat",
    before:
      "Ever since I was a child, I have been passionate about medicine. My journey began when I first visited a hospital at the age of seven, and since then I have always been fascinated by how the human body works.",
    after:
      "The first time I held a real patient's chart, I was fifteen and I could not read a single one of the doctor's abbreviations. I copied all of them into a notebook and looked them up that night.",
    why: "The first version says nothing that could not be said by anyone, and it spends four lines arriving. The second starts in a scene, admits ignorance, and shows a habit — it is already an argument about the writer. Cut every sentence before your first concrete image.",
  },
  {
    id: "numbers-without-meaning",
    problem: "The achievement with no consequence",
    before:
      "I founded a debate club with 50 members, organised 12 tournaments, and won 3 regional awards, demonstrating my leadership and organisational skills.",
    after:
      "Our debate club had fifty members in name and eleven who came. The problem was that our top team won everything, so nobody else ever got to speak in a final. I fixed it by making the strongest debaters coach the weakest for a term, which cost us one trophy and doubled the number of people who could hold an argument.",
    why: "Numbers without consequence read as a résumé pasted into prose, and “demonstrating my leadership” tells the reader what to conclude — the one thing a good essay never does. The second version keeps the real difficulty and shows a decision with a cost. A cost is what makes a choice believable.",
  },
  {
    id: "adjective-pile",
    problem: "The adjective pile",
    before:
      "I am a hardworking, dedicated, curious and resilient student who thrives under pressure and is not afraid to take on challenges.",
    after:
      "I missed the registration deadline for the olympiad by a day. I wrote to the organisers, asked to sit it unranked, and did — which is how I learned that the rules have more room in them than the notice implies.",
    why: "Adjectives about character are the cheapest currency in an application: every applicant claims them, so none of them distinguish anyone. One episode that shows the trait is worth a hundred adjectives, and the reader draws the conclusion themselves — which is when they believe it.",
  },
];

/** The five ways drafts actually fail. Each one is detectable, which is the point. */
export const FAILURE_MODES: { name: string; tell: string }[] = [
  {
    name: "The scenery opening",
    tell: "Your first line describes a place, a time of year, or a dictionary definition. Test: could that sentence sit at the top of someone else's essay? Then it is not yours yet.",
  },
  {
    name: "The résumé in prose",
    tell: "Paragraphs that list what you did in the order you did it. If nothing in a paragraph changes because of the one before it, you have written a list with conjunctions.",
  },
  {
    name: "The thesaurus",
    tell: "Words you would not use aloud. Inflated vocabulary is read as a lack of confidence, not as intelligence — and a reader who is tripping over your sentences is not absorbing your argument.",
  },
  {
    name: "The essay that could be anyone's",
    tell: "Remove your name and someone else could sign it. Usually caused by naming the category (volunteering, research) instead of the particular thing (the Tuesday, the form, the eleven months).",
  },
  {
    name: "The moral you explain",
    tell: "Any sentence beginning “This experience taught me that…”. You have done the work; do not then do the reader's thinking for them. State the fact and stop.",
  },
];
