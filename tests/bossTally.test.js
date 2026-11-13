import { test } from "node:test";
import assert from "node:assert/strict";
import { BossTally, summarizeBossTally } from "../src/core/bossTally.js";

const DT = 1 / 60;
const R = 20.8;

// Feed a synthetic encounter: spawn at tick 0, then interleaved samples
// (ship pos) and events. Returns [tally, record].
function runKillPath() {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.sample({ x: 0, y: 0 }); // tick 1, inner
  t.onEvent("fire", { pos: { x: 0, y: 1 }, level: 1 });
  t.onEvent("fire", { pos: { x: 0, y: 1 }, level: 1 });
  t.sample({ x: 25, y: 0 }); // tick 2, outer
  t.onEvent("fire", { pos: { x: 25, y: 1 }, level: 1 });
  t.onEvent("hit", { pos: { x: 25, y: 0 }, knock: 1, lives: 2 });
  t.onEvent("bossPhase2", { pos: { x: 5, y: 0 }, hpFrac: 0.5 });
  t.onEvent("hit", { pos: { x: 5, y: 0 }, knock: 1, lives: 2 });
  t.sample({ x: 0, y: 0 }); // tick 3, inner
  t.onEvent("bossDeath", { pos: { x: 5, y: 0 }, kind: "monolith" });
  return t.snapshot();
}

test("kill path: record fields are exact (ST-300)", () => {
  const [e] = runKillPath();
  assert.equal(e.outcome, "kill");
  assert.equal(e.kind, "monolith");
  assert.equal(e.wave, 5);
  assert.equal(e.maxHp, 40);
  assert.equal(e.startTick, 0);
  assert.equal(e.endTick, 3);
  assert.equal(e.ttkTicks, 3);
  assert.equal(e.bulletsFired, 3);
  assert.equal(e.outerFires, 1); // only the fire sampled at r=25
  assert.equal(e.hitsTaken, 2);
  assert.equal(e.hitsP1, 1);
  assert.equal(e.hitsP2, 1);
  assert.equal(e.phase2, true);
  assert.equal(e.phase2Tick, 2);
  assert.equal(e.outerTicks, 1); // only tick 2 at r=25
});

test("die path: gameover closes the encounter as 'die'", () => {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "splicer", wave: 15, hp: 52 });
  t.sample({ x: 1, y: 1 });
  t.onEvent("hit", { pos: { x: 1, y: 1 }, knock: 1, lives: 0 });
  t.onEvent("gameover", { score: 123 });
  const [e] = t.snapshot();
  assert.equal(e.outcome, "die");
  assert.equal(e.kind, "splicer");
  assert.equal(e.ttkTicks, 1);
  assert.equal(e.hitsTaken, 1);
  assert.equal(e.hitsP1, 1);
  assert.equal(e.phase2, false);
  assert.equal(e.phase2Tick, -1);
  assert.equal(t.open, false);
});

test("open path: closeOpen resolves an unresolved encounter", () => {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.sample({ x: 0, y: 0 });
  assert.equal(t.open, true);
  t.closeOpen();
  assert.equal(t.open, false);
  const [e] = t.snapshot();
  assert.equal(e.outcome, "open");
  assert.equal(e.endTick, 1);
  assert.equal(e.ttkTicks, 1);
  // closeOpen is a no-op when nothing is open
  t.closeOpen();
  assert.equal(t.snapshot().length, 1);
});

test("events before any spawn and unknown events are ignored, never throw", () => {
  const t = new BossTally(DT, R);
  t.onEvent("fire", { pos: { x: 0, y: 0 }, level: 1 });
  t.onEvent("hit", { pos: { x: 0, y: 0 }, knock: 0, lives: 3 });
  t.onEvent("bossPhase2", { pos: { x: 0, y: 0 }, hpFrac: 0.5 });
  t.onEvent("totallyUnknown", { whatever: 1 });
  t.onEvent("gameover", { score: 0 });
  t.sample({ x: 0, y: 0 });
  assert.equal(t.snapshot().length, 0);
  assert.equal(t.open, false);
  // ...and still works afterwards
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.onEvent("bossDeath", { pos: { x: 0, y: 0 }, kind: "monolith" });
  assert.equal(t.snapshot()[0].outcome, "kill");
});

test("a second bossSpawn closes the unresolved first as 'open'", () => {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.onEvent("bossSpawn", { kind: "splicer", wave: 15, hp: 52 });
  assert.equal(t.open, true);
  t.onEvent("bossDeath", { pos: { x: 0, y: 0 }, kind: "splicer" });
  const [a, b] = t.snapshot();
  assert.equal(a.outcome, "open");
  assert.equal(b.outcome, "kill");
  assert.equal(b.kind, "splicer");
});

test("outer band is strict > outerR and tracks per sample", () => {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.sample({ x: R, y: 0 }); // exactly at the band: NOT outer
  assert.equal(t.snapshot().length, 0); // still open
  // probe the open record via a fresh instance instead
  const t2 = new BossTally(DT, R);
  t2.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t2.sample({ x: R, y: 0 });
  t2.sample({ x: R + 0.1, y: 0 });
  t2.sample({ x: 0, y: R + 0.1 });
  t2.sample({ x: 0, y: 0 });
  t2.closeOpen();
  assert.equal(t2.snapshot()[0].outerTicks, 2);
});

test("phase2 only fires once; later bossPhase2 events are no-ops", () => {
  const t = new BossTally(DT, R);
  t.onEvent("bossSpawn", { kind: "monolith", wave: 5, hp: 40 });
  t.onEvent("bossPhase2", { pos: { x: 0, y: 0 }, hpFrac: 0.5 });
  t.sample({ x: 0, y: 0 });
  t.onEvent("bossPhase2", { pos: { x: 0, y: 0 }, hpFrac: 0.5 });
  t.onEvent("bossDeath", { pos: { x: 0, y: 0 }, kind: "monolith" });
  const [e] = t.snapshot();
  assert.equal(e.phase2Tick, 0);
});

// ---- summarizeBossTally ----

function enc(partial) {
  return Object.assign(
    {
      kind: "monolith", wave: 5, maxHp: 40,
      startTick: 0, endTick: 0, ttkTicks: 0,
      bulletsFired: 0, hitsTaken: 0, hitsP1: 0, hitsP2: 0,
      phase2: false, phase2Tick: -1,
      outerTicks: 0, outerFires: 0, outcome: "kill",
    },
    partial,
  );
}

test("summarize: aggregates per kind with TTK/hit/band stats", () => {
  const es = [
    enc({ kind: "monolith", ttkTicks: 60, hitsTaken: 2, hitsP1: 2, phase2: true, outerTicks: 30, bulletsFired: 100, outerFires: 40 }),
    enc({ kind: "monolith", ttkTicks: 120, hitsTaken: 4, hitsP1: 1, hitsP2: 3, phase2: true, outcome: "die" }),
    enc({ kind: "monolith", outcome: "open" }),
    enc({ kind: "splicer", ttkTicks: 90, hitsTaken: 1, hitsP1: 1 }),
  ];
  const [m, s] = summarizeBossTally(es, DT);
  assert.equal(m.kind, "monolith");
  assert.equal(s.kind, "splicer");
  assert.equal(m.n, 3);
  assert.equal(m.kills, 1);
  assert.equal(m.dies, 1);
  assert.equal(m.open, 1);
  // TTK over kills only: median of [60] ticks -> 1 s
  assert.equal(m.ttkMed, 60 * DT);
  assert.equal(m.ttkP90, 60 * DT);
  // Hits over closed (kill|die): [2, 4]
  assert.equal(m.hitsMed, 3);
  assert.equal(m.hitsMax, 4);
  assert.equal(m.hitsP1, 3);
  assert.equal(m.hitsP2, 3);
  assert.equal(m.phase2Frac, 1); // both closed reached phase 2
  assert.equal(m.outerShipFrac, 30 / 180);
  assert.equal(m.outerFireFrac, 40 / 100);
  assert.equal(m.killRatio, 0.5);
  // splicer: single kill
  assert.equal(s.ttkMed, 90 * DT);
  assert.equal(s.killRatio, 1);
  assert.equal(s.outerShipFrac, 0);
});

test("summarize: multi-kill median/p90 use linear interpolation", () => {
  const es = [
    enc({ ttkTicks: 60 }),
    enc({ ttkTicks: 120 }),
  ];
  const [m] = summarizeBossTally(es, DT);
  assert.equal(m.ttkMed, 90 * DT); // (60+120)/2
  assert.equal(m.ttkP90, 114 * DT); // 60 + 60*0.9
});

test("summarize: empty input returns no groups; dt override respected", () => {
  assert.deepEqual(summarizeBossTally([]), []);
  const [m] = summarizeBossTally([enc({ ttkTicks: 10 })], 0.5);
  assert.equal(m.ttkMed, 5); // 10 ticks * 0.5 s
});