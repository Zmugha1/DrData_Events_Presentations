import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../netlify/lib/api.mjs";
import { memStore } from "./memstore.mjs";
import { computeResult, zoneFor, scoreAnswers, firstJobFor } from "../netlify/lib/quiz.mjs";

const KEY = "test-host-key";
const mk = () => { const store = memStore(); return { store, call: (method, path, body, headers = {}) => handle(new Request(`http://x/api/live/${path}`, { method, body: body ? JSON.stringify(body) : undefined, headers }), { store, hostKey: KEY }) }; };
const host = { "x-host-key": KEY };

test("scoring matches the public quiz", () => {
  const ans = (arr) => Object.fromEntries(arr.map((v, i) => [i, v]));
  assert.equal(computeResult(ans([0,0,0,0,0,0,0])).zoneKey, "inside");
  assert.equal(computeResult(ans([1,1,1,1,1,1,1])).zoneKey, "below");
  assert.equal(computeResult(ans([3,3,3,3,3,3,3])).zoneKey, "above");
  assert.equal(computeResult(ans([0,0,0,0,0,1,0])).zoneKey, "inside"); // a=1 only
  assert.equal(computeResult(ans([0,0,0,0,0,3,0])).zoneKey, "above"); // a=3
  assert.equal(computeResult(ans([0,0,0,0,0,0])), null); // Q7 missing
  assert.deepEqual(scoreAnswers(ans([0,0,0,0,0,0,0])), { b: 0, a: 0, i: 13 });
  assert.equal(firstJobFor(ans([0,0,0,0])), "Consistency across all four jobs");
  assert.equal(firstJobFor(ans([1,2,3,1])), "Proposals and quotes"); // highest b wins
  assert.equal(firstJobFor(ans([2,2,1,1])), "Meeting preparation"); // earliest wins a tie
});

test("host endpoints need the right key and fail closed", async () => {
  const { call, store } = mk();
  assert.equal((await call("POST", "host/goto", { step: 0 })).status, 401);
  assert.equal((await call("POST", "host/goto", { step: 0 }, { "x-host-key": "nope" })).status, 401);
  const r = await handle(new Request("http://x/api/live/host/goto", { method: "POST", body: "{}", headers: host }), { store, hostKey: undefined });
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
  // Locked: a second answer to the same question does not change it, and an old question is closed.
  r = await call("POST", "answer", { ...people[0], q: 11, opt: 1 });
  assert.equal((await r.json()).locked, true);
  r = await call("POST", "answer", { ...people[0], q: 3, opt: 1 });
  assert.equal(r.status, 409);

  await call("POST", "host/goto", { step: 12 }, host);
  const even = await (await call("POST", "result", people[0])).json();
  assert.equal(even.zoneKey, "inside");
  const odd = await (await call("POST", "result", people[1])).json();
  assert.equal(odd.zoneKey, "below");

  // Email needs consent and a valid address.
  assert.equal((await call("POST", "result", { ...people[0], email: "bad" })).status, 400);
  assert.equal((await call("POST", "result", { ...people[0], email: "a@b.co" })).status, 400);
  const withEmail = await (await call("POST", "result", { ...people[0], email: "a@b.co", consent: true })).json();
  assert.equal(withEmail.emailSaved, true);

  const z = await (await call("GET", "host/zones", null, host)).json();
  assert.deepEqual(z.zones, { below: 6, inside: 6, above: 0 });
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

test("remote control: command needs the host key, deck reports, phone reads", async () => {
  const { call } = mk();
  assert.equal((await call("POST", "host/remote", { slide: 5 })).status, 401);
  assert.equal((await call("POST", "remote/report", { slide: 3, total: 50 })).status, 200);
  assert.equal((await call("POST", "remote/report", { slide: -1, total: 50 })).status, 400);
  let s = await (await call("GET", "remote/state")).json();
  assert.equal(s.slide, 3); assert.equal(s.total, 50); assert.equal(s.seq, 0);
  assert.equal((await call("POST", "host/remote", { slide: 4 }, host)).status, 200);
  s = await (await call("GET", "remote/state")).json();
  assert.equal(s.seq, 1); assert.equal(s.cmd, 4); assert.equal(s.slide, 3);
  assert.equal((await call("POST", "host/remote", { slide: 999 }, host)).status, 400);
});
