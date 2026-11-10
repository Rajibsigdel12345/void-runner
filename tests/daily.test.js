// ST-140: daily seeded run - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { fnv1a, dailyKey, dailySeed, dailyRng, dailyForDate } from "../src/core/daily.js";
import { RNG } from "../src/core/rng.js";
import { World } from "../src/core/game.js";

const DT = 1 / 60;
const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };

test("config: daily block shape", () => {
  assert.equal(typeof CONFIG.daily.salt, "string");
  assert.ok(CONFIG.daily.salt.length > 0, "salt is non-empty");
});

test("fnv1a returns a stable unsigned 32-bit int", () => {
  const h = fnv1a("void-runner:2026-11-10");
  assert.ok(Number.isInteger(h) && h >= 0 && h < 0x100000000, "unsigned 32-bit");
  assert.equal(fnv1a("void-runner:2026-11-10"), h, "deterministic");
  assert.notEqual(fnv1a("void-runner:2026-11-10"), fnv1a("void-runner:2026-11-11"), "input-sensitive");
});

test("dailyKey zero-pads month and day", () => {
  assert.equal(dailyKey(2026, 1, 5), "2026-01-05");
  assert.equal(dailyKey(2026, 11, 10), "2026-11-10");
  assert.equal(dailyKey(2026, 12, 31), "2026-12-31");
});

test("dailySeed is a valid 32-bit unsigned int", () => {
  const s = dailySeed(2026, 11, 10);
  assert.ok(Number.isInteger(s) && s >= 0 && s < 0x100000000, "within range");
});

test("dailySeed is deterministic (same day -> same seed, every call)", () => {
  const a = dailySeed(2026, 11, 10);
  for (let i = 0; i < 5; i++) assert.equal(dailySeed(2026, 11, 10), a, "stable across calls");
});

test("different days -> different seeds (spread sample)", () => {
  const dates = [[2026,11,1],[2026,11,2],[2026,11,3],[2026,10,10],[2026,12,25],[2025,11,10],[2027,11,10]];
  const seeds = new Set(dates.map(d => dailySeed(d[0], d[1], d[2])));
  assert.equal(seeds.size, dates.length, "all sampled days map to distinct seeds");
});

test("salt namespaces the seed (same day, different salt -> different seed)", () => {
  assert.notEqual(dailySeed(2026, 11, 10, "daily"), dailySeed(2026, 11, 10, "other"), "different salt differs");
  assert.equal(dailySeed(2026, 11, 10, CONFIG.daily.salt), dailySeed(2026, 11, 10), "config salt == default 'daily'");
});

test("dailyForDate uses the local calendar day (1-based month)", () => {
  const r = dailyForDate(new Date(2026, 10, 10)); // JS month index 10 == November
  assert.equal(r.key, "2026-11-10");
  assert.equal(r.seed, dailySeed(2026, 11, 10), "matches the pure path");
});

test("dailyRng streams identically for the same day", () => {
  const a = dailyRng(2026, 11, 10), b = dailyRng(2026, 11, 10);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next(), "identical stream");
});

test("reproducibility: same daily seed -> bit-identical early run (World)", () => {
  const s = dailySeed(2026, 11, 10);
  function run() {
    const w = new World(new RNG(s), CONFIG);
    w.begin();
    const snap = [];
    for (let i = 0; i < 400; i++) {
      w.step(DT, NEUTRAL);
      if (i === 60 || i === 180 || i === 399) {
        snap.push(w.field.rocks.map(r => [Math.round(r.pos.x*1000)/1000, Math.round(r.pos.y*1000)/1000, Math.round(r.vel.x*1000)/1000, Math.round(r.vel.y*1000)/1000]));
      }
    }
    return snap;
  }
  const a = run(), b = run();
  assert.equal(a[2].length, b[2].length, "same rock count at t=6.6s");
  assert.deepEqual(a, b, "bit-identical early run from the same daily seed");
});
