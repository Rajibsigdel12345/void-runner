// ST-304 (I329): unit tests for the adaptive director (src/core/director.js).
// Pure-node, deterministic, no DOM/three. Pins the bounded-monotone envelope
// (bands unbreakable), lull keying (hits / sustained windowed load, never
// P-delta), recovery of >= 1 wave, wave-start-only + hit-window reset, the
// NEUTRAL contract for off/replay/pre-firstWave (R-E33-1: demo/replay
// bit-identical), and the per-decision log ring.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Director, NEUTRAL_ADJ, DIRECTOR_DEFAULTS } from "../src/core/director.js";
import { CONFIG } from "../src/core/config.js";
import { RNG } from "../src/core/rng.js";

const D = CONFIG.director;
const DT = 1 / 60;

function dir(over) { return new Director(over || {}); }
function ctxOf(P, replayMode) { return { performance: P, replayMode: !!replayMode }; }
function close(a, b) { return Math.abs(a - b) <= 1e-9; }
function inBand(v, lo, hi, lull) { return (v >= lo - 1e-12 && v <= hi + 1e-12) || close(v, lull); }
function feedLoad(d, load, seconds) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) d.sample(DT, load);
}

test("defaults mirror CONFIG.director exactly (config is the single source of truth)", () => {
  assert.deepEqual(DIRECTOR_DEFAULTS, D);
});

test("off: NEUTRAL_ADJ by identity, zero state change, zero log (R-E33-1)", () => {
  const d = dir({ enabled: false });
  const dec = d.decideForWave(10, ctxOf(0.5));
  assert.equal(dec, NEUTRAL_ADJ);
  assert.ok(Object.isFrozen(NEUTRAL_ADJ));
  assert.ok(close(d.pressure, D.pressureStart));
  assert.equal(d.log.length, 0);
  assert.equal(d.lastDecision, null);
});

test("replay mode: NEUTRAL even when enabled (demo pin structurally safe)", () => {
  const d = dir();
  const dec = d.decideForWave(9, ctxOf(0.9, true));
  assert.equal(dec, NEUTRAL_ADJ);
  assert.equal(d.log.length, 0);
});

test("waves 1-2 stay fixed: NEUTRAL before firstWave, live from wave 3", () => {
  const d = dir();
  assert.equal(d.decideForWave(1, ctxOf(0.9)), NEUTRAL_ADJ);
  assert.equal(d.decideForWave(2, ctxOf(0.1)), NEUTRAL_ADJ);
  const dec = d.decideForWave(3, ctxOf(0.5));
  assert.notEqual(dec, NEUTRAL_ADJ);
  assert.equal(d.log.length, 1);
});

test("wave 3 neutral pilot: t = 0.25 -> exact d/b/drop maps, gentle, hold", () => {
  const d = dir();
  const dec = d.decideForWave(3, ctxOf(0.5));
  assert.equal(dec.lull, false);
  assert.ok(close(dec.p, 0.3));
  assert.ok(close(dec.d, D.density.min + (D.density.max - D.density.min) * 0.25));
  assert.ok(close(dec.b, D.bullet.min + (D.bullet.max - D.bullet.min) * 0.25));
  assert.ok(close(dec.drop, D.drop.max + (D.drop.min - D.drop.max) * 0.25));
  assert.equal(dec.mod, "gentle");
  assert.equal(dec.reason, "hold");
});

test("skilled ramp: P=1 climbs one step per wave, caps at 0.9 -> hard band", () => {
  const d = dir();
  const ps = [0.45, 0.6, 0.75, 0.9];
  let dec;
  for (let w = 3; w <= 6; w++) {
    dec = d.decideForWave(w, ctxOf(1));
    assert.ok(close(dec.p, ps[w - 3]));
  }
  assert.ok(close(dec.d, D.density.max));
  assert.ok(close(dec.b, D.bullet.max));
  assert.ok(close(dec.drop, D.drop.min));
  assert.equal(dec.mod, "hard");
  assert.equal(dec.reason, "skilled");
});

test("struggle ramp: P=0 descends one step per wave, floors at 0.1 -> gentle band", () => {
  const d = dir();
  let dec;
  for (let w = 3; w <= 6; w++) dec = d.decideForWave(w, ctxOf(0));
  assert.ok(close(dec.p, D.pressureMin));
  assert.ok(close(dec.d, D.density.min));
  assert.ok(close(dec.b, D.bullet.min));
  assert.ok(close(dec.drop, D.drop.max));
  assert.equal(dec.mod, "gentle");
  assert.equal(dec.reason, "struggle");
});

test("hold: P=0.5 leaves pressure unchanged (no drift over 10 waves)", () => {
  const d = dir();
  for (let w = 3; w <= 12; w++) {
    const dec = d.decideForWave(w, ctxOf(0.5));
    assert.ok(close(dec.p, D.pressureStart));
    assert.equal(dec.reason, "hold");
  }
});

test("lull on non-lethal hit: snap to min, lull band values, reason hit", () => {
  const d = dir();
  d.decideForWave(3, ctxOf(0.5));
  d.onEvent("hit", { lives: 2 });
  const dec = d.decideForWave(4, ctxOf(0.9)); // skilled pilot still gets the trough
  assert.equal(dec.lull, true);
  assert.equal(dec.reason, "hit");
  assert.ok(close(dec.p, D.pressureMin));
  assert.ok(close(dec.d, D.lullDensity));
  assert.ok(close(dec.b, D.lullBullet));
  assert.ok(close(dec.drop, D.lullDrop));
  assert.equal(dec.mod, "gentle");
});

test("lull on lethal hit: lives===0 tracked, reason hit (never P-delta)", () => {
  const d = dir();
  d.onEvent("hit", { lives: 0 });
  assert.equal(d.hits, 1);
  assert.equal(d.lethals, 1); // tracked per event; decide() clears the per-wave window
  const dec = d.decideForWave(3, ctxOf(0));
  assert.equal(dec.lull, true);
  assert.equal(dec.reason, "hit");
});

test("lull on sustained windowed load: 20 s of full load lifts EMA past 0.55, no hit", () => {
  const d = dir();
  feedLoad(d, 1, 20);
  assert.ok(d.loadEMA >= D.lullLHigh);
  const dec = d.decideForWave(3, ctxOf(0.5));
  assert.equal(dec.lull, true);
  assert.equal(dec.reason, "load");
});

test("brief high-load burst does NOT lull (windowed EMA, not instant) - I328 R2c", () => {
  const d = dir();
  feedLoad(d, 1, 2);
  assert.ok(d.loadEMA < D.lullLHigh);
  const dec = d.decideForWave(3, ctxOf(0.5));
  assert.equal(dec.lull, false);
  assert.equal(dec.reason, "hold");
});

test("recovery takes >= 1 wave: after a hit lull, P=1 climbs one step only", () => {
  const d = dir();
  d.onEvent("hit", { lives: 1 });
  const w3 = d.decideForWave(3, ctxOf(0.5));
  assert.equal(w3.lull, true);
  const w4 = d.decideForWave(4, ctxOf(1));
  assert.equal(w4.lull, false);
  assert.ok(close(w4.p, D.pressureMin + D.pressureStep));
  assert.equal(w4.mod, "gentle"); // still far below the hard threshold
});

test("hit window resets every decide: one hit lulls exactly the next wave", () => {
  const d = dir();
  d.onEvent("hit", { lives: 3 });
  assert.equal(d.decideForWave(3, ctxOf(0.5)).lull, true);
  assert.equal(d.decideForWave(4, ctxOf(0.5)).lull, false);
  assert.equal(d.decideForWave(5, ctxOf(0.5)).lull, false);
});

test("loadEMA is persistent state: uncooled EMA still lulls the next wave, and cools", () => {
  const d = dir();
  feedLoad(d, 1, 20);
  assert.equal(d.decideForWave(3, ctxOf(0.5)).reason, "load");
  const w4 = d.decideForWave(4, ctxOf(0.5)); // no new samples: EMA unchanged
  assert.equal(w4.lull, true);
  assert.equal(w4.reason, "load");
  feedLoad(d, 0, 30);
  assert.ok(d.loadEMA < D.lullLHigh);
});

test("property (2000 waves, pinned seed 32801): d/b/drop never leave bands, p clamped", () => {
  const d = dir();
  const rng = new RNG(32801);
  const mods = new Set(["gentle", "none", "hard"]);
  const reasons = new Set(["hit", "load", "struggle", "skilled", "hold"]);
  for (let w = 3; w <= 2002; w++) {
    for (let i = 0; i < 300; i++) d.sample(DT, rng.range(0, 1)); // 5 s of field per wave
    if (rng.chance(0.1)) d.onEvent("hit", { lives: rng.int(0, 2) });
    const dec = d.decideForWave(w, ctxOf(rng.range(0, 1)));
    assert.equal(dec.wave, w);
    assert.equal(typeof dec.lull, "boolean");
    assert.ok(dec.p >= D.pressureMin - 1e-12 && dec.p <= D.pressureMax + 1e-12);
    assert.ok(inBand(dec.d, D.density.min, D.density.max, D.lullDensity));
    assert.ok(inBand(dec.b, D.bullet.min, D.bullet.max, D.lullBullet));
    assert.ok(inBand(dec.drop, D.drop.min, D.drop.max, D.lullDrop));
    assert.ok(mods.has(dec.mod));
    assert.ok(reasons.has(dec.reason));
  }
});

test("monotone maps: harder pressure -> more density, faster bullets, fewer drops", () => {
  const soft = dir(); const hard = dir();
  for (let w = 3; w <= 6; w++) { soft.decideForWave(w, ctxOf(0)); hard.decideForWave(w, ctxOf(1)); }
  assert.ok(hard.pressure > soft.pressure);
  assert.ok(hard.lastDecision.d > soft.lastDecision.d);
  assert.ok(hard.lastDecision.b > soft.lastDecision.b);
  assert.ok(hard.lastDecision.drop < soft.lastDecision.drop);
});

test("log ring: default cap 256, 300 adaptive decides keep the newest 256", () => {
  const d = dir();
  for (let w = 3; w <= 302; w++) d.decideForWave(w, ctxOf(0.5));
  assert.equal(d.log.length, D.logCap);
  assert.equal(d.log[0].wave, 47);
  assert.equal(d.log[d.log.length - 1].wave, 302);
});

test("log ring: custom logCap honored", () => {
  const d = dir({ logCap: 4 });
  for (let w = 3; w <= 12; w++) d.decideForWave(w, ctxOf(0.5));
  assert.equal(d.log.length, 4);
  assert.equal(d.log[0].wave, 9);
  assert.equal(d.log[3].wave, 12);
});

test("partial band override merges per key (density.min only)", () => {
  const d = dir({ density: { min: 0.5 } });
  assert.equal(d.cfg.density.min, 0.5);
  assert.equal(d.cfg.density.max, D.density.max);
  assert.equal(d.cfg.bullet.min, D.bullet.min);
});

test("reset(): pressure to start, log drained, lastDecision null, fresh run ready", () => {
  const d = dir();
  d.onEvent("hit", { lives: 0 });
  d.decideForWave(3, ctxOf(0.5));
  d.decideForWave(4, ctxOf(1));
  d.reset();
  assert.ok(close(d.pressure, D.pressureStart));
  assert.equal(d.log.length, 0);
  assert.equal(d.lastDecision, null);
  assert.equal(d.loadEMA, 0);
  const dec = d.decideForWave(3, ctxOf(0.5));
  assert.equal(dec.reason, "hold");
  assert.ok(close(dec.p, D.pressureStart));
});

test("onEvent: unknown types ignored, bare hit safe, never throws", () => {
  const d = dir();
  d.onEvent("kill", { combo: 3 });
  d.onEvent("boss", null);
  d.onEvent("hit"); // no data: still counts the hit, not lethal
  assert.equal(d.hits, 1);
  assert.equal(d.lethals, 0);
});

test("determinism: same pinned-seed sequence -> byte-identical decision logs", () => {
  function run(seed) {
    const d = dir();
    const rng = new RNG(seed);
    for (let w = 3; w <= 52; w++) {
      for (let i = 0; i < 60; i++) d.sample(DT, rng.range(0, 1));
      if (rng.chance(0.15)) d.onEvent("hit", { lives: rng.int(0, 2) });
      d.decideForWave(w, ctxOf(rng.range(0, 1)));
    }
    return JSON.stringify(d.log);
  }
  assert.equal(run(32802), run(32802));
  assert.notEqual(run(32803), run(32802)); // sanity: the log actually varies
});

test("null performance defaults to 0.5 (hold, all outputs finite)", () => {
  const d = dir();
  const dec = d.decideForWave(3, {});
  assert.equal(dec.reason, "hold");
  assert.ok(Number.isFinite(dec.d));
  assert.ok(Number.isFinite(dec.b));
  assert.ok(Number.isFinite(dec.drop));
});