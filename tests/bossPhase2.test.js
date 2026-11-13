// Boss phase 2 (enrage) coverage - two layers:
//   ST-133 (I133): the Monolith mechanism - one-way transition below 50% HP,
//     phase-2 step multipliers, and the World 'bossPhase2' emit gate.
//   ST-217 (I217): the juice seam - CONFIG.fx.hitStop.bossPhase2 inside the
//     30-50 ms research window below bomb/bossDeath, plus World-level emit
//     behavior via full steps (Monolith + Splicer variant, no re-emit,
//     full-HP silence, re-arm on a fresh boss).
// Pure-logic, seeded, no DOM, no three.js.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { Monolith } from "../src/core/boss.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2Len } from "../src/core/math.js";

const P = { x: 0, y: 0 };

test("config: boss.phase2 shape and values", () => {
  const p2 = CONFIG.boss.phase2;
  assert.equal(p2.hpFrac, 0.5);
  assert.equal(p2.speedMult, 1.3); // I325/ST-301: was 1.45
  assert.equal(p2.turnMult, 1.4);
  assert.equal(p2.spin, 1.6);
  assert.equal(p2.ringEveryMult, 0.6);
});

test("boss starts in phase 1", () => {
  const b = new Monolith(new RNG(1), CONFIG, P, 100);
  assert.equal(b.phase, 1);
});

test("boundary: transition exactly below 50%, one-way", () => {
  const b = new Monolith(new RNG(1), CONFIG, P, 100);
  for (let i = 0; i < 49; i++) assert.equal(b.hit(), false); // hp 51 -> frac 0.51
  assert.equal(b.phase, 1);
  assert.equal(b.hit(), false); // hp 50 -> frac 0.5, not < 0.5
  assert.equal(b.phase, 1);
  assert.equal(b.hit(), false); // hp 49 -> frac 0.49
  assert.equal(b.phase, 2);
  for (let i = 0; i < 5; i++) b.hit(); // stays in phase 2 (one-way)
  assert.equal(b.phase, 2);
});

test("killing hit does not transition", () => {
  const b = new Monolith(new RNG(1), CONFIG, P, 2);
  assert.equal(b.hit(), false); // hp 1, frac 0.5 -> no transition
  assert.equal(b.phase, 1);
  assert.equal(b.hit(), true); // the killing blow
  assert.equal(b.alive, false);
  assert.equal(b.phase, 1);
});

test("phase 2 step: speed and spin scale", () => {
  const b = new Monolith(new RNG(1), CONFIG, P);
  const r0 = b.rot;
  b.step(0.016, { x: 10, y: 0 });
  assert.ok(Math.abs(v2Len(b._vel) - CONFIG.boss.speed) < 1e-9);
  assert.ok(Math.abs(b.rot - r0 - 0.3 * 0.016) < 1e-12);
  b.phase = 2;
  const r1 = b.rot;
  b.step(0.016, { x: 10, y: 0 });
  assert.ok(Math.abs(v2Len(b._vel) - CONFIG.boss.speed * CONFIG.boss.phase2.speedMult) < 1e-9); // I325: config-relative (was 1.45)
  assert.ok(Math.abs(b.rot - r1 - 1.6 * 0.016) < 1e-12);
});

test("phase 2 step: turn rate scales (capped branch)", () => {
  const mk = () => {
    const b = new Monolith(new RNG(7), CONFIG, P);
    b._vel = { x: 1.6, y: 0 }; // heading 0
    return b;
  };
  const p1 = mk();
  p1.step(1.0, { x: 0, y: 100 }); // target heading pi/2, both arms capped
  const p2 = mk();
  p2.phase = 2;
  p2.step(1.0, { x: 0, y: 100 });
  const h1 = Math.atan2(p1._vel.y, p1._vel.x);
  const h2 = Math.atan2(p2._vel.y, p2._vel.x);
  assert.ok(Math.abs(h1 - 0.8) < 1e-9);
  assert.ok(Math.abs(h2 - 0.8 * 1.4) < 1e-9);
});

test("phase 2 step: ring interval scales", () => {
  const b = new Monolith(new RNG(1), CONFIG, P);
  b.entered = 1; // ST-135: entrance complete
  b.ringTimer = 0.005;
  assert.equal(b.step(0.016, P), "ring");
  assert.ok(Math.abs(b.ringTimer - (0.005 - 0.016 + CONFIG.boss.ringEvery)) < 1e-12);
  b.phase = 2;
  b.ringTimer = 0.005;
  assert.equal(b.step(0.016, P), "ring");
  assert.ok(Math.abs(b.ringTimer - (0.005 - 0.016 + CONFIG.boss.ringEvery * 0.6)) < 1e-12);
});

test("world: bossPhase2 emitted exactly once at the threshold", () => {
  const w = new World(new RNG(42), CONFIG);
  w.begin();
  w.spawnBossForWave(5); // bossHpForWave(5) = 64 (below hpFirstWave 10) - I325/ST-301: was 40
  const boss = w.boss;
  assert.ok(boss);
  assert.equal(boss.maxHp, 64); // I325/ST-301: was 40
  let n = 0;
  const hitBoss = () => {
    w.weapons.bullets.push({ id: "t" + n++, pos: { x: boss.pos.x, y: boss.pos.y }, radius: 2, dead: false });
    w.resolveBulletBoss();
  };
  const phaseEvents = () => w.drainEvents().filter((e) => e.type === "bossPhase2");
  const half = Math.floor(boss.maxHp / 2); // I325: threshold-relative (was hardcoded @ maxHp 40)
  for (let i = 0; i < boss.maxHp - half - 1; i++) hitBoss(); // hp = half + 1 -> frac > 0.5
  assert.equal(boss.phase, 1);
  assert.equal(phaseEvents().length, 0);
  hitBoss(); // hp = half -> frac exactly 0.5, not < 0.5
  assert.equal(boss.phase, 1);
  assert.equal(phaseEvents().length, 0);
  hitBoss(); // hp = half - 1 -> frac < 0.5 -> phase 2
  assert.equal(boss.phase, 2);
  const evs = phaseEvents();
  assert.equal(evs.length, 1);
  assert.ok(Math.abs(evs[0].data.hpFrac - (half - 1) / boss.maxHp) < 1e-9);
  assert.ok(Math.abs(evs[0].data.pos.x - boss.pos.x) < 1e-9);
  assert.ok(Math.abs(evs[0].data.pos.y - boss.pos.y) < 1e-9);
  for (let i = 0; i < 3; i++) hitBoss(); // no duplicate events
  assert.equal(phaseEvents().length, 0);
  for (let i = 0; i < half - 1; i++) hitBoss(); // hp half-1 -> 0 -> kill (I325: was 16 @ maxHp 40)
  assert.equal(boss.alive, false);
  const death = w.drainEvents();
  assert.equal(death.filter((e) => e.type === "bossDeath").length, 1);
  assert.equal(death.filter((e) => e.type === "bossPhase2").length, 0);
});

// --- ST-217: juice-config window + World emit behavior through full steps ---

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** A world parked in intermission (no wave content) with a fresh boss. */
function worldWithBoss(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.spawnBossForWave(5);
  w.boss.entered = 1; // skip the entrance (mechanism tests)
  w.step(DT, NEUTRAL); // settle one step (drains the bossSpawn event; the boss holds position)
  w.drainEvents();
  assert.ok(w.boss, 'boss spawned');
  return w;
}

/** One damaging bullet at the boss; returns the drained events of that step. */
function hitBoss(w, id) {
  const boss = w.boss;
  w.weapons.bullets.push({ id, pos: { x: boss.pos.x, y: boss.pos.y }, vel: { x: 0, y: 0 }, life: 1, radius: 0.18, dead: false });
  w.step(DT, NEUTRAL);
  return w.drainEvents();
}

function phase2Count(evs) {
  return evs.filter((e) => e.type === 'bossPhase2').length;
}

function dropTo40(w) {
  w.boss.hp = Math.max(1, w.boss.maxHp - Math.ceil(w.boss.maxHp * 0.6));
}

test('config: hitStop.bossPhase2 is in the 30-50 ms window and below bomb/bossDeath', () => {
  const v = CONFIG.fx.hitStop.bossPhase2;
  assert.ok(v >= 0.03 && v <= 0.05, 'outside the 30-50 ms research window: ' + v);
  assert.ok(v < CONFIG.fx.hitStop.bomb, 'phase-2 freeze must be shorter than bomb');
  assert.ok(v < CONFIG.fx.hitStop.bossDeath, 'phase-2 freeze must be shorter than boss death');
});

test('world: enrage emits bossPhase2 exactly once, with pos + hpFrac (seed 61)', () => {
  const w = worldWithBoss(61);
  dropTo40(w);
  const evs = hitBoss(w, 99001);
  const p2 = evs.filter((e) => e.type === 'bossPhase2');
  assert.equal(p2.length, 1, 'expected exactly one bossPhase2, got ' + p2.length);
  assert.ok(isFinite(p2[0].data.pos.x) && isFinite(p2[0].data.pos.y), 'pos must be finite');
  assert.equal(p2[0].data.hpFrac, w.boss.hpFrac, 'payload hpFrac must match the boss after the hit');
  assert.equal(w.boss.phase, 2, 'boss must be in phase 2');
});

test('world: staying enraged does not re-emit (seed 62)', () => {
  const w = worldWithBoss(62);
  dropTo40(w);
  let total = phase2Count(hitBoss(w, 99101));
  assert.equal(total, 1);
  for (let i = 0; i < 60; i++) {
    dropTo40(w); // keep it alive + enraged across the whole loop
    total += phase2Count(hitBoss(w, 99200 + i));
  }
  assert.equal(total, 1, 're-emitted while still enraged: ' + total);
});

test('world: full-HP hits never emit (seed 63)', () => {
  const w = worldWithBoss(63);
  let total = 0;
  for (let i = 0; i < 5; i++) total += phase2Count(hitBoss(w, 99300 + i));
  assert.equal(total, 0, 'emitted above the threshold: ' + total);
  assert.equal(w.boss.phase, 1, 'boss must still be phase 1');
});

test('world: a fresh boss re-arms the announce (seed 64)', () => {
  const w = worldWithBoss(64);
  const first = w.boss;
  dropTo40(w);
  let total = phase2Count(hitBoss(w, 99401));
  assert.equal(total, 1);
  // Kill the first boss - one bullet per step (the safe pattern from the I133 test).
  for (let i = 0; i < first.maxHp + 2 && w.boss; i++) hitBoss(w, 99500 + i);
  assert.equal(w.boss, null, 'first boss must be dead');
  w.spawnBossForWave(10);
  const second = w.boss;
  assert.ok(second && second !== first, 'second boss spawned');
  assert.equal(w._bossPhaseEmitted, false, 'fresh boss must reset the enrage flag');
  dropTo40(w);
  total += phase2Count(hitBoss(w, 99601));
  assert.equal(total, 2, 'second boss must announce once: ' + total);
});

test('world: Splicer variant enrages through the same single emit (seed 65)', () => {
  const w = new World(new RNG(65));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.bossSpawnCount = 1; // force the Splicer variant
  w.spawnBossForWave(5);
  assert.ok(w.boss, 'splicer spawned');
  assert.equal(w.boss.kind, 'splicer');
  w.boss.entered = 1; // ST-143: with the entrance forced complete the orbit snaps to the hold radius on the next step
  w.step(DT, NEUTRAL); // warm-up: let the snap happen BEFORE placing the hit bullet
  w.drainEvents();
  dropTo40(w);
  const total = phase2Count(hitBoss(w, 99701));
  assert.equal(total, 1, 'splicer must announce exactly once: ' + total);
});
