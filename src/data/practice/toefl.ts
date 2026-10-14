import type { PracticeBank, Question } from "./types";

/**
 * TOEFL Reading practice — the third bank.
 *
 * IELTS Reading and TOEFL Reading look similar from a distance and are not: TOEFL
 * leans on vocabulary-in-context, "EXCEPT" questions that invert the usual task,
 * rhetorical-purpose questions ("why does the author mention…"), and sentence
 * simplification. So this bank deliberately uses those, which the SAT and IELTS
 * sets do not, and adds no new machinery to the runner to do it.
 *
 * Original academic-style writing on real subjects — horse domestication and the
 * consolidation of memory during sleep — written to the format, not taken from any
 * published test.
 */

const PASSAGE_HORSE = `The domestication of the horse, long placed around 3500 BCE on the basis of chariot burials found across the Eurasian steppe, was pushed back by more than a thousand years once archaeologists examined the teeth and bones of horses from the Botai settlements of northern Kazakhstan. Botai horses showed a pattern of tooth wear consistent with the use of a bit, and their leg bones carried the stress marks that sustained riding produces. A genetic study then complicated the picture: the Botai animals, it emerged, are not the ancestors of modern domestic horses at all. Their lineage was a separate one that has since vanished. The horses that pull carts and carry riders today descend instead from animals domesticated several thousand years later, in the Western Steppe. Domestication, in short, was not a single event that happened once and spread outward; it was attempted more than once, and the attempt that succeeded was not the earliest.`;

const PASSAGE_SLEEP = `For decades, the idea that sleep helps to fix new memories was little more than a plausible hunch. The evidence has since hardened. In a now-classic experiment, participants who learned a list of word pairs in the evening recalled more of them after a full night's sleep than participants who learned the same list in the morning and were tested after an equally long day spent awake. Brain imaging supplied a mechanism. The hippocampus, the structure that encodes recent experience, replays fragments of the day's events during slow-wave sleep, and these replays coincide with bursts of activity in the neocortex, where durable memories are stored. Sleep, on this account, is not a passive pause during which memory merely endures; it is an active process that moves information from one system to another. The finding has practical weight. Students who shorten their sleep in order to study longer may be trading away the very consolidation that would have made the studying stick.`;

const FOUR = (a: string, b: string, c: string, d: string) => [
  { id: "A", text: a },
  { id: "B", text: b },
  { id: "C", text: c },
  { id: "D", text: d },
];

const questions: Question[] = [
  /* ── Passage 1: the domestication of the horse ─────────────────────────── */
  {
    id: "toefl-r-01",
    examId: "toefl",
    section: "Reading",
    skill: "vocabulary in context",
    prompt: "The word \u201ccomplicated\u201d in the passage is closest in meaning to",
    context: PASSAGE_HORSE,
    choices: FOUR("simplified", "made harder to interpret", "confirmed", "reversed"),
    answer: "B",
    explanation:
      "Here \u201ccomplicated the picture\u201d means it made the story harder to interpret — the genetic finding clashed with the neat archaeological account. \u201cConfirmed\u201d (C) is the opposite of what the sentence does, and \u201creversed\u201d (D) is too strong: the finding did not overturn the evidence, it made the whole question messier.",
  },
  {
    id: "toefl-r-02",
    examId: "toefl",
    section: "Reading",
    skill: "factual detail",
    prompt: "According to the passage, which evidence suggested that the Botai people rode horses?",
    context: PASSAGE_HORSE,
    choices: FOUR(
      "Chariots found in their burials",
      "Tooth wear consistent with a bit and leg bones showing the stress of riding",
      "Written records from the Western Steppe",
      "Genetic material recovered from modern horses",
    ),
    answer: "B",
    explanation:
      "The passage names exactly those two kinds of evidence for the Botai animals. Chariot burials (A) are mentioned as the basis for the earlier date, not as evidence of Botai riding; the Western Steppe (C) is where the ancestors of modern horses were domesticated; and genetics (D) was what ruled the Botai horses out, not in.",
  },
  {
    id: "toefl-r-03",
    examId: "toefl",
    section: "Reading",
    skill: "negative factual (EXCEPT)",
    prompt: "According to the passage, all of the following are true EXCEPT:",
    context: PASSAGE_HORSE,
    choices: FOUR(
      "The Botai horses belonged to a lineage that no longer exists.",
      "Modern domestic horses descend from the Botai animals.",
      "Domestication was attempted more than once.",
      "The earliest successful domestication is not the oldest known attempt.",
    ),
    answer: "B",
    explanation:
      "The passage states the opposite — the Botai animals are not the ancestors of modern domestic horses. The other three are each stated outright, which is the trick of an EXCEPT question: the wrong answers are simply true.",
  },
  {
    id: "toefl-r-04",
    examId: "toefl",
    section: "Reading",
    skill: "inference",
    prompt: "What can be inferred about chariot burials from the passage?",
    context: PASSAGE_HORSE,
    choices: FOUR(
      "They provided the evidence on which the older date for domestication rested.",
      "They contained the remains of modern domestic horses.",
      "They were found at the Botai settlements.",
      "They proved that horses were ridden before they pulled vehicles.",
    ),
    answer: "A",
    explanation:
      "The passage says the earlier date (3500 BCE) rested \u201con the basis of chariot burials,\u201d so they supplied that evidence — and the later work pushed the date back. Nothing places chariot burials at Botai (C), and the passage never claims riding preceded driving (D).",
  },
  {
    id: "toefl-r-05",
    examId: "toefl",
    section: "Reading",
    skill: "rhetorical purpose",
    prompt: "Why does the author mention the Western Steppe?",
    context: PASSAGE_HORSE,
    choices: FOUR(
      "To explain why the Botai settlements were abandoned",
      "To identify where the ancestors of today's horses were domesticated",
      "To show that chariots were invented there",
      "To argue that the Botai evidence is unreliable",
    ),
    answer: "B",
    explanation:
      "The mention follows directly from the point that Botai horses were a dead end: it names the place whose horses do descend from today's. It is not a claim about chariot invention (C) or about the reliability of the Botai evidence (D), which the passage treats as sound.",
  },
  {
    id: "toefl-r-06",
    examId: "toefl",
    section: "Reading",
    skill: "sentence simplification",
    prompt:
      "Which of the following best expresses the essential information in the final sentence?\n\n\u201cDomestication, in short, was not a single event that happened once and spread outward; it was attempted more than once, and the attempt that succeeded was not the earliest.\u201d",
    context: PASSAGE_HORSE,
    choices: FOUR(
      "Domestication happened only once, and it happened later than was previously thought.",
      "There were several attempts at domestication, and the one that lasted was not the first.",
      "The earliest domestication attempt spread outward and succeeded.",
      "Because domestication was attempted only once, its origin is uncontested.",
    ),
    answer: "B",
    explanation:
      "The sentence denies a single event and states two things: multiple attempts, and success coming late rather than early. A and D contradict the denial; C gets the order backwards, making the earliest attempt the successful one.",
  },

  /* ── Passage 2: sleep and memory ───────────────────────────────────────── */
  {
    id: "toefl-r-07",
    examId: "toefl",
    section: "Reading",
    skill: "vocabulary in context",
    prompt: "The word \u201chardened\u201d in the passage is closest in meaning to",
    context: PASSAGE_SLEEP,
    choices: FOUR("become more difficult", "become more firmly established", "been abandoned", "remained unchanged"),
    answer: "B",
    explanation:
      "The sentence contrasts a former hunch with evidence that has since \u201chardened\u201d — that is, become more firmly established. \u201cBecome more difficult\u201d (A) is the unrelated common sense of the word, and \u201cremained unchanged\u201d (D) ignores the contrast the sentence is drawing.",
  },
  {
    id: "toefl-r-08",
    examId: "toefl",
    section: "Reading",
    skill: "factual detail",
    prompt: "In the experiment described, what did the two groups of participants do differently?",
    context: PASSAGE_SLEEP,
    choices: FOUR(
      "One group learned a list of word pairs, and the other did not.",
      "One group learned in the evening and the other in the morning.",
      "One group slept during the test and the other did not.",
      "One group was given images to study and the other words.",
    ),
    answer: "B",
    explanation:
      "Both groups learned the same kind of list; the variable was the time of day — evening learners slept before recall, morning learners stayed awake. So A and D misdescribe what was learned, and a group sleeping during the test (C) is not part of the design.",
  },
  {
    id: "toefl-r-09",
    examId: "toefl",
    section: "Reading",
    skill: "rhetorical purpose",
    prompt: "Why does the author mention the hippocampus and the neocortex?",
    context: PASSAGE_SLEEP,
    choices: FOUR(
      "To name the structures in which memory is stored permanently",
      "To propose a mechanism by which sleep consolidates memory",
      "To argue that brain imaging is unreliable",
      "To show that memories can be erased during sleep",
    ),
    answer: "B",
    explanation:
      "The imaging is introduced to \u201csupply a mechanism\u201d — replays in one structure coinciding with activity in the other, moving information between them. The hippocampus is described as encoding recent experience, not as permanent storage (A), and the passage uses the imaging as support, not as a target (C).",
  },
  {
    id: "toefl-r-10",
    examId: "toefl",
    section: "Reading",
    skill: "inference",
    prompt: "What does the passage suggest about students who cut their sleep to study more?",
    context: PASSAGE_SLEEP,
    choices: FOUR(
      "They learn more than students who sleep a full night.",
      "They may lose the memory consolidation that would have made their studying effective.",
      "They are unaffected because memory survives any amount of sleep loss.",
      "They remember more word pairs the following morning.",
    ),
    answer: "B",
    explanation:
      "The last sentence says they may be trading away the consolidation that would have made the studying stick. A and D contradict the whole finding, and C contradicts the passage's central claim that sleep is not a passive pause.",
  },
  {
    id: "toefl-r-11",
    examId: "toefl",
    section: "Reading",
    skill: "negative factual (EXCEPT)",
    prompt: "According to the passage, all of the following are true EXCEPT:",
    context: PASSAGE_SLEEP,
    choices: FOUR(
      "The link between sleep and memory was once only a hypothesis.",
      "Slow-wave sleep is when the day's events are replayed.",
      "Memory is stored in the hippocampus permanently.",
      "The finding has consequences for how students should study.",
    ),
    answer: "C",
    explanation:
      "The passage says the hippocampus encodes recent experience and that durable memories are stored in the neocortex — so it does not say permanent storage happens in the hippocampus. The other three are stated directly.",
  },
  {
    id: "toefl-r-12",
    examId: "toefl",
    section: "Reading",
    skill: "sentence simplification",
    prompt:
      "Which of the following best expresses the essential information in the sentence \u201cSleep, on this account, is not a passive pause during which memory merely endures; it is an active process that moves information from one system to another\u201d?",
    context: PASSAGE_SLEEP,
    choices: FOUR(
      "Sleep allows memory to endure passively, without any active transfer.",
      "During sleep, memory is actively transferred between brain systems rather than simply preserved.",
      "Sleep prevents information from moving between brain systems.",
      "Memory endures during sleep only after it has been moved between systems.",
    ),
    answer: "B",
    explanation:
      "The sentence rejects the passive view and asserts an active transfer — B states exactly that. A restates the view being rejected, and C and D both break the causal claim in opposite directions.",
  },
];

export const toeflBank: PracticeBank = {
  set: {
    id: "toefl-reading-12",
    examId: "toefl",
    name: "Reading — two academic passages",
    blurb:
      "Twelve original questions on two academic passages, using the question types TOEFL actually relies on: vocabulary in context, factual detail, EXCEPT questions, rhetorical purpose, inference and sentence simplification. Untimed, with an explanation for every answer — including why the true statements are the wrong answers to an EXCEPT question, which is the point of that type.",
    minutes: 20,
  },
  questions,
};
