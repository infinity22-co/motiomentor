export type LearningMethod = "picture" | "reading" | "listening" | "practice";

export const METHODS: Record<LearningMethod, { label: string; short: string; blurb: string }> = {
  picture: { label: "Picture-based", short: "See it", blurb: "Concept sheets, diagrams and graphs." },
  reading: { label: "Reading & notes", short: "Read it", blurb: "Clear written notes and summaries." },
  listening: { label: "Listening", short: "Hear it", blurb: "Your tutor speaks every explanation aloud." },
  practice: { label: "Step-by-step practice", short: "Do it", blurb: "Solve problems one step at a time." },
};

export function isMethod(v: unknown): v is LearningMethod {
  return typeof v === "string" && v in METHODS;
}

/** Learning-style questions: each option maps to one method. */
export const STYLE_QUESTIONS: { q: string; options: { text: string; method: LearningMethod }[] }[] = [
  {
    q: "You need to learn a new route to school. You would rather…",
    options: [
      { text: "Look at a map", method: "picture" },
      { text: "Read written directions", method: "reading" },
      { text: "Have someone tell you the way", method: "listening" },
      { text: "Just walk it once and figure it out", method: "practice" },
    ],
  },
  {
    q: "Before an exam, what helps you most?",
    options: [
      { text: "Mind-maps and colourful charts", method: "picture" },
      { text: "Re-reading my notes", method: "reading" },
      { text: "Explaining aloud or listening to a recording", method: "listening" },
      { text: "Solving lots of sample questions", method: "practice" },
    ],
  },
  {
    q: "A new game arrives. You…",
    options: [
      { text: "Watch the tutorial pictures/video", method: "picture" },
      { text: "Read the rule book", method: "reading" },
      { text: "Ask a friend to explain it", method: "listening" },
      { text: "Start playing right away", method: "practice" },
    ],
  },
  {
    q: "In class, you remember best when the teacher…",
    options: [
      { text: "Draws diagrams on the board", method: "picture" },
      { text: "Gives handouts to read", method: "reading" },
      { text: "Tells a story or explains out loud", method: "listening" },
      { text: "Lets us do an activity", method: "practice" },
    ],
  },
  {
    q: "When you are stuck on a maths problem, you…",
    options: [
      { text: "Sketch a figure", method: "picture" },
      { text: "Read the textbook example again", method: "reading" },
      { text: "Talk it through with someone", method: "listening" },
      { text: "Try different steps until one works", method: "practice" },
    ],
  },
];

/** Basic reasoning questions on Motion — a quick check of current understanding. */
export const CONCEPT_QUESTIONS: { q: string; options: string[]; answer: number }[] = [
  {
    q: "A runner goes 100 m and comes back to the start. Displacement is…",
    options: ["200 m", "100 m", "0 m", "50 m"],
    answer: 2,
  },
  { q: "A car covers 120 km in 2 hours. Its average speed is…", options: ["240 km/h", "60 km/h", "122 km/h", "30 km/h"], answer: 1 },
  {
    q: "Which quantity has both magnitude and direction?",
    options: ["Speed", "Distance", "Time", "Velocity"],
    answer: 3,
  },
  {
    q: "A bus speeds up from 0 to 10 m/s in 5 s. Acceleration is…",
    options: ["2 m/s²", "50 m/s²", "5 m/s²", "0.5 m/s²"],
    answer: 0,
  },
  {
    q: "On a distance–time graph, a horizontal line means the object is…",
    options: ["Speeding up", "At rest", "Moving at constant speed", "Slowing down"],
    answer: 1,
  },
];

export type QuizResult = {
  styleScores: Record<LearningMethod, number>;
  conceptScore: number;
  conceptTotal: number;
  recommended: LearningMethod;
};

const ORDER: LearningMethod[] = ["picture", "reading", "listening", "practice"];

/**
 * Score the exam. The method with the most style votes wins; ties are broken by
 * the concept score: students who score under half get picture-based learning
 * if tied (visual support helps beginners), otherwise the earliest-listed method.
 */
export function scoreQuiz(styleAnswers: LearningMethod[], conceptAnswers: number[]): QuizResult {
  const styleScores: Record<LearningMethod, number> = { picture: 0, reading: 0, listening: 0, practice: 0 };
  styleAnswers.forEach((m) => (styleScores[m] += 1));
  const conceptScore = conceptAnswers.filter((a, i) => CONCEPT_QUESTIONS[i]?.answer === a).length;
  const max = Math.max(...ORDER.map((m) => styleScores[m]));
  const tied = ORDER.filter((m) => styleScores[m] === max);
  let recommended = tied[0];
  if (tied.length > 1 && conceptScore < CONCEPT_QUESTIONS.length / 2 && tied.includes("picture")) recommended = "picture";
  return { styleScores, conceptScore, conceptTotal: CONCEPT_QUESTIONS.length, recommended };
}

export const TOPICS = [
  "What is motion? Rest vs motion",
  "Distance and displacement",
  "Speed and velocity",
  "Acceleration",
  "Equations of motion",
  "Distance–time & velocity–time graphs",
  "Uniform circular motion",
];
