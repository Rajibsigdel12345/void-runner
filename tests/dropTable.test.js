// ST-130: power-up drop table + lifetime tests. I130 rebalanced the drop pool:
// (1) a weighted 7-type table replaces the uniform 1/7 roll, (2) abandoned drops
// now expire (dropLife) so a single uncollected drop can no longer clog the
// maxActiveDrops=1 pool forever (playtest data: realized rate 1.0% vs nominal 25%).
import test from "node:test";
import assert from "node:assert/strict";
import { PowerUpField, POWERUP_TYPES } from "../src/core/powerups.js";
import { RNG } from "../src/core/rng.js";
import { CONFIG } from "../src/core/config.js";
import { v2 } from "../src/core/math.js";

const DT = 1 / 60;
const FAR = { pos: v2(100, 100) }; // outside the arena: no pickup, no magnet

test("drop table: config weights cover all 7 types, positive integers, sum 100", () => {
  const w = CONFIG.powerup.weights;
  assert.equal(Object.keys(w).length, 7);
  let sum = 0;
  for (const t of POWERUP_TYPES) {
    assert.ok(Number.isInteger(w[t]) && w[t] > 0, t + " weight must be a positive integer");
    sum += w[t];
  }
  assert.equal(sum, 100, "weights sum to 100 (percentages)");
});

test("drop table: deterministic type sequence for a fixed seed", () => {
  const cfg = { ...CONFIG, powerup: { ...CONFIG.powerup, dropChance: 1, maxActiveDrops: 100000 } };
  const seq = (seed) => {
    const f = new PowerUpField(new RNG(seed), cfg);
    const out = [];
    for (let i = 0; i < 50; i++) out.push(f.maybeDrop(v2(0, 0)).type);
    return out;
  };
  assert.deepEqual(seq(1234), seq(1234), "same seed -> same sequence");
  assert.notDeepEqual(seq(1234), seq(1235), "different seed -> different sequence");
});

test("drop table: distribution tracks the weights (20k draws)", () => {
  const cfg = { ...CONFIG, powerup: { ...CONFIG.powerup, dropChance: 1, maxActiveDrops: 100000 } };
  const f = new PowerUpField(new RNG(42), cfg);
  const counts = {};
  const N = 20000;
  for (let i = 0; i < N; i++) {
    const t = f.maybeDrop(v2(0, 0)).type;
    counts[t] = (counts[t] || 0) + 1;
  }
  for (const t of POWERUP_TYPES) {
    const share = (counts[t] || 0) / N;
    const expected = CONFIG.powerup.weights[t] / 100;
    assert.ok(Math.abs(share - expected) < 0.02, t + " share " + share.toFixed(3) + " vs expected " + expected);
  }
});

test("drop table: a zero-weight type never rolls and the rest rescale", () => {
  const cfg = {
    ...CONFIG,
    powerup: { ...CONFIG.powerup, dropChance: 1, maxActiveDrops: 100000, weights: { ...CONFIG.powerup.weights, slowmo: 0 } },
  };
  const f = new PowerUpField(new RNG(7), cfg);
  let sawOther = false;
  for (let i = 0; i < 3000; i++) {
    const t = f.maybeDrop(v2(0, 0)).type;
    assert.notEqual(t, "slowmo", "slowmo has zero weight");
    if (t !== "slowmo") sawOther = true;
  }
  assert.ok(sawOther, "other types still roll");
});

test("drop lifetime: expires exactly at dropLife and frees the pool", () => {
  const cfg = { ...CONFIG, powerup: { ...CONFIG.powerup, dropChance: 1, drift: 0 } };
  const f = new PowerUpField(new RNG(5), cfg);
  const d = f.maybeDrop(v2(0, 0));
  assert.ok(d);
  const L = CONFIG.powerup.dropLife;
  for (let i = 0; i < Math.ceil(L / DT) - 1; i++) f.step(DT, FAR);
  assert.equal(f.count, 1, "alive just before dropLife");
  f.step(DT, FAR);
  assert.equal(f.count, 0, "expired at dropLife");
  assert.ok(f.maybeDrop(v2(0, 0)), "pool freed after expiry");
});

test("drop lifetime: a pickup before expiry still applies the effect", () => {
  const cfg = { ...CONFIG, powerup: { ...CONFIG.powerup, dropChance: 1, drift: 0 } };
  const f = new PowerUpField(new RNG(6), cfg);
  const d = f.maybeDrop(v2(0, 0));
  const L = CONFIG.powerup.dropLife;
  for (let i = 0; i < Math.ceil(L / DT) - 5; i++) f.step(DT, FAR);
  const ups = f.step(DT, { pos: v2(0, 0) }); // ship on top of the drop
  assert.equal(ups.length, 1, "one pickup");
  assert.equal(f.count, 0);
  const applied = d.type === "bomb" ? f.takeInstant() === "bomb" : f.active(d.type);
  assert.ok(applied, "effect applied on pickup (" + d.type + ")");
});

test("drop cap: a full pool returns null without perturbing the RNG", () => {
  const f = new PowerUpField(new RNG(9), CONFIG);
  while (f.count < 1) f.maybeDrop(v2(0, 0));
  const s1 = f.rng._s;
  assert.equal(f.maybeDrop(v2(0, 0)), null, "null at the cap");
  assert.equal(f.rng._s, s1, "no RNG draws at the cap");
  assert.equal(f.count, 1);
});
