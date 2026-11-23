// Event registry for the live quiz. A link with ?e=<id> runs that event's questions and keeps its
// answers under its own key prefix. A link with no event runs the original Find Your Zone quiz, unchanged.

import {
  QUESTIONS, publicQuestions, computeResult, hasScoredAnswers, firstJobFor, zoneFor, scoreAnswers, ZONES, FULL_QUIZ_URL,
} from "./quiz.mjs";
import { OYA01 } from "./oya01.mjs";

export const FYZ = {
  id: "",
  parts: false,
  questions: QUESTIONS,
  publicQuestions,
  computeResult,
  roomZones(people) {
    const zones = { below: 0, inside: 0, above: 0, oscillating: 0 };
    const jobs = {};
    let complete = 0, emails = 0;
    for (const p of people) {
      if (p.email) emails++;
      if (!hasScoredAnswers(p.answers)) continue;
      complete++;
      zones[zoneFor(scoreAnswers(p.answers))]++;
      const job = firstJobFor(p.answers);
      jobs[job] = (jobs[job] ?? 0) + 1;
    }
    return {
      joined: people.length, complete, emails, zones, jobs,
      names: Object.fromEntries(Object.entries(ZONES).map(([k, v]) => [k, v.zone])),
      modes: Object.fromEntries(Object.entries(ZONES).map(([k, v]) => [k, v.mode])),
    };
  },
  exportHeader() { return ["email", "consent", "zone", "mode", "first_job", ...QUESTIONS.map((q) => q.key)]; },
  exportRow(p) {
    const r = computeResult(p.answers);
    const answers = QUESTIONS.map((q, n) => (p.answers[n] !== undefined ? q.opts[p.answers[n]].t : ""));
    return [p.email, "yes", r ? r.zone : "incomplete", r ? r.mode : "", r ? r.firstJob : "", ...answers];
  },
  exportJson(p) {
    const r = computeResult(p.answers);
    return { email: p.email, zone: r ? r.zone : "incomplete", mode: r ? r.mode : "", firstJob: r ? r.firstJob : "" };
  },
};

export const EVENTS = { "oya-01": OYA01 };
export { FULL_QUIZ_URL };

// Returns the quiz for an event id, the default quiz for no id, or null for an unknown id.
export function quizFor(id) {
  if (!id) return FYZ;
  return Object.prototype.hasOwnProperty.call(EVENTS, id) ? EVENTS[id] : null;
}

// A store view that keeps one event's keys under its own prefix.
export function scoped(store, prefix) {
  return {
    get: (k, o) => store.get(prefix + k, o),
    set: (k, v) => store.set(prefix + k, v),
    setJSON: (k, v) => store.setJSON(prefix + k, v),
    delete: (k) => store.delete(prefix + k),
    async list({ prefix: p = "" } = {}) {
      const res = await store.list({ prefix: prefix + p });
      return { blobs: (res.blobs ?? []).map((b) => ({ ...b, key: b.key.slice(prefix.length) })) };
    },
  };
}
