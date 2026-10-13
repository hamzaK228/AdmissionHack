import type { PracticeBank, Question } from "./types";

/**
 * IELTS Academic Reading practice — the second bank.
 *
 * Added to test the blueprint's claim that a new exam is one content file plus one
 * registry line. It also exercises two things the SAT bank did not: a three-choice
 * question (True / False / Not Given) and a shared passage.
 *
 * The passage is carried on EVERY question rather than once per group, which is not
 * redundancy for its own sake: the runner shuffles, so a question must bring its own
 * context or a shuffled set would show one passage's text beside another's question.
 *
 * Original writing about real subjects — the shipping container and urban
 * beekeeping — written to the format, not taken from any published test.
 */

const PASSAGE_CONTAINER = `Before 1956, loading a cargo ship was slow and expensive. Goods arrived at the dock in sacks, barrels and crates, and gangs of dockworkers carried each item into the hold by hand. A single vessel might spend a week in port. Malcom McLean, an American trucking entrepreneur, saw that most of the cost lay not in moving goods across the ocean but in moving them on and off the ship. His solution was to put freight into a standard steel box that could be lifted from a truck, stacked on a vessel, and lifted onto another truck at the far end without any of the cargo being handled. The first such voyage, in April 1956, carried fifty-eight boxes from Newark to Houston. Ports that adapted grew rapidly; those that did not lost their trade within a decade. The box itself is unremarkable — what made the system work was the standardisation of its dimensions.`;

const PASSAGE_BEES = `City honey has become an unexpected curiosity. Analyses of hives in several European capitals have found a wider variety of pollen than in nearby farmland, which surprises people who assume the countryside must be better for bees. The reason is largely botanical: gardens, parks and balconies hold ornamental species that flower at different times, so a city hive can draw on a supply that lasts longer than a single crop. Warmth matters too — a city runs a few degrees hotter than the surrounding land, which extends the season at both ends. The picture is not entirely favourable. Urban colonies can be denser than the flowers around them can support, and beekeepers who crowd a district may weaken every hive in it by competing for the same limited forage. Some researchers therefore argue that planting more flowers does more for city bees than adding more hives does.`;

const TFN = [{ id: "A", text: "True" }, { id: "B", text: "False" }, { id: "C", text: "Not Given" }];

const questions: Question[] = [
  /* ── Passage 1: the shipping container ─────────────────────────────────── */
  {
    id: "ielts-r-01",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?",
    context: PASSAGE_CONTAINER,
    choices: TFN,
    answer: "B",
    explanation:
      "False, not Not Given — the passage directly contradicts it: most of the cost lay not in moving goods across the ocean but in moving them on and off the ship.",
  },
  {
    id: "ielts-r-02",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?\n\nMcLean had worked in the shipping industry before 1956.",
    context: PASSAGE_CONTAINER,
    choices: TFN,
    answer: "C",
    explanation:
      "Not Given. The passage calls him a trucking entrepreneur and says nothing about any earlier career. The test is not whether it sounds unlikely — it is whether the passage states or contradicts it, and here it does neither.",
  },
  {
    id: "ielts-r-03",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?\n\nThe first container voyage took place in April 1956.",
    context: PASSAGE_CONTAINER,
    choices: TFN,
    answer: "A",
    explanation: "True — the passage gives that date and month for the first such voyage.",
  },
  {
    id: "ielts-r-04",
    examId: "ielts",
    section: "Reading",
    skill: "detail",
    prompt: "According to the passage, what made the container system work?",
    context: PASSAGE_CONTAINER,
    choices: [
      { id: "A", text: "The strength of the steel box." },
      { id: "B", text: "The standardisation of the box's dimensions." },
      { id: "C", text: "The speed of the ships that carried it." },
      { id: "D", text: "Support from the ports that adopted it." },
    ],
    answer: "B",
    explanation:
      "The final sentence says the box itself is unremarkable and that standardisation is what made the system work. A is the plausible-sounding distractor: strength is never offered as the reason.",
  },
  {
    id: "ielts-r-05",
    examId: "ielts",
    section: "Reading",
    skill: "detail",
    prompt: "What happened to ports that did not adapt?",
    context: PASSAGE_CONTAINER,
    choices: [
      { id: "A", text: "They invested in new cranes." },
      { id: "B", text: "They lost their trade within ten years." },
      { id: "C", text: "They continued as before." },
      { id: "D", text: "They specialised in handling barrels." },
    ],
    answer: "B",
    explanation: "The passage states it directly: those that did not lost their trade within a decade.",
  },
  {
    id: "ielts-r-06",
    examId: "ielts",
    section: "Reading",
    skill: "detail",
    prompt: "Which of the following is true of the first container voyage?",
    context: PASSAGE_CONTAINER,
    choices: [
      { id: "A", text: "It carried fifty-eight boxes." },
      { id: "B", text: "It travelled from Houston to Newark." },
      { id: "C", text: "It carried more than a hundred boxes." },
      { id: "D", text: "It spent a week in port." },
    ],
    answer: "A",
    explanation:
      "Fifty-eight boxes, Newark to Houston — so A is right and B reverses the direction. D describes the slow pre-container voyages, which is the trap for a careless read.",
  },

  /* ── Passage 2: urban bees ─────────────────────────────────────────────── */
  {
    id: "ielts-r-07",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?\n\nCity hives have been found to contain a wider variety of pollen than hives on nearby farmland.",
    context: PASSAGE_BEES,
    choices: TFN,
    answer: "A",
    explanation: "True — this is the finding the first two sentences report.",
  },
  {
    id: "ielts-r-08",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?\n\nCity honey tastes better than honey produced in the countryside.",
    context: PASSAGE_BEES,
    choices: TFN,
    answer: "C",
    explanation:
      "Not Given. The passage discusses variety of pollen and the length of the season, and never mentions taste at all. A claim that is merely plausible is still Not Given.",
  },
  {
    id: "ielts-r-09",
    examId: "ielts",
    section: "Reading",
    skill: "true / false / not given",
    prompt: "Do the following statements agree with the information in the passage?\n\nA city is warmer than the land surrounding it.",
    context: PASSAGE_BEES,
    choices: TFN,
    answer: "A",
    explanation:
      "True — a city runs a few degrees hotter than the surrounding land, and the passage names this as one of the reasons the season is longer.",
  },
  {
    id: "ielts-r-10",
    examId: "ielts",
    section: "Reading",
    skill: "cause",
    prompt: "Why can a city hive draw on a supply of nectar for longer than a single crop can provide?",
    context: PASSAGE_BEES,
    choices: [
      { id: "A", text: "Cities contain more beekeepers." },
      { id: "B", text: "Ornamental plants flower at different times." },
      { id: "C", text: "Farmland has no flowers in summer." },
      { id: "D", text: "City bees travel further to feed." },
    ],
    answer: "B",
    explanation:
      "The botanical reason given is that gardens, parks and balconies hold species flowering at different times. C overstates a contrast the passage never makes.",
  },
  {
    id: "ielts-r-11",
    examId: "ielts",
    section: "Reading",
    skill: "detail",
    prompt: "What problem does the passage identify with city beekeeping?",
    context: PASSAGE_BEES,
    choices: [
      { id: "A", text: "City honey contains more pollutants." },
      { id: "B", text: "Urban colonies may outnumber the flowers available to them." },
      { id: "C", text: "Bees cannot survive in cities over the winter." },
      { id: "D", text: "Farmland honey is more varied than city honey." },
    ],
    answer: "B",
    explanation:
      "The passage says urban colonies can be denser than the flowers around them can support, and that crowding can weaken every hive in a district. A is a common belief the passage never raises, and D reverses the finding.",
  },
  {
    id: "ielts-r-12",
    examId: "ielts",
    section: "Reading",
    skill: "recommendation",
    prompt: "What do some researchers recommend?",
    context: PASSAGE_BEES,
    choices: [
      { id: "A", text: "Moving city hives out to farmland." },
      { id: "B", text: "Planting more flowers rather than adding more hives." },
      { id: "C", text: "Reducing the number of parks and gardens." },
      { id: "D", text: "Testing city honey for pollen." },
    ],
    answer: "B",
    explanation:
      "The last sentence is the recommendation: planting more flowers does more for city bees than adding more hives does. Pollen testing is described earlier as what produced the finding, not as advice.",
  },
];

export const ieltsBank: PracticeBank = {
  set: {
    id: "ielts-reading-12",
    examId: "ielts",
    name: "Academic Reading — two passages",
    blurb:
      "Twelve original questions on two passages, covering True/False/Not Given and detail questions. Untimed, with an explanation for every answer — including why a plausible statement is Not Given rather than False, which is the distinction this question type actually tests.",
    minutes: 20,
  },
  questions,
};
