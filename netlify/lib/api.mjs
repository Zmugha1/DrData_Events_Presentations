// Live Find Your Zone quiz API. Storage is injected so the same code runs on
// Netlify Blobs in production and an in-memory store in tests.

import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import {
  QUESTIONS, publicQuestions, computeResult, hasScoredAnswers, firstJobFor, zoneFor, scoreAnswers,
  ZONES, FULL_QUIZ_URL, SCORED_QUESTIONS,
} from "./quiz.mjs";

export const LAST_QUESTION = QUESTIONS.length - 1; // 11
export const RESULTS_STEP = QUESTIONS.length; // 12
const MAX_PARTICIPANTS = 500;
const MAX_BODY = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function readBody(req) {
  const text = await req.text();
  if (text.length > MAX_BODY) throw Object.assign(new Error("Body too large"), { status: 413 });
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw Object.assign(new Error("Invalid JSON"), { status: 400 }); }
}

function sha(s) { return createHash("sha256").update(String(s)).digest(); }
function keyMatches(given, expected) {
  if (!expected || !given) return false;
  return timingSafeEqual(sha(given), sha(expected));
}

async function getState(store) {
  let st = await store.get("state", { type: "json" });
  if (!st) {
    st = { sid: randomUUID().slice(0, 8), step: -1, updatedAt: Date.now() };
    await store.setJSON("state", st);
  }
  return st;
}

async function listKeys(store, prefix) {
  const out = [];
  const res = await store.list({ prefix });
  for (const b of res.blobs ?? []) out.push(b.key);
  return out;
}

async function countsFor(store, sid, q) {
  const n = QUESTIONS[q].opts.length;
  const counts = new Array(n).fill(0);
  const keys = await listKeys(store, `cnt/${sid}/q${q}/`);
  for (const k of keys) {
    const m = /\/(\d+)-[^/]+$/.exec(k);
    if (m && Number(m[1]) < n) counts[Number(m[1])]++;
  }
  return counts;
}

async function publicState(store) {
  const st = await getState(store);
  const joined = (await listKeys(store, `usr/${st.sid}/`)).length;
  const out = { sid: st.sid, step: st.step, joined, resultsStep: RESULTS_STEP, total: QUESTIONS.length };
  if (st.step >= 0 && st.step <= LAST_QUESTION) {
    const counts = await countsFor(store, st.sid, st.step);
    out.counts = counts;
    out.answered = counts.reduce((a, b) => a + b, 0);
  }
  return out;
}

function csvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

async function allParticipants(store, sid) {
  const keys = await listKeys(store, `usr/${sid}/`);
  const rows = await Promise.all(keys.map((k) => store.get(k, { type: "json" })));
  return rows.filter(Boolean);
}

export async function handle(req, { store, hostKey }) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/live\/?/, "").replace(/\/$/, "");
  const method = req.method.toUpperCase();

  try {
    if (method === "GET" && path === "quiz") {
      return json({ questions: publicQuestions(), resultsStep: RESULTS_STEP, fullQuizUrl: FULL_QUIZ_URL });
    }

    if (method === "GET" && path === "state") {
      return json(await publicState(store));
    }

    if (method === "POST" && path === "join") {
      const st = await getState(store);
      const existing = (await listKeys(store, `usr/${st.sid}/`)).length;
      if (existing >= MAX_PARTICIPANTS) return json({ error: "Session is full" }, 503);
      const pid = randomUUID();
      await store.setJSON(`usr/${st.sid}/${pid}`, { answers: {}, createdAt: Date.now() });
      return json({ sid: st.sid, pid });
    }

    if (method === "POST" && path === "answer") {
      const body = await readBody(req);
      const st = await getState(store);
      const q = Number(body.q), opt = Number(body.opt);
      if (body.sid !== st.sid) return json({ error: "Session ended. Rejoin.", code: "session" }, 409);
      if (typeof body.pid !== "string" || !/^[0-9a-f-]{36}$/.test(body.pid)) return json({ error: "Bad participant" }, 400);
      if (!Number.isInteger(q) || q !== st.step || q < 0 || q > LAST_QUESTION) return json({ error: "That question is closed.", code: "closed", step: st.step }, 409);
      if (!Number.isInteger(opt) || opt < 0 || opt >= QUESTIONS[q].opts.length) return json({ error: "Bad option" }, 400);
      const ukey = `usr/${st.sid}/${body.pid}`;
      const usr = await store.get(ukey, { type: "json" });
      if (!usr) return json({ error: "Rejoin", code: "rejoin" }, 404);
      if (usr.answers[q] !== undefined) return json({ ok: true, locked: true, opt: usr.answers[q] });
      usr.answers[q] = opt;
      await store.setJSON(ukey, usr);
      await store.set(`cnt/${st.sid}/q${q}/${opt}-${body.pid}`, "1");
      return json({ ok: true, locked: false, opt });
    }

    if (method === "POST" && path === "result") {
      const body = await readBody(req);
      const st = await getState(store);
      if (body.sid !== st.sid) return json({ error: "Session ended.", code: "session" }, 409);
      if (typeof body.pid !== "string" || !/^[0-9a-f-]{36}$/.test(body.pid)) return json({ error: "Bad participant" }, 400);
      const ukey = `usr/${st.sid}/${body.pid}`;
      const usr = await store.get(ukey, { type: "json" });
      if (!usr) return json({ error: "Rejoin", code: "rejoin" }, 404);
      if (typeof body.email === "string" && body.email.trim()) {
        const email = body.email.trim();
        if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 400);
        if (body.consent !== true) return json({ error: "Please tick the box so we may follow up." }, 400);
        usr.email = email;
        usr.consent = true;
        usr.emailAt = Date.now();
        await store.setJSON(ukey, usr);
      }
      const result = computeResult(usr.answers);
      if (!result) return json({ incomplete: true, fullQuizUrl: FULL_QUIZ_URL, emailSaved: Boolean(usr.email) });
      return json({ incomplete: false, ...result, emailSaved: Boolean(usr.email) });
    }

    if (path.startsWith("host/")) {
      if (!hostKey) return json({ error: "HOST_KEY is not set on the server." }, 503);
      if (!keyMatches(req.headers.get("x-host-key"), hostKey)) return json({ error: "Wrong host key." }, 401);
      const sub = path.slice(5);

      if (method === "POST" && sub === "goto") {
        const body = await readBody(req);
        const step = Number(body.step);
        if (!Number.isInteger(step) || step < -1 || step > RESULTS_STEP) return json({ error: "Bad step" }, 400);
        const st = await getState(store);
        st.step = step;
        st.updatedAt = Date.now();
        await store.setJSON("state", st);
        return json(await publicState(store));
      }

      if (method === "POST" && sub === "reset") {
        const st = { sid: randomUUID().slice(0, 8), step: -1, updatedAt: Date.now() };
        await store.setJSON("state", st);
        return json(await publicState(store));
      }

      if (method === "GET" && sub === "zones") {
        const st = await getState(store);
        const people = await allParticipants(store, st.sid);
        const zones = { below: 0, inside: 0, above: 0 };
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
        return json({ joined: people.length, complete, emails, zones, jobs, names: Object.fromEntries(Object.entries(ZONES).map(([k, v]) => [k, v.zone])) });
      }

      if (method === "GET" && sub === "export") {
        const st = await getState(store);
        const people = await allParticipants(store, st.sid);
        const header = ["email", "consent", "zone", "first_job", ...QUESTIONS.map((q) => q.key)];
        const lines = [header.map(csvCell).join(",")];
        for (const p of people) {
          if (!p.email || !p.consent) continue;
          const r = computeResult(p.answers);
          const answers = QUESTIONS.map((q, n) => (p.answers[n] !== undefined ? q.opts[p.answers[n]].t : ""));
          lines.push([p.email, "yes", r ? r.zone : "incomplete", r ? r.firstJob : "", ...answers].map(csvCell).join(","));
        }
        return new Response(lines.join("\n") + "\n", {
          status: 200,
          headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="find-your-zone-${st.sid}.csv"`, "cache-control": "no-store" },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    const status = err.status ?? 500;
    return json({ error: status === 500 ? "Server error" : err.message }, status);
  }
}

export { SCORED_QUESTIONS };
