// Find Your Zone quiz: questions, scoring and result copy.
// Mirrors the public quiz at drdatadecisionintelligence.com/find-your-zone/.
// Score flags per option: i = inside points, b = below points, a = above points.

export const QUESTIONS = [
  {
    key: "prep", part: 1, label: "How your work gets done",
    q: "Think about getting ready for an important client meeting, estimate, or session. How does it happen right now?",
    opts: [
      { t: "AI prepares everything automatically: I just open it", i: 2 },
      { t: "I use AI to help but I still do most of the work manually", b: 1 },
      { t: "I do it manually from scratch every time", b: 2 },
      { t: "I usually wing it or skip preparation entirely", b: 3 },
    ],
  },
  {
    key: "follow-up", part: 1, label: "How your work gets done",
    q: "When you follow up after a meeting, how long does a good follow-up email take you?",
    opts: [
      { t: "Under 5 minutes: I have a system that handles most of it", i: 2 },
      { t: "10 to 20 minutes: I have a rough process", b: 1 },
      { t: "30 to 45 minutes: I write every one from scratch", b: 2 },
      { t: "Longer than that: or I often forget to send one at all", b: 3 },
    ],
  },
  {
    key: "proposal", part: 1, label: "How your work gets done",
    q: "When someone asks for your services, how long does it take to send the proposal or quote?",
    opts: [
      { t: "Same day: my system drafts it and I review and send", i: 2 },
      { t: "Next day: I have a template I customize", b: 1 },
      { t: "2 to 5 days: I write it from scratch each time", b: 2 },
      { t: "Longer than that: or I put it off and lose the momentum", b: 3 },
    ],
  },
  {
    key: "content", part: 1, label: "How your work gets done",
    q: "How do you create content today, like LinkedIn posts, blog articles, or newsletters?",
    opts: [
      { t: "Consistently: AI drafts in my voice and I refine", i: 2 },
      { t: "Occasionally: when I have time to sit down and write", b: 1 },
      { t: "Rarely: I know I should but it takes too long", b: 2 },
      { t: "Almost never: I do not have a process for this at all", b: 3 },
    ],
  },
  {
    key: "voice", part: 1, label: "How your work gets done",
    q: "When AI does a job for you, does the result sound like you: your reasoning, your voice, your standard?",
    opts: [
      { t: "Yes: I have built prompts that capture how I think", i: 2 },
      { t: "Sometimes: when I put real effort into the request", b: 1 },
      { t: "Rarely: it usually sounds like generic AI", b: 2 },
      { t: "I have never thought to make it sound like me", b: 3 },
    ],
  },
  {
    key: "check", part: 1, label: "How your work gets done",
    q: "When AI produces something for you, how often do you check whether it did the job right?",
    opts: [
      { t: "Always: I interrogate every output before acting on it", i: 1 },
      { t: "Most of the time: I skim it then usually accept", a: 1 },
      { t: "Sometimes: only if something looks obviously off", a: 1 },
      { t: "Rarely: if it looks plausible I move on", a: 3 },
    ],
  },
  {
    key: "boundary", part: 1, label: "How your work gets done",
    q: "Is there a clear line between what AI handles and what only you decide?",
    opts: [
      { t: "Yes: I have drawn that line and AI respects it", i: 2 },
      { t: "Roughly: I have a sense of it but it is not defined", b: 1 },
      { t: "Not really: it depends on how I feel that day", a: 1 },
      { t: "I have not thought about where that line should be", b: 2 },
    ],
  },
  {
    key: "size", part: 2, label: "Five quick questions to tailor your result",
    q: "How many people work in your business?",
    opts: [{ t: "1 to 4" }, { t: "5 to 9" }, { t: "10 to 35" }, { t: "36 to 50" }, { t: "More than 50" }],
  },
  {
    key: "role", part: 2, label: "Five quick questions to tailor your result",
    q: "What is your role?",
    opts: [{ t: "Owner or principal" }, { t: "Manager" }, { t: "Team member" }],
  },
  {
    key: "industry", part: 2, label: "Five quick questions to tailor your result",
    q: "Which best describes your work?",
    opts: [
      { t: "Trades and construction" }, { t: "Legal" }, { t: "Accounting and finance" },
      { t: "Health and wellness practice" }, { t: "Real estate" }, { t: "Coaching and consulting" }, { t: "Other" },
    ],
  },
  {
    key: "decision", part: 2, label: "Five quick questions to tailor your result",
    q: "Which decision costs you the most when it goes wrong?",
    opts: [
      { t: "Pricing and quotes" }, { t: "Which leads to follow up" }, { t: "Scheduling and capacity" },
      { t: "Client intake" }, { t: "Something else" },
    ],
  },
  {
    key: "info", part: 2, label: "Five quick questions to tailor your result",
    q: "What kind of information does your business hold?",
    opts: [{ t: "Client or patient records" }, { t: "Pricing and proprietary methods" }, { t: "General business records" }],
  },
];

export const JOB_KEYS = ["prep", "follow-up", "proposal", "content"];
export const JOB_NAMES = {
  prep: "Meeting preparation",
  "follow-up": "Follow-up emails",
  proposal: "Proposals and quotes",
  content: "Content",
};
export const JOB_FALLBACK = "Consistency across all four jobs";

export const ZONES = {
  below: {
    zone: "BELOW THE ZONE",
    head: "Your expertise is spending time on execution.",
    body: "A lot of your week goes to work a well-built system can prepare for you: getting ready for meetings, writing follow-ups, turning around proposals, keeping up with content. Each of these can run on your rules and in your voice. Start with one job.",
  },
  above: {
    zone: "ABOVE THE ZONE",
    head: "You are using AI. Now teach it how you think.",
    body: "AI is already doing work for you, running on generic instructions. The output goes out without your judgment and your voice, and over time that costs trust. The next step is capturing how you decide, so the system works the way you would.",
  },
  inside: {
    zone: "INSIDE THE ZONE",
    head: "You have the right instinct. Now make it consistent.",
    body: "You know where AI helps and where your judgment decides. The next step is making that line hold across every core job, even in your busiest weeks.",
  },
};

export const BOOKING_URL = "https://calendar.app.google/fMyQVRXz3Q2C4yxcA";
export const FULL_QUIZ_URL = "https://drdatadecisionintelligence.com/find-your-zone/";
export const SCORED_QUESTIONS = 7; // Q1 to Q7 carry the score

export function publicQuestions() {
  return QUESTIONS.map((q) => ({ key: q.key, part: q.part, label: q.label, q: q.q, opts: q.opts.map((o) => o.t) }));
}

export function scoreAnswers(answers) {
  let b = 0, a = 0, i = 0;
  for (let n = 0; n < SCORED_QUESTIONS; n++) {
    const opt = QUESTIONS[n].opts[answers[n]];
    if (!opt) continue;
    b += opt.b ?? 0;
    a += opt.a ?? 0;
    i += opt.i ?? 0;
  }
  return { b, a, i };
}

export function zoneFor(t) {
  if (t.a >= 3) return "above";
  if (t.b <= 4 && t.i >= 4) return "inside";
  return "below";
}

export function firstJobFor(answers) {
  let best = null, bestScore = 0;
  for (let n = 0; n < JOB_KEYS.length; n++) {
    const s = QUESTIONS[n].opts[answers[n]]?.b ?? 0;
    if (s > bestScore) { bestScore = s; best = JOB_KEYS[n]; }
  }
  return best ? JOB_NAMES[best] : JOB_FALLBACK;
}

export function hasScoredAnswers(answers) {
  for (let n = 0; n < SCORED_QUESTIONS; n++) if (answers[n] === undefined) return false;
  return true;
}

export function computeResult(answers) {
  if (!hasScoredAnswers(answers)) return null;
  const totals = scoreAnswers(answers);
  const key = zoneFor(totals);
  return { zoneKey: key, ...ZONES[key], firstJob: firstJobFor(answers), bookingUrl: BOOKING_URL };
}
