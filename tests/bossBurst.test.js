// ST-134: boss radial burst pattern - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { bossBurstVectors } from "../src/core/boss.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const TAU = Math.PI * 2;

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  w.spawnBossForWave(5);
  w.boss.ringTimer = 100; // suppress ring bursts
  w.bossFireTimer = 100; // suppress aimed bolts
  return w;
}

test("config: boss.burst shape and values", () => {
  const b = CONFIG.boss.burst;
  assert.equal(b.every, 4.0);
  assert.equal(b.count, 12);
  assert.equal(b.speed, 7.0);
  assert.equal(b.offsetSpin, 0.45);
  assert.equal(b.everyMult, 0.65);
});

test("burst geometry: count, speed, even spacing", () => {
  const vecs = bossBurstVectors(CONFIG, 0);
  assert.equal(vecs.length, CONFIG.boss.burst.count);
  for (let i = 0; i < vecs.length; i++) {
    const ex = Math.cos((i / 12) * TAU) * 7.0;
    const ey = Math.sin((i / 12) * TAU) * 7.0;
    assert.ok(Math.abs(vecs[i].x - ex) < 1e-12, "x at " + i);
    assert.ok(Math.abs(vecs[i].y - ey) < 1e-12, "y at " + i);
  }
});

test("burst geometry: offset rotates the volley (spiral)", () => {
  const v0 = bossBurstVectors(CONFIG, 0);
  const v1 = bossBurstVectors(CONFIG, 0.45);
  for (const i of [0, 5, 11]) {
    const ex = Math.cos(0.45 + (i / 12) * TAU) * 7.0;
    const ey = Math.sin(0.45 + (i / 12) * TAU) * 7.0;
    assert.ok(Math.abs(v1[i].x - ex) < 1e-12, "x at " + i);
    assert.ok(Math.abs(v1[i].y - ey) < 1e-12, "y at " + i);
  }
  const v2 = bossBurstVectors(CONFIG, TAU); // full circle returns to start
  for (let i = 0; i < 12; i++) {
    assert.ok(Math.abs(v2[i].x - v0[i].x) < 1e-12);
    assert.ok(Math.abs(v2[i].y - v0[i].y) < 1e-12);
  }
});

test("burst geometry: deterministic (no rng draws)", () => {
  const a = bossBurstVectors(CONFIG, 0.9);
  const b = bossBurstVectors(CONFIG, 0.9);
  assert.deepEqual(b, a);
});

test("world: burst fires on timer, 12 bolts, refills to every", () => {
  const w = freshWorld(7);
  w.bossBurstTimer = 0.0001;
  w.step(0.016, NEUTRAL);
  const evs = w.drainEvents().filter((e) => e.type === "bossBurst");
  assert.equal(evs.length, 1);
  assert.equal(evs[0].data.fired, 12);
  assert.equal(w.enemyBullets.bullets.length, 12);
  assert.ok(Math.abs(w.bossBurstTimer - (0.0001 - 0.016 + CONFIG.boss.burst.every)) < 1e-9); // subtract-then-refill keeps the overshoot
  assert.equal(w.bossBursts, 1);
});

test("world: phase 2 burst refills at the reduced cadence", () => {
  const w = freshWorld(8);
  w.boss.phase = 2;
  w.bossBurstTimer = 0.0001;
  w.step(0.016, NEUTRAL);
  assert.equal(w.drainEvents().filter((e) => e.type === "bossBurst").length, 1);
  assert.ok(Math.abs(w.bossBurstTimer - (0.0001 - 0.016 + CONFIG.boss.burst.every * CONFIG.boss.burst.everyMult)) < 1e-9);
});

test("world: second volley is rotated by offsetSpin", () => {
  const w = freshWorld(9);
  w.bossBurstTimer = 0.0001;
  w.step(0.016, NEUTRAL);
  w.drainEvents();
  w.enemyBullets.bullets.length = 0; // clear volley 1 so volley 2 is unambiguous
  w.bossBurstTimer = 0.0001;
  w.step(0.016, NEUTRAL);
  w.drainEvents();
  const first = w.enemyBullets.bullets[0];
  const a = Math.atan2(first.vel.y, first.vel.x);
  assert.ok(Math.abs(a - CONFIG.boss.burst.offsetSpin) < 1e-9);
});
