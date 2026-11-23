// Live Find Your Zone quiz API. Storage is injected so the same code runs on
// Netlify Blobs in production and an in-memory store in tests.

import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { QUESTIONS, SCORED_QUESTIONS } from "./quiz.mjs";
import { quizFor, scoped, FULL_QUIZ_URL } from "./events.mjs";

// Default quiz positions. Each event's quiz has its own, from its question count.
export const LAST_QUESTION = QUESTIONS.length - 1; // 11
export const RESULTS_STEP = QUESTIONS.length; // 12
const MAX_PARTICIPANTS = 500;
const MAX_BODY = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// How long a reported deck position counts as the current session.
const REMOTE_FRESH_MS = 30 * 60 * 1000;

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

// Answers to a question with parts (oya-01) count once a person has answered every part.
async function doneFor(store, sid, q) {
  return (await listKeys(store, `done/${sid}/q${q}/`)).length;
}

async function countsFor(store, sid, q, Q) {
  const n = Q.questions[q].opts.length;
  const counts = new Array(n).fill(0);
  const keys = await listKeys(store, `cnt/${sid}/q${q}/`);
  for (const k of keys) {
    const m = /\/(\d+)-[^/]+$/.exec(k);
    if (m && Number(m[1]) < n) counts[Number(m[1])]++;
  }
  return counts;
}

// "Joined" is live: phones that checked in during the last few minutes. A phone checks in when it joins and
// again every ~20 seconds. Old rehearsal phones and closed tabs drop off instead of counting forever.
const SEEN_MS = 60 * 1000, SEEN_BUCKETS = 5;
const PID_RE = /^[0-9a-f-]{36}$/;
async function touch(store, sid, pid) {
  await store.set(`seen/${sid}/${Math.floor(Date.now() / SEEN_MS)}/${pid}`, "1");
}
async function liveJoined(store, sid) {
  const b = Math.floor(Date.now() / SEEN_MS);
  const lists = await Promise.all(Array.from({ length: SEEN_BUCKETS }, (_, k) => listKeys(store, `seen/${sid}/${b - k}/`)));
  const ids = new Set();
  for (const keys of lists) for (const key of keys) ids.add(key.slice(key.lastIndexOf("/") + 1));
  return ids.size;
}

async function publicState(store, Q) {
  const st = await getState(store);
  const joined = await liveJoined(store, st.sid);
  const total = Q.questions.length;
  const out = { sid: st.sid, step: st.step, joined, resultsStep: total, total };
  if (st.step >= 0 && st.step < total) {
    if (Q.parts) {
      out.answered = await doneFor(store, st.sid, st.step);
    } else {
      const counts = await countsFor(store, st.sid, st.step, Q);
      out.counts = counts;
      out.answered = counts.reduce((a, b) => a + b, 0);
    }
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

export async function handle(req, { store: baseStore, hostKey, enabled = true }) {
  // Kill switch. Live features cost Netlify credits on every poll, so they stay off between events.
  // Answer 410 before any store access; the pages stop polling when they see it.
  if (!enabled) return json({ live: false, error: "Live features are off between events." }, 410);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/live\/?/, "").replace(/\/$/, "");
  const method = req.method.toUpperCase();
  // ?e=<id> picks an event's quiz and keeps its answers apart. No id: the original quiz.
  const ev = url.searchParams.get("e") || "";
  const Q = quizFor(ev);
  if (!Q) return json({ error: "Unknown event" }, 404);
  const store = ev ? scoped(baseStore, `ev/${ev}/`) : baseStore;
  const LAST = Q.questions.length - 1, RESULTS = Q.questions.length;

  try {
    if (method === "GET" && path === "quiz") {
      return json({ questions: Q.publicQuestions(), resultsStep: RESULTS, fullQuizUrl: FULL_QUIZ_URL, event: ev, title: Q.title || "" });
    }

    if (method === "GET" && path === "state") {
      // A phone passes its sid and pid every ~20 seconds so the room count is live.
      const sidQ = url.searchParams.get("sid"), pidQ = url.searchParams.get("pid");
      if (sidQ && pidQ && PID_RE.test(pidQ)) {
        const cur = await getState(store);
        if (cur.sid === sidQ) await touch(store, cur.sid, pidQ);
      }
      return json(await publicState(store, Q));
    }

    if (method === "POST" && path === "join") {
      const st = await getState(store);
      const existing = (await listKeys(store, `usr/${st.sid}/`)).length;
      if (existing >= MAX_PARTICIPANTS) return json({ error: "Session is full" }, 503);
      const pid = randomUUID();
      await store.setJSON(`usr/${st.sid}/${pid}`, { answers: {}, createdAt: Date.now() });
      await touch(store, st.sid, pid);
      return json({ sid: st.sid, pid });
    }

    if (method === "POST" && path === "answer") {
      const body = await readBody(req);
      const st = await getState(store);
      const q = Number(body.q), opt = Number(body.opt);
      if (body.sid !== st.sid) return json({ error: "Session ended. Rejoin.", code: "session" }, 409);
      if (typeof body.pid !== "string" || !/^[0-9a-f-]{36}$/.test(body.pid)) return json({ error: "Bad participant" }, 400);
      if (!Number.isInteger(q) || q > st.step || q < 0 || q > LAST) return json({ error: "That question is closed.", code: "closed", step: st.step }, 409);
      const ukey = `usr/${st.sid}/${body.pid}`;
      if (Q.parts) {
        const parts = Q.questions[q].parts, part = Number(body.part);
        if (!Number.isInteger(part) || part < 0 || part >= parts.length) return json({ error: "Bad part" }, 400);
        if (!Number.isInteger(opt) || opt < 0 || opt >= parts[part].opts.length) return json({ error: "Bad option" }, 400);
        const usr = await store.get(ukey, { type: "json" });
        if (!usr) return json({ error: "Rejoin", code: "rejoin" }, 404);
        const row = Array.isArray(usr.answers[q]) ? usr.answers[q] : [];
        if (row[part] !== undefined && row[part] !== null) return json({ ok: true, locked: true, part, opt: row[part] });
        row[part] = opt;
        usr.answers[q] = row;
        await store.setJSON(ukey, usr);
        if (parts.every((_, i) => row[i] !== undefined && row[i] !== null)) await store.set(`done/${st.sid}/q${q}/${body.pid}`, "1");
        return json({ ok: true, locked: false, part, opt });
      }
      if (!Number.isInteger(opt) || opt < 0 || opt >= Q.questions[q].opts.length) return json({ error: "Bad option" }, 400);
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
      const result = Q.computeResult(usr.answers);
      if (!result) return json({ incomplete: true, fullQuizUrl: FULL_QUIZ_URL, emailSaved: Boolean(usr.email) });
      return json({ incomplete: false, ...result, emailSaved: Boolean(usr.email) });
    }

    // Custom Dashboards deck remote. No host key by request: anyone with the notes link can move this deck.
    // Separate from the MKE SPIN remote, which keeps its host key.
    if (method === "GET" && path === "deck/state") {
      const r = (await store.get("remote-cd", { type: "json" })) || { seq: 0, cmd: null };
      return json({ seq: r.seq, cmd: r.cmd });
    }

    if (method === "POST" && path === "deck/goto") {
      const body = await readBody(req);
      const slide = Number(body.slide);
      if (!Number.isInteger(slide) || slide < 0 || slide > 199) return json({ error: "Bad slide" }, 400);
      const r = (await store.get("remote-cd", { type: "json" })) || { seq: 0, cmd: null };
      r.seq = (r.seq || 0) + 1; r.cmd = slide;
      await store.setJSON("remote-cd", r);
      return json({ ok: true, seq: r.seq, cmd: slide });
    }

    if (method === "GET" && path === "remote/state") {
      const r = (await store.get("remote", { type: "json" })) || { slide: 0, total: 0, seq: 0, cmd: null };
      // A position older than REMOTE_FRESH_MS is from an earlier session. The notes page starts at slide 1 instead.
      const fresh = Number.isFinite(r.at) && Date.now() - r.at < REMOTE_FRESH_MS;
      return json({ slide: r.slide, total: r.total, seq: r.seq, cmd: r.cmd, fresh });
    }

    if (method === "POST" && path === "remote/report") {
      // No host key, by request: the deck opened with ?remote=1 reports its slide so the notes pages can follow it.
      const body = await readBody(req);
      const slide = Number(body.slide), total = Number(body.total);
      if (!Number.isInteger(slide) || slide < 0 || slide > 199 || !Number.isInteger(total) || total < 1 || total > 200) return json({ error: "Bad slide" }, 400);
      const r = (await store.get("remote", { type: "json" })) || { seq: 0, cmd: null };
      await store.setJSON("remote", { ...r, slide, total, at: Date.now() });
      return json({ ok: true });
    }

    if (path.startsWith("host/")) {
      const sub = path.slice(5);
      // Moving the quiz and reading the room's totals need no key, by request. The totals are anonymous counts.
      // Reset is open too, so the host never gets stuck. Only export (emails) keeps the host key.
      const open = (method === "POST" && (sub === "goto" || sub === "reset" || sub === "remote")) || (method === "GET" && sub === "zones");
      if (!open) {
        if (!hostKey) return json({ error: "HOST_KEY is not set on the server." }, 503);
        if (!keyMatches(req.headers.get("x-host-key"), hostKey)) return json({ error: "Wrong host key." }, 401);
      }

      if (method === "POST" && sub === "goto") {
        const body = await readBody(req);
        const step = Number(body.step);
        if (!Number.isInteger(step) || step < -1 || step > RESULTS) return json({ error: "Bad step" }, 400);
        const st = await getState(store);
        st.step = step;
        st.updatedAt = Date.now();
        await store.setJSON("state", st);
        return json(await publicState(store, Q));
      }

      if (method === "POST" && sub === "remote") {
        const body = await readBody(req);
        const slide = Number(body.slide);
        if (!Number.isInteger(slide) || slide < 0 || slide > 199) return json({ error: "Bad slide" }, 400);
        const r = (await store.get("remote", { type: "json" })) || { slide: 0, total: 0, seq: 0, cmd: null };
        r.seq = (r.seq || 0) + 1; r.cmd = slide;
        await store.setJSON("remote", r);
        return json({ ok: true, seq: r.seq, cmd: slide });
      }

      if (method === "POST" && sub === "reset") {
        const st = { sid: randomUUID().slice(0, 8), step: -1, updatedAt: Date.now() };
        await store.setJSON("state", st);
        return json(await publicState(store, Q));
      }

      if (method === "GET" && sub === "zones") {
        const st = await getState(store);
        return json(Q.roomZones(await allParticipants(store, st.sid)));
      }

      if (method === "GET" && sub === "export") {
        const st = await getState(store);
        const people = await allParticipants(store, st.sid);
        const header = Q.exportHeader();
        const lines = [header.map(csvCell).join(",")];
        if (new URL(req.url).searchParams.get("format") === "json") {
          const rows = [];
          let withheld = 0;
          for (const p of people) {
            if (p.email && !p.consent) withheld++;
            if (!p.email || !p.consent) continue;
            rows.push(Q.exportJson(p));
          }
          return json({ rows, withheld, total: people.length });
        }
        for (const p of people) {
          if (!p.email || !p.consent) continue;
          lines.push(Q.exportRow(p).map(csvCell).join(","));
        }
        return new Response(lines.join("\n") + "\n", {
          status: 200,
          headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="find-your-zone-${ev ? ev + "-" : ""}${st.sid}.csv"`, "cache-control": "no-store" },
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
