// ST-133: boss phase 2 (enrage) - one-way state below 50% HP. LF, node --test.
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
  assert.equal(p2.speedMult, 1.45);
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
  assert.ok(Math.abs(v2Len(b._vel) - CONFIG.boss.speed * 1.45) < 1e-9);
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
  w.spawnBossForWave(5); // bossHpForWave(5) = 40 (below hpFirstWave 10)
  const boss = w.boss;
  assert.ok(boss);
  assert.equal(boss.maxHp, 40);
  let n = 0;
  const hitBoss = () => {
    w.weapons.bullets.push({ id: "t" + n++, pos: { x: boss.pos.x, y: boss.pos.y }, radius: 2, dead: false });
    w.resolveBulletBoss();
  };
  const phaseEvents = () => w.drainEvents().filter((e) => e.type === "bossPhase2");
  for (let i = 0; i < 19; i++) hitBoss(); // hp 21 -> frac 0.525
  assert.equal(boss.phase, 1);
  assert.equal(phaseEvents().length, 0);
  hitBoss(); // hp 20 -> frac exactly 0.5, not < 0.5
  assert.equal(boss.phase, 1);
  assert.equal(phaseEvents().length, 0);
  hitBoss(); // hp 19 -> frac 0.475 -> phase 2
  assert.equal(boss.phase, 2);
  const evs = phaseEvents();
  assert.equal(evs.length, 1);
  assert.ok(Math.abs(evs[0].data.hpFrac - 19 / 40) < 1e-9);
  assert.ok(Math.abs(evs[0].data.pos.x - boss.pos.x) < 1e-9);
  assert.ok(Math.abs(evs[0].data.pos.y - boss.pos.y) < 1e-9);
  for (let i = 0; i < 3; i++) hitBoss(); // no duplicate events
  assert.equal(phaseEvents().length, 0);
  for (let i = 0; i < 16; i++) hitBoss(); // hp 16 -> kill
  assert.equal(boss.alive, false);
  const death = w.drainEvents();
  assert.equal(death.filter((e) => e.type === "bossDeath").length, 1);
  assert.equal(death.filter((e) => e.type === "bossPhase2").length, 0);
});
