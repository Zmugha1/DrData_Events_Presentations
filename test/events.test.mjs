import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../netlify/lib/api.mjs";
import { memStore } from "./memstore.mjs";
import { stepZone, OYA01 } from "../netlify/lib/oya01.mjs";

const KEY = "test-host-key";
const mk = () => {
  const store = memStore();
  const call = (method, path, body, headers = {}) =>
    handle(new Request(`http://x/api/live/${path}`, { method, body: body ? JSON.stringify(body) : undefined, headers }), { store, hostKey: KEY });
  return { store, call };
};
const E = "e=oya-01";
const q = (path) => path + (path.includes("?") ? "&" : "?") + E;

test("step zone follows the Hub order: all past reach is Above, routine with a stated rule is Below, else Inside", () => {
  // parts: 0 = rule stated (yes/partly/no), 1 = routine/judgment, 2 = past reach (no/part/all)
  assert.equal(stepZone([0, 0, 0]), "below");
  assert.equal(stepZone([0, 0, 2]), "above");
  assert.equal(stepZone([0, 1, 0]), "inside");
  assert.equal(stepZone([1, 0, 0]), "inside");
  assert.equal(stepZone([2, 0, 1]), "inside");
  assert.equal(stepZone([0, 0, 1]), "below");
  assert.equal(stepZone([0, 0]), null);
});

test("an unknown event is refused", async () => {
  const { call } = mk();
  assert.equal((await call("GET", "quiz?e=nope")).status, 404);
});

test("the oya-01 quiz has six steps of three questions each", async () => {
  const { call } = mk();
  const j = await (await call("GET", q("quiz"))).json();
  assert.equal(j.questions.length, 6);
  for (const s of j.questions) assert.equal(s.parts.length, 3);
  assert.equal(j.resultsStep, 6);
  assert.equal(OYA01.questions.length, 6);
});

test("events do not mix: joining one event does not show in the default quiz", async () => {
  const { call } = mk();
  await call("POST", q("join"));
  await call("POST", q("join"));
  assert.equal((await (await call("GET", q("state"))).json()).joined, 2);
  assert.equal((await (await call("GET", "state")).json()).joined, 0);
});

test("oya-01 flow: three answers per step, closed steps refused, personal map and room zones per step", async () => {
  const { call } = mk();
  const a = await (await call("POST", q("join"))).json();
  const b = await (await call("POST", q("join"))).json();
  assert.equal((await call("POST", q("host/goto"), { step: 0 })).status, 200);
  // A future step is closed.
  assert.equal((await call("POST", q("answer"), { sid: a.sid, pid: a.pid, q: 1, part: 0, opt: 0 })).status, 409);
  // A bad part is refused.
  assert.equal((await call("POST", q("answer"), { sid: a.sid, pid: a.pid, q: 0, part: 3, opt: 0 })).status, 400);
  for (const [part, opt] of [[0, 0], [1, 0], [2, 0]]) await call("POST", q("answer"), { sid: a.sid, pid: a.pid, q: 0, part, opt });
  for (const [part, opt] of [[0, 0], [1, 1], [2, 0]]) await call("POST", q("answer"), { sid: b.sid, pid: b.pid, q: 0, part, opt });
  // A part is locked once answered.
  const locked = await (await call("POST", q("answer"), { sid: a.sid, pid: a.pid, q: 0, part: 0, opt: 2 })).json();
  assert.equal(locked.locked, true);
  assert.equal(locked.opt, 0);
  const st = await (await call("GET", q("state"))).json();
  assert.equal(st.answered, 2);
  await call("POST", q("host/goto"), { step: 6 });
  const ra = await (await call("POST", q("result"), { sid: a.sid, pid: a.pid })).json();
  assert.equal(ra.incomplete, false);
  assert.equal(ra.steps[0].zoneKey, "below");
  assert.equal(ra.steps[1].zoneKey, null);
  const room = await (await call("GET", q("host/zones"))).json();
  assert.deepEqual(room.steps[0].zones, { below: 1, inside: 1, above: 0, oscillating: 0 });
  assert.equal(room.complete, 2);
});

test("oya-01: a person with no complete step gets an incomplete result", async () => {
  const { call } = mk();
  const a = await (await call("POST", q("join"))).json();
  await call("POST", q("host/goto"), { step: 6 });
  const r = await (await call("POST", q("result"), { sid: a.sid, pid: a.pid })).json();
  assert.equal(r.incomplete, true);
});
