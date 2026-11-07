// Find Your Zone quiz: questions, scoring and result copy.
// Mirrors the public quiz at drdatadecisionintelligence.com/find-your-zone/.
// Four Zones and their modes: Below/Encode, Inside/Assist, Above/Research, Oscillating/Learn.

// Answer order is rotated by question number, the same as the public quiz,
// so the Inside answer is not always first. Each scored answer carries one zone tag.
export const QUESTIONS = [
  {
    key: "prep", part: 1, label: "How you work with AI",
    q: "Think about routine preparation: a meeting, a review, an estimate. How does it get done?",
    opts: [{ t: "AI prepares it from my own checklist. I review and go.", z: "inside" }, { t: "I do it by hand, and I could write down the exact steps.", z: "below" }, { t: "I ask AI to do it. I could not list the steps myself.", z: "above" }, { t: "I am still learning it. I do some myself and compare with what AI gives me.", z: "oscillating" }],
  },
  {
    key: "messages", part: 1, label: "How you work with AI",
    q: "How do you write routine messages and follow-ups?",
    opts: [{ t: "I write each one from scratch, even though I follow the same pattern every time.", z: "below" }, { t: "AI writes them and I mostly send what it gives me.", z: "above" }, { t: "I use AI drafts to learn what works, and I am building my own templates.", z: "oscillating" }, { t: "AI drafts them from my templates and rules. I approve and send.", z: "inside" }],
  },
  {
    key: "reports", part: 1, label: "How you work with AI",
    q: "How do you produce reports, proposals, or quotes?",
    opts: [{ t: "I depend on AI for the parts I do not know how to do.", z: "above" }, { t: "I own some parts now. Others I still hand to AI while I learn.", z: "oscillating" }, { t: "My system drafts them with my rules. I review the judgment calls.", z: "inside" }, { t: "I build each one by hand from a format I know well.", z: "below" }],
  },
  {
    key: "rules", part: 1, label: "How you work with AI",
    q: "Could you write down the rules you follow for your routine work?",
    opts: [{ t: "For some tasks yes. For others I am still working them out.", z: "oscillating" }, { t: "Yes, and AI already follows them.", z: "inside" }, { t: "Yes, but I still apply them by hand.", z: "below" }, { t: "Not really. AI fills in what I do not know.", z: "above" }],
  },
  {
    key: "standard", part: 1, label: "How you work with AI",
    q: "Does AI output meet your standard?",
    opts: [{ t: "Yes. It uses my voice, my reasoning, and my standard.", z: "inside" }, { t: "I barely use AI. I do the work myself to keep my standard.", z: "below" }, { t: "I cannot always tell whether it is right.", z: "above" }, { t: "More and more, as I learn what good looks like.", z: "oscillating" }],
  },
  {
    key: "check", part: 1, label: "How you work with AI",
    q: "When AI gives you an answer, how do you check it?",
    opts: [{ t: "I rarely need to. I do the work myself.", z: "below" }, { t: "If it looks plausible, I use it.", z: "above" }, { t: "Carefully, because I am still learning the topic.", z: "oscillating" }, { t: "Against a standard I know, every time.", z: "inside" }],
  },
  {
    key: "line", part: 1, label: "How you work with AI",
    q: "Where is the line between what AI handles and what you decide?",
    opts: [{ t: "AI often makes calls I am not qualified to check.", z: "above" }, { t: "The line keeps moving as I learn more.", z: "oscillating" }, { t: "Clear. AI handles the routine. I make the judgment calls.", z: "inside" }, { t: "AI does very little. I do every step and make every call.", z: "below" }],
  },
  {
    key: "research", part: 1, label: "How you work with AI",
    q: "When you need to work outside your expertise, how do you use AI?",
    opts: [{ t: "I use it to learn the topic, and I am starting to make calls on my own.", z: "oscillating" }, { t: "For cited research. Then I decide.", z: "inside" }, { t: "I rarely leave my expertise. Most of my work is routine.", z: "below" }, { t: "AI is my main source and I act on its answers.", z: "above" }],
  },
  {
    key: "work", part: 2, label: "Four quick questions about your work",
    q: "What kind of work do you do?",
    opts: [{ t: "Trades and field operations" }, { t: "Legal" }, { t: "Accounting and finance" }, { t: "Health and wellness" }, { t: "Real estate" }, { t: "Coaching and consulting" }, { t: "Education and training" }, { t: "Other" }],
  },
  {
    key: "team", part: 2, label: "Four quick questions about your work",
    q: "How many people on your team use AI or will soon?",
    opts: [{ t: "Just me" }, { t: "2 to 9" }, { t: "10 to 50" }, { t: "More than 50" }],
  },
  {
    key: "systems", part: 2, label: "Four quick questions about your work",
    q: "How many systems hold the information you work with?",
    opts: [{ t: "1 to 2" }, { t: "3 to 6" }, { t: "7 or more" }],
  },
  {
    key: "info", part: 2, label: "Four quick questions about your work",
    q: "What kind of information do you handle?",
    opts: [{ t: "Client or patient records" }, { t: "Pricing and proprietary methods" }, { t: "General business records" }],
  },
];

export const ZONE_ORDER = ["below", "inside", "above", "oscillating"];
// Ties go to the riskier zone first: Above, Oscillating, Below, Inside.
export const TIE_ORDER = ["above", "oscillating", "below", "inside"];

export const JOB_KEYS = ["prep", "messages", "reports"];
export const JOB_NAMES = {
  prep: "Preparation",
  messages: "Messages and follow-ups",
  reports: "Reports, proposals, and quotes",
};
export const JOB_FALLBACK = "Your most repeated task";

export const ZONES = {
  below: {
    zone: "BELOW THE ZONE",
    mode: "Encode",
    head: "Your expertise is spending time on execution.",
    body: "You know the rules for much of your work, and you still apply them by hand. That work can run on your rules, in your voice, with your approval where it matters.",
    ai: "Run your stated rules. Draft. Wait for your approval on anything that matters.",
    step: "Write down the rules for one job: {job}. That list is what gets automated.",
  },
  inside: {
    zone: "INSIDE THE ZONE",
    mode: "Assist",
    head: "You and AI work in harmony.",
    body: "The routine is handled. Your judgment is protected. You know where AI helps and where you decide.",
    ai: "Gather inputs, draft, and show you similar past cases. You make the call.",
    step: "Keep the line holding across every job, even in your busiest weeks. Check the one job where it slips.",
  },
  above: {
    zone: "ABOVE THE ZONE",
    mode: "Research",
    head: "You are relying on AI for knowledge you do not have yet.",
    body: "That is a fair use of AI, as long as you can see its sources and its uncertainty. The risk is acting on answers you cannot check.",
    ai: "Bring cited sources. State what it does not know. Flag when a specialist is needed.",
    step: "Pick the one topic you rely on AI for most. Ask for sources every time, and decide yourself.",
  },
  oscillating: {
    zone: "OSCILLATING",
    mode: "Learn",
    head: "You are growing into the work.",
    body: "Some days you decide. Some days you lean on AI. That is what learning looks like. The goal is for your choices to hold steady.",
    ai: "Show its reasoning, the rule, and worked examples. Ask you to decide and say why.",
    step: "Choose one task you are learning. Make the call first, then compare with AI. Track where you agree.",
  },
};

export const BOOKING_URL = "https://calendar.app.google/fMyQVRXz3Q2C4yxcA";
export const FULL_QUIZ_URL = "https://drdatadecisionintelligence.com/find-your-zone/";
export const SCORED_QUESTIONS = 8; // Q1 to Q8 carry the score

export function publicQuestions() {
  return QUESTIONS.map((q) => ({ key: q.key, part: q.part, label: q.label, q: q.q, opts: q.opts.map((o) => o.t) }));
}

// Counts the scored answers by zone.
export function scoreAnswers(answers) {
  const counts = { below: 0, inside: 0, above: 0, oscillating: 0 };
  for (let n = 0; n < SCORED_QUESTIONS; n++) {
    const opt = QUESTIONS[n].opts[answers[n]];
    if (opt && opt.z) counts[opt.z]++;
  }
  return counts;
}

// The zone with the most answers wins. Ties go to the riskier zone.
export function zoneFor(counts) {
  let best = TIE_ORDER[0];
  for (const z of TIE_ORDER) if (counts[z] > counts[best]) best = z;
  return best;
}

// The first of the three job questions answered Below.
export function firstJobFor(answers) {
  for (let n = 0; n < JOB_KEYS.length; n++) {
    if (QUESTIONS[n].opts[answers[n]]?.z === "below") return JOB_NAMES[JOB_KEYS[n]];
  }
  return JOB_FALLBACK;
}

export function hasScoredAnswers(answers) {
  for (let n = 0; n < SCORED_QUESTIONS; n++) if (answers[n] === undefined) return false;
  return true;
}

export function computeResult(answers) {
  if (!hasScoredAnswers(answers)) return null;
  const mix = scoreAnswers(answers);
  const key = zoneFor(mix);
  const firstJob = firstJobFor(answers);
  const z = ZONES[key];
  return { zoneKey: key, zone: z.zone, mode: z.mode, head: z.head, body: z.body, ai: z.ai, step: z.step.replace("{job}", firstJob), firstJob, mix, bookingUrl: BOOKING_URL };
}
