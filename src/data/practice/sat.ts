import type { PracticeBank, Question } from "./types";

/**
 * SAT practice — the first bank in the engine.
 *
 * Original questions written to the real format: Math (algebra, problem solving,
 * geometry) and Reading and Writing (conventions, transitions, rhetoric, and
 * short-passage comprehension). Every answer is verifiable by construction and
 * every explanation says why the wrong ones are wrong, because a practice
 * question without a defensible explanation teaches nothing.
 *
 * Deliberately small and correct rather than large and shaky: content volume is
 * the real bottleneck for this pillar, and the pipeline in the blueprint is how
 * it grows.
 */

const A = (text: string) => ({ id: "A", text });
const B = (text: string) => ({ id: "B", text });
const C = (text: string) => ({ id: "C", text });
const D = (text: string) => ({ id: "D", text });

const questions: Question[] = [
  /* ── Math ─────────────────────────────────────────────────────────────── */
  {
    id: "sat-m-01",
    examId: "sat",
    section: "Math",
    skill: "linear equations",
    prompt: "If 3(x − 4) = 18, what is the value of x?",
    choices: [A("6"), B("8"), C("10"), D("14")],
    answer: "C",
    explanation:
      "Distribute first: 3x − 12 = 18. Add 12 to both sides → 3x = 30, so x = 10. Dividing 18 by 3 first and forgetting the −4 is what produces 6.",
    difficulty: "easy",
  },
  {
    id: "sat-m-02",
    examId: "sat",
    section: "Math",
    skill: "percent change",
    prompt:
      "A jacket is priced at $80. It is discounted by 25%, and then 8% sales tax is added to the discounted price. What is the final cost?",
    choices: [A("$58.00"), B("$60.00"), C("$64.80"), D("$66.40")],
    answer: "C",
    explanation:
      "The discount comes first: 80 × 0.75 = $60. Tax applies to the discounted price: 60 × 1.08 = $64.80. Adding 8% to the original $80 gives $66.40, which is the trap — tax is charged on what you actually pay.",
    difficulty: "medium",
  },
  {
    id: "sat-m-03",
    examId: "sat",
    section: "Math",
    skill: "slope",
    prompt: "What is the slope of the line passing through (2, 5) and (6, 13)?",
    choices: [A("1/2"), B("2"), C("4"), D("8")],
    answer: "B",
    explanation:
      "Slope is rise over run: (13 − 5) / (6 − 2) = 8 / 4 = 2. Choosing the points in the other order changes both signs and leaves the slope unchanged, so order does not matter as long as it is consistent.",
    difficulty: "easy",
  },
  {
    id: "sat-m-04",
    examId: "sat",
    section: "Math",
    skill: "systems of equations",
    prompt: "If x + y = 10 and x − y = 4, what is the value of xy?",
    choices: [A("21"), B("24"), C("25"), D("40")],
    answer: "A",
    explanation:
      "Add the two equations and y cancels: 2x = 14, so x = 7. Substitute back: 7 + y = 10, so y = 3. Then 7 × 3 = 21. Answering 25 is what happens if you stop at x = 7 and square it.",
    difficulty: "medium",
  },
  {
    id: "sat-m-05",
    examId: "sat",
    section: "Math",
    skill: "quadratics",
    prompt: "What is the sum of the solutions to x² − 5x + 6 = 0?",
    choices: [A("−5"), B("1"), C("5"), D("6")],
    answer: "C",
    explanation:
      "Factor: (x − 2)(x − 3) = 0, so the solutions are 2 and 3 and their sum is 5. The sum of the roots of x² + bx + c is −b, here 5; the product is c, which is 6 — the value offered as a distractor.",
    difficulty: "medium",
  },
  {
    id: "sat-m-06",
    examId: "sat",
    section: "Math",
    skill: "proportions",
    prompt: "A recipe for 4 servings calls for 3 cups of flour. How many cups are needed for 10 servings?",
    choices: [A("6.5"), B("7.5"), C("8"), D("12")],
    answer: "B",
    explanation:
      "Find the per-serving amount first: 3 ÷ 4 = 0.75 cups per serving. Multiply by 10 → 7.5 cups. Scaling by the ratio 10/4 directly gives the same thing and is faster under time pressure.",
    difficulty: "easy",
  },
  {
    id: "sat-m-07",
    examId: "sat",
    section: "Math",
    skill: "circles",
    prompt: "A circle has a radius of 6. What is its area?",
    choices: [A("6π"), B("12π"), C("36π"), D("144π")],
    answer: "C",
    explanation:
      "Area is πr², so π × 6² = 36π. Two of the distractors are circumference values: 2πr = 12π is the circumference, and 6π is half of that.",
    difficulty: "easy",
  },
  {
    id: "sat-m-08",
    examId: "sat",
    section: "Math",
    skill: "exponents",
    prompt: "Which expression is equivalent to (2³)² × 2⁻⁴?",
    choices: [A("1"), B("2"), C("4"), D("16")],
    answer: "C",
    explanation:
      "A power of a power multiplies the exponents: (2³)² = 2⁶. Multiplying powers with the same base adds them: 2⁶ × 2⁻⁴ = 2² = 4. Adding 6 and −4 rather than multiplying is the usual slip.",
    difficulty: "medium",
  },
  {
    id: "sat-m-09",
    examId: "sat",
    section: "Math",
    skill: "averages",
    prompt:
      "A student's first four test scores average 85. What score on the fifth test would raise the average to 88?",
    choices: [A("88"), B("91"), C("100"), D("104")],
    answer: "C",
    explanation:
      "Work with totals, not averages. Five scores averaging 88 total 5 × 88 = 440; the first four total 4 × 85 = 340; the difference is 100. Choosing 88 leaves the average unchanged.",
    difficulty: "medium",
  },
  {
    id: "sat-m-10",
    examId: "sat",
    section: "Math",
    skill: "inequalities",
    prompt:
      "A taxi charges a flat $3 plus $2 per mile. If a rider can spend at most $25, what is the greatest whole number of miles they can travel?",
    choices: [A("10"), B("11"), C("12"), D("13")],
    answer: "B",
    explanation:
      "Set up 3 + 2m ≤ 25 → 2m ≤ 22 → m ≤ 11, so 11 is the greatest whole number. Twelve miles costs $27, which exceeds the budget — the answer has to satisfy the inequality, not just round to it.",
    difficulty: "medium",
  },
  {
    id: "sat-m-11",
    examId: "sat",
    section: "Math",
    skill: "functions",
    prompt: "If f(x) = 2x² − 3x + 1, what is the value of f(−2)?",
    choices: [A("3"), B("11"), C("15"), D("21")],
    answer: "C",
    explanation:
      "Substitute −2, keeping the parentheses: 2(−2)² − 3(−2) + 1 = 2(4) + 6 + 1 = 15. Dropping the sign on the second term gives 3, which is the most common wrong answer here.",
    difficulty: "medium",
  },
  {
    id: "sat-m-12",
    examId: "sat",
    section: "Math",
    skill: "averages",
    prompt:
      "The average of five numbers is 12. If four of them are 8, 10, 14 and 16, what is the fifth?",
    choices: [A("10"), B("12"), C("14"), D("16")],
    answer: "B",
    explanation:
      "Five numbers averaging 12 total 60. The four given numbers total 48, so the fifth is 12. Note the fifth equals the average, which is possible because the four known values also average 12.",
    difficulty: "easy",
  },

  /* ── Reading and Writing ─────────────────────────────────────────────── */
  {
    id: "sat-rw-01",
    examId: "sat",
    section: "Reading and Writing",
    skill: "essential clauses",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context:
      "The map ______ revealed a rift valley running down the middle of the Atlantic.",
    choices: [
      A("that Tharp completed in 1957,"),
      B("that Tharp completed in 1957"),
      C(", that Tharp completed in 1957,"),
      D("; that Tharp completed in 1957"),
    ],
    answer: "B",
    explanation:
      "The clause identifies which map is meant, so it is essential to the sentence and takes no commas — and an essential clause is introduced by that, not which. Commas (A and C) would turn it into a parenthetical aside, and a semicolon (D) cannot join a fragment.",
  },
  {
    id: "sat-rw-02",
    examId: "sat",
    section: "Reading and Writing",
    skill: "joining clauses",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context: "The data were incomplete, ______ the team repeated the survey.",
    choices: [A("so"), B("therefore"), C("however"), D("nevertheless")],
    answer: "A",
    explanation:
      "Two independent clauses need either a semicolon or a comma plus a coordinating conjunction. So is a coordinating conjunction, so the comma is doing its job. Therefore, however and nevertheless are conjunctive adverbs: with a comma alone they create a comma splice, and they would need a semicolon before them.",
  },
  {
    id: "sat-rw-03",
    examId: "sat",
    section: "Reading and Writing",
    skill: "subject-verb agreement",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context: "A collection of hand-drawn maps ______ stored in the university archive.",
    choices: [A("are"), B("were"), C("is"), D("have been")],
    answer: "C",
    explanation:
      "The subject is collection, which is singular; of hand-drawn maps is a prepositional phrase and cannot change the number of the subject. Ignoring the intervening phrase is the whole skill being tested here.",
  },
  {
    id: "sat-rw-04",
    examId: "sat",
    section: "Reading and Writing",
    skill: "possessives",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context: "The three ______ findings were published together in a single volume.",
    choices: [A("scientist's"), B("scientists"), C("scientists'"), D("scientists's")],
    answer: "C",
    explanation:
      "Three scientists means a plural noun, and the findings belong to them, so the possessive goes after the plural s: scientists'. The form scientist's is singular (A), and scientists (B) is not possessive at all, which leaves the sentence saying the findings are the scientists.",
  },
  {
    id: "sat-rw-05",
    examId: "sat",
    section: "Reading and Writing",
    skill: "transitions",
    prompt: "Which choice completes the text with the most logical transition?",
    context:
      "The survey was conducted entirely in winter. ______ the researchers believe the pattern they found holds throughout the year.",
    choices: [A("Therefore,"), B("Consequently,"), C("Nevertheless,"), D("Accordingly,")],
    answer: "C",
    explanation:
      "The second sentence runs against what the first one would lead you to expect — a winter-only survey is weak evidence for a year-round claim, yet they make the claim. That is contrast, which is nevertheless. The other three all signal a result, which reverses the logic.",
  },
  {
    id: "sat-rw-06",
    examId: "sat",
    section: "Reading and Writing",
    skill: "concision",
    prompt: "Which choice most effectively states the idea without redundancy?",
    context: "The team cooperated together to produce a map that was completely finished.",
    choices: [
      A("cooperated together to produce a map that was completely finished."),
      B("cooperated to produce a finished map."),
      C("cooperated together to produce a finished map."),
      D("worked together cooperatively to produce a completed and finished map."),
    ],
    answer: "B",
    explanation:
      "Cooperate already means to work together, and finished already means complete, so together and completely add nothing. B keeps every bit of meaning in the fewest words; the others repeat at least one idea.",
  },
  {
    id: "sat-rw-07",
    examId: "sat",
    section: "Reading and Writing",
    skill: "verb tense",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context: "By the time the ship returned to port, the crew ______ the entire coastline.",
    choices: [A("maps"), B("had mapped"), C("has mapped"), D("will map")],
    answer: "B",
    explanation:
      "The mapping finished before the ship returned, so it needs the past perfect — had mapped — to place one past action before another. Present perfect (C) cannot describe something completed before a past event, and the other two do not fit the timeline at all.",
  },
  {
    id: "sat-rw-08",
    examId: "sat",
    section: "Reading and Writing",
    skill: "pronoun reference",
    prompt: "Which choice completes the text so that it is clear and conforms to the conventions of Standard English?",
    context:
      "When Tharp showed the completed map to her colleague Bruce Heezen, ______ was sceptical at first.",
    choices: [A("he"), B("they"), C("it"), D("she")],
    answer: "A",
    explanation:
      "The pronoun must refer to the colleague, and naming him makes that unambiguous — he is the only logical subject of the scepticism, since Tharp is the one presenting the evidence. She (D) would wrongly return to Tharp and leave the colleague's reaction unstated.",
  },
  {
    id: "sat-rw-09",
    examId: "sat",
    section: "Reading and Writing",
    skill: "main idea",
    prompt: "Which choice best states the main idea of the text?",
    context:
      "For decades the ocean floor was assumed to be flat and featureless. Tharp's maps showed a continuous mountain range splitting the Atlantic. Geologists initially dismissed the work as 'girl talk'. Today that rift is the central evidence for plate tectonics.",
    choices: [
      A("Tharp's mapping of the Atlantic floor, dismissed when it appeared, became central evidence for plate tectonics."),
      B("Ocean floors are more mountainous than the surfaces of the continents."),
      C("Geologists in the middle of the twentieth century were unwilling to accept new evidence."),
      D("Tharp spent many years collecting data before publishing her maps."),
    ],
    answer: "A",
    explanation:
      "The passage moves from dismissal to acceptance of one specific contribution, and A is the only choice covering both halves of that arc. B and C are broader claims the text does not make, and D describes the effort rather than the idea.",
  },
  {
    id: "sat-rw-10",
    examId: "sat",
    section: "Reading and Writing",
    skill: "inference",
    prompt: "Which choice most logically completes the text?",
    context:
      "Tharp could not publish her rift-valley discovery on its own; her colleague refused to accept it until he had re-plotted the data himself. The episode suggests that ______",
    choices: [
      A("scientific acceptance can turn on who presents the evidence, not only on the evidence itself."),
      B("data are always more reliable when a second person re-plots them."),
      C("Tharp's maps were later shown to contain significant errors."),
      D("colleagues should avoid collaborating on mapping projects."),
    ],
    answer: "A",
    explanation:
      "The detail that carries the meaning is who: the same finding became credible once a colleague reproduced it. B overstates it with always, C contradicts the passage, and D draws a practical rule the text never argues for.",
  },
  {
    id: "sat-rw-11",
    examId: "sat",
    section: "Reading and Writing",
    skill: "punctuation",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context:
      "The expedition needed three things ______ a sounding device, a stable ship and a great deal of patience.",
    choices: [A(":"), B(","), C(";"), D(" — and")],
    answer: "A",
    explanation:
      "A colon introduces a list after a complete clause, and the expedition needed three things is complete. A comma (B) is too weak for this job, and a semicolon (C) must join two independent clauses, which the list is not.",
  },
  {
    id: "sat-rw-12",
    examId: "sat",
    section: "Reading and Writing",
    skill: "possessives",
    prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    context: "After the move, the original map had lost ______ labels.",
    choices: [A("it's"), B("its"), C("its'"), D("it is")],
    answer: "B",
    explanation:
      "Its is the possessive form; it's is always a contraction of it is, and would read as the original map had lost it is labels. There is no form its' in English.",
  },
];

export const satBank: PracticeBank = {
  set: {
    id: "sat-mixed-24",
    examId: "sat",
    name: "Mixed set — Math and Reading & Writing",
    blurb:
      "Twenty-four original questions across both sections, with an explanation for every answer. Untimed: the clock counts up so you can see your pace without being pushed.",
    minutes: 32,
  },
  questions,
};
