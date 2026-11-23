// Own Your AI 2027, workshop 01: Front Desk and Admin AI.
// Find Your Zone per step of a job (STZ Pass 1). Each step has three questions:
//   part 0, STZ 1.1: Can you state the rule?            yes / partly / no
//   part 1, STZ 1.6: Routine, or judgment each time?    routine / judgment
//   part 2, STZ 1.5: Past your confident reach?         no / part of it / all of it
// Code sets the Zone in the Hub's order. Oscillating needs the 1.4 recheck in a later session,
// so it is never set here.

import { ZONES, BOOKING_URL } from "./quiz.mjs";

const PARTS = [
  { q: "Can you state the rule you follow for this step?", opts: ["Yes", "Partly", "No"] },
  { q: "Is this step routine, or does each case need your judgment?", opts: ["Routine, the same way every time", "Each case needs my judgment"] },
  { q: "Does any part of this step go past what you can call with confidence?", opts: ["No", "Part of it", "All of it"] },
];

const STEPS = [
  { key: "reply", name: "Reply to a new inquiry" },
  { key: "sort", name: "Sort inquiries by what the person needs" },
  { key: "follow", name: "Follow up when someone goes quiet" },
  { key: "enter", name: "Enter invoice details" },
  { key: "match", name: "Match an invoice to the order" },
  { key: "chase", name: "Chase unpaid invoices" },
];

// All of it past reach: Above. Routine with a stated rule: Below. Anything else: Inside.
export function stepZone(parts) {
  if (!Array.isArray(parts) || [0, 1, 2].some((i) => parts[i] === undefined || parts[i] === null)) return null;
  if (parts[2] === 2) return "above";
  if (parts[1] === 0 && parts[0] === 0) return "below";
  return "inside";
}

const EMPTY = () => ({ below: 0, inside: 0, above: 0, oscillating: 0 });

function stepsFor(answers) {
  return STEPS.map((s, n) => {
    const k = stepZone(answers[n]);
    return { name: s.name, zoneKey: k, zone: k ? ZONES[k].zone : "", mode: k ? ZONES[k].mode : "" };
  });
}

function summary(steps) {
  const mix = EMPTY();
  for (const s of steps) if (s.zoneKey) mix[s.zoneKey]++;
  return mix;
}

export const OYA01 = {
  id: "oya-01",
  title: "Front Desk and Admin AI",
  parts: true,
  questions: STEPS.map((s) => ({ key: s.key, name: s.name, parts: PARTS })),
  publicQuestions() {
    return STEPS.map((s, n) => ({ key: s.key, label: `Step ${n + 1} of ${STEPS.length}`, q: s.name, parts: PARTS.map((p) => ({ q: p.q, opts: p.opts.slice() })) }));
  },
  computeResult(answers) {
    const steps = stepsFor(answers);
    if (!steps.some((s) => s.zoneKey)) return null;
    const firstBelow = steps.find((s) => s.zoneKey === "below");
    return { steps, mix: summary(steps), firstJob: firstBelow ? firstBelow.name : "", bookingUrl: BOOKING_URL };
  },
  roomZones(people) {
    const steps = STEPS.map((s) => ({ name: s.name, zones: EMPTY() }));
    let complete = 0, emails = 0;
    for (const p of people) {
      if (p.email) emails++;
      let any = false;
      STEPS.forEach((_, n) => { const k = stepZone(p.answers[n]); if (k) { steps[n].zones[k]++; any = true; } });
      if (any) complete++;
    }
    return { joined: people.length, complete, emails, steps };
  },
  exportHeader() { return ["email", "consent", ...STEPS.map((s) => s.key)]; },
  exportRow(p) { return [p.email, "yes", ...stepsFor(p.answers).map((s) => (s.zoneKey ? s.zone : ""))]; },
  exportJson(p) {
    const r = this.computeResult(p.answers);
    const mix = r ? r.mix : EMPTY();
    return { email: p.email, zone: r ? `Below ${mix.below}, Inside ${mix.inside}, Above ${mix.above}` : "incomplete", mode: "", firstJob: r ? r.firstJob : "" };
  },
};
