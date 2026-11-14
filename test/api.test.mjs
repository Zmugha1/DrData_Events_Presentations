import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../netlify/lib/api.mjs";
import { memStore } from "./memstore.mjs";
import { computeResult, zoneFor, scoreAnswers, firstJobFor, QUESTIONS } from "../netlify/lib/quiz.mjs";

const KEY = "test-host-key";
const mk = () => { const store = memStore(); return { store, call: (method, path, body, headers = {}) => handle(new Request(`http://x/api/live/${path}`, { method, body: body ? JSON.stringify(body) : undefined, headers }), { store, hostKey: KEY }) }; };
const host = { "x-host-key": KEY };

test("scoring matches the public quiz", () => {
  // Picks, for each scored question, the option tagged with the given zone.
  const pick = (zones) => Object.fromEntries(zones.map((z, n) => [n, QUESTIONS[n].opts.findIndex((o) => o.z === z)]));
  const all = (z) => pick(Array(8).fill(z));
  assert.equal(computeResult(all("below")).zoneKey, "below");
  assert.equal(computeResult(all("inside")).zoneKey, "inside");
  assert.equal(computeResult(all("above")).zoneKey, "above");
  assert.equal(computeResult(all("oscillating")).zoneKey, "oscillating");
  assert.equal(computeResult(all("below")).mode, "Encode");
  assert.equal(computeResult(all("inside")).mode, "Assist");
  assert.equal(computeResult(all("above")).mode, "Research");
  assert.equal(computeResult(all("oscillating")).mode, "Learn");
  // Ties go to the riskier zone: Above, Oscillating, Below, Inside.
  assert.equal(zoneFor({ below: 4, inside: 4, above: 0, oscillating: 0 }), "below");
  assert.equal(zoneFor({ below: 3, inside: 0, above: 0, oscillating: 3 }), "oscillating");
  assert.equal(zoneFor({ below: 2, inside: 2, above: 2, oscillating: 2 }), "above");
  // Eight answers are needed.
  const seven = all("inside"); delete seven[7];
  assert.equal(computeResult(seven), null);
  assert.deepEqual(scoreAnswers(pick(["below", "below", "inside", "above", "oscillating", "inside", "inside", "below"])), { below: 3, inside: 3, above: 1, oscillating: 1 });
  // First job: the first of Q1 to Q3 answered Below.
  assert.equal(firstJobFor(all("inside")), "Your most repeated task");
  assert.equal(firstJobFor(pick(["inside", "below", "below"])), "Messages and follow-ups");
  assert.equal(firstJobFor(pick(["below", "below", "inside"])), "Preparation");
  assert.match(computeResult(all("below")).step, /Preparation/);
  // Answer order is rotated, so the Inside answer is not always first.
  assert.notEqual(QUESTIONS[1].opts[0].z, "inside");
});

test("quiz navigation, reset and room totals are open; export and remote need the key and fail closed", async () => {
  const { call, store } = mk();
  assert.equal((await call("POST", "host/goto", { step: 0 })).status, 200);
  assert.equal((await call("POST", "host/goto", { step: 99 })).status, 400);
  assert.equal((await call("GET", "host/zones")).status, 200);
    assert.equal((await call("GET", "host/export")).status, 401);
  assert.equal((await call("POST", "host/reset")).status, 200);
  const r = await handle(new Request("http://x/api/live/host/export", { method: "GET", headers: host }), { store, hostKey: undefined });
  assert.equal(r.status, 503);
});

test("full live flow: join, answer in sync, counts, result, export", async () => {
  const { call } = mk();
  const st0 = await (await call("GET", "state")).json();
  assert.equal(st0.step, -1);
  const people = [];
  for (let i = 0; i < 12; i++) people.push(await (await call("POST", "join")).json());
  assert.equal((await (await call("GET", "state")).json()).joined, 12);

  // Answers are refused until the host opens the question.
  let r = await call("POST", "answer", { ...people[0], q: 0, opt: 0 });
  assert.equal(r.status, 409);

  for (let q = 0; q < 12; q++) {
    await call("POST", "host/goto", { step: q }, host);
    for (let i = 0; i < people.length; i++) {
      const opt = i % 2 === 0 ? 0 : 1;
      const o = Math.min(opt, 1);
      r = await call("POST", "answer", { ...people[i], q, opt: o });
      assert.equal(r.status, 200);
    }
    const st = await (await call("GET", "state")).json();
    assert.equal(st.answered, 12);
    assert.equal(st.counts[0], 6);
    assert.equal(st.counts[1], 6);
  }
  // Locked: a second answer to the same question does not change it, and an earlier question still keeps the first answer.
  r = await call("POST", "answer", { ...people[0], q: 11, opt: 1 });
  assert.equal((await r.json()).locked, true);
  r = await call("POST", "answer", { ...people[0], q: 3, opt: 1 });
  assert.equal((await r.json()).locked, true);

  await call("POST", "host/goto", { step: 12 }, host);
  // With rotated answers, the first and second options each spread two answers per zone,
  // so both groups tie and the tie goes to Above.
  const even = await (await call("POST", "result", people[0])).json();
  assert.equal(even.zoneKey, "above");
  assert.deepEqual(even.mix, { below: 2, inside: 2, above: 2, oscillating: 2 });
  const odd = await (await call("POST", "result", people[1])).json();
  assert.equal(odd.zoneKey, "above");

  // Email needs consent and a valid address.
  assert.equal((await call("POST", "result", { ...people[0], email: "bad" })).status, 400);
  assert.equal((await call("POST", "result", { ...people[0], email: "a@b.co" })).status, 400);
  const withEmail = await (await call("POST", "result", { ...people[0], email: "a@b.co", consent: true })).json();
  assert.equal(withEmail.emailSaved, true);

  const z = await (await call("GET", "host/zones", null, host)).json();
  assert.deepEqual(z.zones, { below: 0, inside: 0, above: 12, oscillating: 0 });
  assert.equal(z.modes.oscillating, "Learn");
  assert.equal(z.emails, 1);

  const csv = await (await call("GET", "host/export", null, host)).text();
  assert.match(csv, /a@b\.co/);
  assert.equal(csv.trim().split("\n").length, 2);
});

test("a late joiner gets an incomplete result instead of a wrong zone", async () => {
  const { call } = mk();
  const p = await (await call("POST", "join")).json();
  await call("POST", "host/goto", { step: 9 }, host);
  await call("POST", "answer", { ...p, q: 9, opt: 2 });
  const res = await (await call("POST", "result", p)).json();
  assert.equal(res.incomplete, true);
});

test("reset starts a clean session and old participants must rejoin", async () => {
  const { call } = mk();
  const p = await (await call("POST", "join")).json();
  await call("POST", "host/reset", null, host);
  const st = await (await call("GET", "state")).json();
  assert.notEqual(st.sid, p.sid);
  assert.equal(st.joined, 0);
  const r = await call("POST", "answer", { ...p, q: 0, opt: 0 });
  assert.equal(r.status, 409);
});

test("CSV cells that start with a formula character are neutralised", async () => {
  const { call, store } = mk();
  const p = await (await call("POST", "join")).json();
  await call("POST", "result", { ...p, email: "=x@evil.co", consent: true });
  const csv = await (await call("GET", "host/export", null, host)).text();
  assert.match(csv, /"'=x@evil\.co"/);
});

test("remote control: command and report need the host key, phone reads", async () => {
  const { call } = mk();
  assert.equal((await call("POST", "host/remote", { slide: 5 })).status, 401);
  // The deck must send the host key to report its slide, so a stranger cannot move the notes.
  assert.equal((await call("POST", "remote/report", { slide: 3, total: 50 })).status, 401);
  assert.equal((await call("POST", "remote/report", { slide: 3, total: 50 }, { "x-host-key": "wrong" })).status, 401);
  assert.equal((await call("POST", "remote/report", { slide: 3, total: 50 }, host)).status, 200);
  assert.equal((await call("POST", "remote/report", { slide: -1, total: 50 }, host)).status, 400);
  let s = await (await call("GET", "remote/state")).json();
  assert.equal(s.slide, 3); assert.equal(s.total, 50); assert.equal(s.seq, 0); assert.equal(s.fresh, true);
  assert.equal((await call("POST", "host/remote", { slide: 4 }, host)).status, 200);
  s = await (await call("GET", "remote/state")).json();
  assert.equal(s.seq, 1); assert.equal(s.cmd, 4); assert.equal(s.slide, 3);
  assert.equal((await call("POST", "host/remote", { slide: 999 }, host)).status, 400);
});

test("remote control: an old position is not fresh", async () => {
  const { store, call } = mk();
  let s = await (await call("GET", "remote/state")).json();
  assert.equal(s.fresh, false);
  await store.setJSON("remote", { slide: 16, total: 53, seq: 2, cmd: null, at: Date.now() - 31 * 60 * 1000 });
  s = await (await call("GET", "remote/state")).json();
  assert.equal(s.slide, 16); assert.equal(s.fresh, false);
  await store.setJSON("remote", { slide: 16, total: 53, seq: 2, cmd: null, at: Date.now() - 5 * 60 * 1000 });
  s = await (await call("GET", "remote/state")).json();
  assert.equal(s.fresh, true);
});

test("a late answer to the question just left still counts, a future question does not", async () => {
  const { call } = mk();
  const me = await (await call("POST", "join")).json();
  await call("POST", "host/goto", { step: 3 });
  assert.equal((await call("POST", "answer", { sid: me.sid, pid: me.pid, q: 2, opt: 0 })).status, 200);
  assert.equal((await call("POST", "answer", { sid: me.sid, pid: me.pid, q: 4, opt: 0 })).status, 409);
});
