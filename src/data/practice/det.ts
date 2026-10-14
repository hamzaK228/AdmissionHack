import type { PracticeBank, Question } from "./types";

/**
 * Duolingo English Test (DET) practice — the fourth bank, and the last of the
 * language exams the plan calls for.
 *
 * DET is not a shorter IELTS: it is adaptive, it leans on recognising and
 * completing language rather than essay-style passage analysis, and its reading
 * tasks mix word-level discrimination with ordinary comprehension. So this bank
 * leads with the word-level types the other three banks do not use at all —
 * "which of these is a real English word", and fill-the-blank in a sentence
 * where grammar and meaning both have to be satisfied — before one ordinary
 * passage at the end.
 *
 * Original writing, written to the format. Nothing here is taken from any
 * published test.
 */

const PASSAGE_NIGHT_TRAINS = `Overnight trains, which much of Europe abandoned in the early 2000s in favour of cheap short-haul flights, are returning to the timetable. The reasons are partly environmental: a night train between two cities can replace a flight whose emissions for each passenger are far higher. They are partly economic as well. A sleeper carriage uses a night of track that was already paid for, and it doubles as accommodation, which matters in cities where hotel rooms are scarce and expensive. The revival is not straightforward. A sleeper carriage carries far fewer passengers than a seated one, so the same crew and track costs are spread across fewer tickets — which is precisely why the services were dropped in the first place. Several new routes are therefore subsidised, at least at the beginning, by the states they pass through. Whether that support outlasts the enthusiasm is the open question.`;

const FOUR = (a: string, b: string, c: string, d: string) => [
  { id: "A", text: a },
  { id: "B", text: b },
  { id: "C", text: c },
  { id: "D", text: d },
];

const questions: Question[] = [
  /* ── word level: does it exist, and is it spelled right? ───────────────── */
  {
    id: "det-r-01",
    examId: "det",
    section: "Reading",
    skill: "real word",
    prompt: "Which of the following is a correctly spelled English word?",
    choices: FOUR("recieve", "receive", "receeve", "receve"),
    answer: "B",
    explanation:
      "“Receive” follows the -ei- rule after c. The others are the misspellings that rule exists to prevent — and note that A, “recieve”, is the one most people actually write.",
  },
  {
    id: "det-r-02",
    examId: "det",
    section: "Reading",
    skill: "real word",
    prompt: "Which of the following is a correctly spelled English word?",
    choices: FOUR("occurred", "occured", "ocurred", "occurrd"),
    answer: "A",
    explanation:
      "Double the r before -ed: occurred. B and C drop one of the doubled letters, and D is not a word at all — the pattern to notice is that the other three all look plausible on a hurried read.",
  },
  {
    id: "det-r-03",
    examId: "det",
    section: "Reading",
    skill: "real word",
    prompt: "Which of the following is a real English word?",
    choices: FOUR("grumptious", "flamboyant", "serendipitious", "magnifiscent"),
    answer: "B",
    explanation:
      "“Flamboyant” is a real word meaning showy. The other three are invented: C and D are near-misses built from real words (“serendipity”, “magnificent”) by changing the ending, which is exactly how pseudo-words are made.",
  },

  /* ── complete the sentence: grammar and meaning together ───────────────── */
  {
    id: "det-r-04",
    examId: "det",
    section: "Reading",
    skill: "complete the sentence",
    prompt: "Choose the word that best completes the sentence.\n\nThe findings were ____; the second experiment produced exactly the opposite result.",
    choices: FOUR("consistent", "contradictory", "negligible", "redundant"),
    answer: "B",
    explanation:
      "The semicolon makes the second half an explanation of the first, and “the opposite result” is what makes the findings contradictory. “Consistent” (A) is the word the second half rules out; “negligible” (C) is about size, not conflict.",
  },
  {
    id: "det-r-05",
    examId: "det",
    section: "Reading",
    skill: "complete the sentence",
    prompt: "Choose the word that best completes the sentence.\n\nThe report was criticised for being too ____, offering no concrete recommendations.",
    choices: FOUR("vague", "punctual", "edible", "sunny"),
    answer: "A",
    explanation:
      "“Offering no concrete recommendations” defines the fault: the report is vague. The other three are grammatically fine and semantically absurd — which is the point of the question. A blank that any adjective can fill is testing whether you read the clause after it.",
  },
  {
    id: "det-r-06",
    examId: "det",
    section: "Reading",
    skill: "complete the sentence",
    prompt: "Choose the word that best completes the sentence.\n\nShe spoke with such ____ that even her critics were persuaded.",
    choices: FOUR("conviction", "convict", "convicted", "convicting"),
    answer: "A",
    explanation:
      "“Such a + noun” requires a noun, and only “conviction” is one. B, C and D are the verb in other forms — the trap is that all four share a root, so the question is about word class, not vocabulary.",
  },
  {
    id: "det-r-07",
    examId: "det",
    section: "Reading",
    skill: "complete the sentence",
    prompt: "Choose the word that best completes the sentence.\n\nDespite the ____ evidence, the jury reached a verdict in under an hour.",
    choices: FOUR("overwhelming", "overwhelmed", "overwhelm", "overwhelms"),
    answer: "A",
    explanation:
      "“The ____ evidence” needs an adjective, and only “overwhelming” is one. Note “despite” does not signal anything about the evidence itself — it contrasts the evidence with the speed, not with its strength.",
  },

  /* ── one ordinary passage, to finish ───────────────────────────────────── */
  {
    id: "det-r-08",
    examId: "det",
    section: "Reading",
    skill: "main idea",
    prompt: "What is the passage mainly about?",
    context: PASSAGE_NIGHT_TRAINS,
    choices: FOUR(
      "Why overnight trains are coming back, and what makes their future uncertain",
      "Why flights are more harmful to the environment than trains",
      "How to book a sleeper carriage in Europe",
      "Why hotels in European cities are expensive",
    ),
    answer: "A",
    explanation:
      "The passage gives the reasons for the return and then names the open question — whether the subsidy lasts. B is one supporting detail, and C and D are never discussed at all; a main-idea answer that is only half the passage is the usual wrong choice.",
  },
  {
    id: "det-r-09",
    examId: "det",
    section: "Reading",
    skill: "detail",
    prompt: "According to the passage, why were overnight services dropped in the first place?",
    context: PASSAGE_NIGHT_TRAINS,
    choices: FOUR(
      "Passengers preferred to travel during the day.",
      "A sleeper carriage carries fewer passengers, so fixed costs spread across fewer tickets.",
      "The track was not maintained well enough to run them.",
      "Governments refused to allow them.",
    ),
    answer: "B",
    explanation:
      "The passage states it directly and ties it to the revival: the same crew and track costs over fewer tickets. A sounds reasonable but is never claimed; D is the opposite of the subsidy the passage does describe.",
  },
  {
    id: "det-r-10",
    examId: "det",
    section: "Reading",
    skill: "vocabulary in context",
    prompt: "In the passage, “revival” is closest in meaning to",
    context: PASSAGE_NIGHT_TRAINS,
    choices: FOUR("a return to use", "a repair", "a reduction", "an investigation"),
    answer: "A",
    explanation:
      "The sentence before it says the trains are returning to the timetable, so “revival” here means coming back into use. “A repair” (B) borrows the sense of fixing something, which the passage never discusses.",
  },
  {
    id: "det-r-11",
    examId: "det",
    section: "Reading",
    skill: "detail",
    prompt: "What makes a sleeper carriage economically awkward?",
    context: PASSAGE_NIGHT_TRAINS,
    choices: FOUR(
      "It is slower than a seated carriage.",
      "It uses more fuel than a seated carriage.",
      "It carries far fewer passengers than a seated one.",
      "It cannot run on ordinary track.",
    ),
    answer: "C",
    explanation:
      "The passage names capacity and the spreading of costs. Speed (A) and fuel (B) are never mentioned, and D is contradicted by “a night of track that was already paid for”.",
  },
  {
    id: "det-r-12",
    examId: "det",
    section: "Reading",
    skill: "inference",
    prompt: "What can be inferred about the new routes from the last two sentences?",
    context: PASSAGE_NIGHT_TRAINS,
    choices: FOUR(
      "They are already profitable.",
      "They depend on state support that may not continue.",
      "They will certainly close within a year.",
      "They are funded entirely by the cities they serve.",
    ),
    answer: "B",
    explanation:
      "The routes are subsidised by the states they pass through, and the closing question is whether that support outlasts the enthusiasm — which is precisely the uncertainty B names. A contradicts the subsidy; C is stronger than “the open question”; D changes who pays.",
  },
];

export const detBank: PracticeBank = {
  set: {
    id: "det-reading-12",
    examId: "det",
    name: "Reading — words, sentences and a passage",
    blurb:
      "Twelve original questions in the DET's own spirit: recognising real and correctly spelled words, completing sentences where grammar and meaning must both fit, and one ordinary comprehension passage. Untimed, with an explanation for every answer — including why the plausible-looking non-word is not a word.",
    minutes: 15,
  },
  questions,
};
