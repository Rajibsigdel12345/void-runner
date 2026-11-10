// ST-143: the Splicer (boss variant 2) - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { Splicer, splicerHpForWave } from "../src/core/splicer.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2, v2Len } from "../src/core/math.js";

function freshSplicer() { return new Splicer(new RNG(1), CONFIG, v2(10, 0)); }

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  return w;
}

function drainToDeath(w) {
  for (let i = 0; i <= w.boss.maxHp; i++) {
    w.weapons.bullets.push({ id: 8000 + i, pos: { x: w.boss.pos.x, y: w.boss.pos.y }, radius: 5, dead: false });
  }
  w.resolveBulletBoss();
}

test("config: splicer block shape and values", () => {
  const s = CONFIG.splicer;
  assert.equal(s.maxHp, 30);
  assert.equal(s.radius, 2.6);
  assert.equal(s.score, 600);
  assert.equal(s.splitCount, 2);
  assert.equal(s.splitSize, "M");
  assert.ok(s.arms >= 1, "at least one spiral arm");
  assert.ok(s.holdRadius > 0 && s.holdRadius < CONFIG.arena.radius, "orbit radius inside the arena");
  assert.ok(s.boltSpeed < CONFIG.ship.maxSpeed, "spiral bolts slower than the ship - dodgeable");
  assert.ok(s.score > CONFIG.warden.score && s.score < CONFIG.boss.score, "score sits between the warden and the Monolith");
});

test("splicerHpForWave: base before the threshold, scaled per boss wave, capped", () => {
  const s = CONFIG.splicer;
  assert.equal(splicerHpForWave(CONFIG, 5), s.maxHp, "no scale before hpFirstWave");
  assert.ok(splicerHpForWave(CONFIG, s.hpFirstWave + CONFIG.boss.everyWave) > s.maxHp, "scales after the threshold");
  assert.equal(splicerHpForWave(CONFIG, 500), s.hpCap, "capped at hpCap");
});

test("orbit: the Splicer glides from its spawn radius to the hold radius and stays", () => {
  const s = new Splicer(new RNG(1), CONFIG, v2(20, 0)); // spawn near the rim
  assert.ok(Math.abs(v2Len(s.pos) - 20) < 1e-6, "starts at the spawn radius (no teleport on spawn)");
  s.step(0.016);
  assert.ok(Math.abs(v2Len(s.pos) - 20) < 0.2, "only a small inward glide after one frame (no teleport)");
  for (let i = 0; i < Math.ceil(CONFIG.splicer.enterTime / 0.016) + 40; i++) s.step(0.016);
  assert.ok(Math.abs(v2Len(s.pos) - CONFIG.splicer.holdRadius) < 1e-6, "settles at the hold radius");
  for (let i = 0; i < 60; i++) s.step(0.016);
  assert.ok(Math.abs(v2Len(s.pos) - CONFIG.splicer.holdRadius) < 1e-6, "stays at the hold radius (pure orbit)");
});

test("spiral: no bolts queue before the entrance finishes", () => {
  const s = freshSplicer();
  s.step(0.05); // well under enterTime
  assert.ok(s.entered < 1, "still in the entrance");
  assert.equal(s.drainBolts(), null, "no spiral bolts during the entrance");
});

test("spiral: after the entrance, a shot queues one unit-length bolt per arm", () => {
  const s = freshSplicer();
  for (let i = 0; i < Math.ceil(CONFIG.splicer.enterTime / 0.05) + 3; i++) s.step(0.05);
  s.step(CONFIG.splicer.spiralEvery + 0.02); // force exactly one shot
  const bolts = s.drainBolts();
  assert.ok(bolts, "a spiral shot queued");
  assert.equal(bolts.length, CONFIG.splicer.arms, "one bolt per arm per shot");
  for (const b of bolts) assert.ok(Math.abs(Math.hypot(b.x, b.y) - 1) < 1e-9, "unit-length direction");
});

test("spiral: the two arms fire opposite directions (PI apart)", () => {
  assert.equal(CONFIG.splicer.arms, 2, "this check assumes two arms");
  const s = freshSplicer();
  for (let i = 0; i < Math.ceil(CONFIG.splicer.enterTime / 0.05) + 3; i++) s.step(0.05);
  s.step(CONFIG.splicer.spiralEvery + 0.02);
  const bolts = s.drainBolts();
  assert.equal(bolts.length, 2);
  const a = Math.atan2(bolts[0].y, bolts[0].x);
  const b = Math.atan2(bolts[1].y, bolts[1].x);
  let diff = Math.abs(a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  assert.ok(Math.abs(diff - Math.PI) < 1e-6, "the two arms are opposite");
});

test("hit model: 1 damage per hit, enrage below the HP threshold, kill on the last", () => {
  const s = freshSplicer();
  assert.equal(s.phase, 1);
  const threshold = Math.ceil(s.maxHp * CONFIG.splicer.phase2.hpFrac);
  for (let i = 0; i < s.maxHp - threshold; i++) assert.equal(s.hit(), false, "no kill yet");
  assert.equal(s.phase, 1, "not enraged while at/above the threshold");
  assert.equal(s.hit(), false, "one more hit, still alive");
  assert.equal(s.phase, 2, "enrages once HP drops below the threshold");
  while (s.alive) s.hit();
  assert.equal(s.alive, false, "killed");
  assert.equal(s.hp, 0);
  assert.equal(s.hit(), false, "a dead Splicer ignores further hits");
});

test("drainBolts returns null when nothing is queued", () => {
  const s = freshSplicer();
  assert.equal(s.drainBolts(), null);
});

test("world: spawnBossForWave alternates Monolith then Splicer by spawn count", () => {
  const w = freshWorld(21);
  w.spawnBossForWave(5);
  assert.ok(w.boss);
  assert.equal(w.boss.kind, "monolith", "first boss is the Monolith");
  assert.equal(w.drainEvents().find((e) => e.type === "bossSpawn").data.kind, "monolith");
  w.boss = null; // the Monolith cleared before the next boss wave
  w.spawnBossForWave(10);
  assert.ok(w.boss);
  assert.equal(w.boss.kind, "splicer", "second boss is the Splicer");
  assert.equal(w.drainEvents().find((e) => e.type === "bossSpawn").data.kind, "splicer");
});

test("world: the Splicer's spiral bolts enter the enemyBullets pool at boltSpeed", () => {
  const w = freshWorld(22);
  w.boss = new Splicer(new RNG(3), CONFIG, v2(10, 0), 30);
  w.boss.entered = 1;
  const c0 = w.enemyBullets.count;
  const span = CONFIG.splicer.spiralEvery * 2 + 0.1;
  for (let i = 0; i < Math.ceil(span / 0.016); i++) {
    w.boss.step(0.016);
    const bolts = w.boss.drainBolts();
    if (bolts) w.bossSpiralBolts(bolts);
  }
  assert.ok(w.enemyBullets.count > c0, "spiral bolts added to the enemy pool");
  for (const b of w.enemyBullets.bullets) {
    assert.ok(Math.abs(Math.hypot(b.vel.x, b.vel.y) - CONFIG.splicer.boltSpeed) < 1e-6, "spiral bolt speed");
  }
});

test("world: killing the Splicer pays its own score and splits M rocks", () => {
  const w = freshWorld(23);
  w.boss = new Splicer(new RNG(4), CONFIG, v2(10, 0), 12); // low HP to keep the drain short
  const m0 = w.field.rocks.filter((r) => !r.dead && r.size === "M").length;
  const score0 = w.score;
  drainToDeath(w);
  const evs = w.drainEvents();
  const bd = evs.find((e) => e.type === "bossDeath");
  assert.ok(bd, "bossDeath event");
  assert.equal(bd.data.kind, "splicer", "bossDeath carries the variant kind");
  const kill = evs.find((e) => e.type === "kill");
  assert.equal(kill.data.kind, "splicer");
  assert.ok(kill.data.points >= CONFIG.splicer.score, "pays the Splicer score");
  assert.ok(w.score > score0, "score increased");
  const m1 = w.field.rocks.filter((r) => !r.dead && r.size === "M").length;
  assert.equal(m1 - m0, CONFIG.splicer.splitCount, "split M rocks spawned");
});
