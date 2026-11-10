// ST-135: boss intro banner + entrance - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { Monolith, bossHpForWave } from "../src/core/boss.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2 } from "../src/core/math.js";

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const SHIP = { x: 0, y: 0 };

function freshBoss(hp) { return new Monolith(new RNG(1), CONFIG, v2(0, 0), hp); }

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  w.spawnBossForWave(5);
  w.boss.ringTimer = 100; // suppress ring bursts
  w.bossFireTimer = 100; // suppress aimed bolts
  w.bossBurstTimer = 100; // suppress volleys
  return w;
}

test("config: boss.enterTime is a positive number", () => {
  assert.equal(typeof CONFIG.boss.enterTime, "number");
  assert.ok(CONFIG.boss.enterTime > 0, "enterTime > 0");
});

test("entrance: entered starts at 0 and clamps to exactly 1 at the end", () => {
  const m = freshBoss(40);
  assert.equal(m.entered, 0);
  m.step(0.3, SHIP);
  assert.equal(m.entered, 0.25, "progress is linear in dt");
  m.step(CONFIG.boss.enterTime, SHIP);
  assert.equal(m.entered, 1, "clamps to exactly 1");
});

test("entrance: entered clamps at 1 on overshoot", () => {
  const m = freshBoss(40);
  m.step(5 * CONFIG.boss.enterTime, SHIP);
  assert.equal(m.entered, 1);
});

test("entrance: no ring while entered < 1, even with ringTimer at 0 (timer held)", () => {
  const m = freshBoss(40);
  m.ringTimer = 0;
  const r = m.step(0.5, SHIP); // entered ~0.417
  assert.equal(r, null, "no ring during the entrance");
  assert.equal(m.ringTimer, 0, "ringTimer is held (no decrement, no refill)");
});

test("entrance: a held ring fires immediately once the entrance finishes", () => {
  const m = freshBoss(40);
  m.ringTimer = 0;
  assert.equal(m.step(0.5, SHIP), null, "still inside the entrance");
  assert.equal(m.step(0.5, SHIP), null, "still inside the entrance");
  const r = m.step(0.5, SHIP); // 3 x 0.4167 = 1.25 -> clamps to 1, gate opens
  assert.equal(r, "ring");
  // subtract-then-add refill keeps the overshoot: 0 - 0.5 + 2.0
  assert.ok(Math.abs(m.ringTimer - (CONFIG.boss.ringEvery - 0.5)) < 1e-9);
});

test("entrance: normal ring cadence after the entrance (entered = 1)", () => {
  const m = freshBoss(40);
  m.entered = 1;
  m.ringTimer = 0.5;
  assert.equal(m.step(0.1, SHIP), null, "no ring before the timer runs out");
  const r = m.step(0.4, SHIP); // 0.4 -> 0.0 -> fire
  assert.equal(r, "ring");
  assert.ok(Math.abs(m.ringTimer - CONFIG.boss.ringEvery) < 1e-9);
});

test("world: fire + burst timers do not decrement during the entrance, do after", () => {
  const w = freshWorld(41);
  assert.equal(w.boss.entered, 0);
  w.step(0.016, NEUTRAL);
  assert.ok(w.boss.entered < 1);
  assert.equal(w.bossFireTimer, 100, "fire timer held during entrance");
  assert.equal(w.bossBurstTimer, 100, "burst timer held during entrance");
  for (let i = 0; i < 11; i++) w.step(0.1, NEUTRAL); // 1.1 s elapsed
  assert.ok(w.boss.entered < 1, "still inside the entrance");
  assert.equal(w.bossFireTimer, 100, "fire timer still held");
  assert.equal(w.bossBurstTimer, 100, "burst timer still held");
  w.step(0.1, NEUTRAL); // 1.2 s -> entered clamps to 1, gate opens
  assert.equal(w.boss.entered, 1, "entrance complete");
  assert.equal(w.bossFireTimer, 100 - 0.1, "fire timer now decrementing");
  assert.equal(w.bossBurstTimer, 100 - 0.1, "burst timer now decrementing");
});

test("world: bossSpawn event carries wave + hp (banner inputs)", () => {
  const w = freshWorld(42);
  const evs = w.drainEvents();
  const spawn = evs.find((e) => e.type === "bossSpawn");
  assert.ok(spawn, "bossSpawn event emitted");
  assert.equal(spawn.data.wave, 5);
  assert.equal(spawn.data.hp, bossHpForWave(CONFIG, 5));
  assert.ok(spawn.data.pos && typeof spawn.data.pos.x === "number", "pos still present");
});
