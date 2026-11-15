// ST-055: the Monolith boss - every-5-wave, ring burst, split on death, contact, determinism
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { bossHpForWave } from '../src/core/boss.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** A world parked in intermission (no wave content) with a fresh boss. */
function worldWithBoss(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.spawnBossForWave(5);
  w.boss.entered = 1; // ST-135: skip the entrance (mechanism tests)
  assert.ok(w.boss, 'boss spawned');
  return w;
}

function countRocks(w, size) {
  return w.field.rocks.filter(r => !r.dead && (size ? r.size === size : true)).length;
}

test('boss: config sanity (seed 56)', () => {
  const b = CONFIG.boss;
  assert.ok(b.everyWave >= 4, 'everyWave >= 4');
  assert.ok(b.maxHp >= 20, 'maxHp >= 20');
  assert.ok(b.speed < CONFIG.ship.maxSpeed, 'always dodgeable');
  assert.ok(b.ringCount >= 4 && b.ringCount <= 16, 'ringCount sane');
  assert.ok(b.splitCount > 0, 'splits on death');
  assert.ok(b.score > CONFIG.mine.score, 'headline number beats a mine');
});

test('boss: gating - every 5th wave, one at a time (seed 56)', () => {
  const w = new World(new RNG(56));
  w.begin();
  w.spawnBossForWave(4);
  assert.equal(w.boss, null, 'no boss on wave 4');
  w.spawnBossForWave(5);
  assert.ok(w.boss, 'boss on wave 5');
  const first = w.boss;
  w.spawnBossForWave(5);
  assert.equal(w.boss, first, 'no duplicate on repeat');
  w.spawnBossForWave(10);
  assert.equal(w.boss, first, 'no second boss while one is alive');
});

test('boss: maxHp bullets kill it, pay headline score, split to M rocks (seed 57)', () => {
  const w = worldWithBoss(57);
  const boss = w.boss;
  for (let i = 0; i < CONFIG.boss.maxHp; i++) {
    w.weapons.bullets.push({ id: 90000 + i, pos: { x: boss.pos.x, y: boss.pos.y }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
    w.step(DT, NEUTRAL);
  }
  const evs = w.drainEvents();
  assert.equal(w.boss, null, 'boss dead');
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill && kill.data.boss, 'boss kill event');
  assert.equal(kill.data.points, CONFIG.boss.score, 'headline points (combo x1)');
  assert.ok(evs.find(e => e.type === 'bossDeath'), 'bossDeath event');
  assert.equal(countRocks(w, 'M'), CONFIG.boss.splitCount, 'splits into M rocks');
  assert.equal(w.score, CONFIG.boss.score, 'score');
});

test('boss: ring burst fires radially outward S rocks (seed 57)', () => {
  const w = worldWithBoss(57);
  const before = countRocks(w, 'S');
  const frames = Math.ceil(CONFIG.boss.ringEvery / DT) + 2;
  for (let i = 0; i < frames; i++) w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  const rings = evs.filter(e => e.type === 'bossRing');
  assert.equal(rings.length, 1, 'one ring in the window');
  const after = countRocks(w, 'S');
  assert.equal(after - before, CONFIG.boss.ringCount, 'ringCount S rocks');
  const rp = rings[0].data.pos;
  for (const r of w.field.rocks) {
    if (r.dead || r.size !== 'S') continue;
    assert.ok(r.vel.x * (r.pos.x - rp.x) + r.vel.y * (r.pos.y - rp.y) > 0, 'S rock flies outward from the ring');
  }
});

test('boss: touching it costs a life, the boss survives (seed 58)', () => {
  const w = worldWithBoss(58);
  w.boss.pos.x = 2.5; w.boss.pos.y = 0; w.boss._vel = null; // 3.4 + 0.9 > 2.5 -> contact
  const livesBefore = w.lives;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.lives, livesBefore - 1, 'life lost');
  assert.ok(w.ship.isInvulnerable, 'invuln granted');
  assert.ok(w.boss && w.boss.alive, 'boss survives the graze');
  assert.ok(evs.find(e => e.type === 'hit'), 'hit event');
  assert.ok(!evs.find(e => e.type === 'bossDeath'), 'no death');
});

test('boss: deterministic trajectory for a pinned seed (seed 58)', () => {
  const run = () => {
    const w = worldWithBoss(58);
    w.boss.pos.x = 0; w.boss.pos.y = 20; w.boss._vel = null;
    w.livesMgr.count = 999;
    for (let i = 0; i < 300; i++) w.step(DT, NEUTRAL);
    return [+w.boss.pos.x.toFixed(3), +w.boss.pos.y.toFixed(3), countRocks(w, null)];
  };
  assert.deepEqual(run(), run());
});


// ST-064: the Monolith's HP climbs with the endless arc, capped so it stays beatable.
test('boss: HP-by-wave curve - base, ramp, cap (config)', () => {
  const b = CONFIG.boss;
  assert.equal(bossHpForWave(CONFIG, 5), b.maxHp, 'wave 5 (campaign) = base');
  assert.equal(bossHpForWave(CONFIG, 10), b.maxHp, 'wave 10 (first of the curve) = base');
  assert.equal(bossHpForWave(CONFIG, 15), b.maxHp + b.hpStep, 'wave 15 = base + one step');
  assert.ok(bossHpForWave(CONFIG, 20) > bossHpForWave(CONFIG, 15), 'still rising');
  assert.equal(bossHpForWave(CONFIG, 30), b.hpCap, 'reaches the cap by wave 30');
  assert.equal(bossHpForWave(CONFIG, 60), b.hpCap, 'stays capped far out');
  assert.ok(bossHpForWave(CONFIG, 60) <= 2.5 * b.maxHp, 'cap keeps the fight bounded (<= 2.5x base)');
  assert.ok(bossHpForWave(CONFIG, 100) >= b.maxHp, 'never below the base');
});

test('boss: a wave-15 Monolith is built with scaled HP (seed 59)', () => {
  const w = new World(new RNG(59));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.spawnBossForWave(15);
  assert.ok(w.boss, 'wave-15 boss spawned');
  assert.equal(w.boss.maxHp, bossHpForWave(CONFIG, 15), 'maxHp matches the wave curve');
  assert.equal(w.boss.maxHp, CONFIG.boss.maxHp + CONFIG.boss.hpStep, 'wave 15 = base + step');
});

test('ST-385: fresh boss has no hit-flash (hitFlash 0 at rest)', () => {
  const w = worldWithBoss(385);
  assert.equal(w.boss.hitFlash, 0, 'hitFlash starts at 0');
});

test('ST-385: a boss HP hit spikes the hit-flash to 1', () => {
  const w = worldWithBoss(385);
  const r = w.boss.hit();
  assert.equal(r, false, 'not a killing hit');
  assert.equal(w.boss.hitFlash, 1, 'hitFlash spiked to 1');
});

test('ST-385: the killing boss hit also spikes the hit-flash to 1', () => {
  const w = worldWithBoss(385);
  w.boss.hp = 1; // one hit to kill
  const r = w.boss.hit();
  assert.equal(r, true, 'killing hit');
  assert.equal(w.boss.hitFlash, 1, 'the kill hit still flashes');
});

test('ST-385: the boss hit-flash decays to 0 over time (Math.max floor)', () => {
  const w = worldWithBoss(385);
  w.boss.hitFlash = 1;
  let prev = w.boss.hitFlash;
  const P = { x: 0, y: 0 };
  for (let i = 0; i < 60; i++) {
    w.boss.step(DT, P);
    assert.ok(w.boss.hitFlash <= prev + 1e-9, 'monotone non-increasing');
    prev = w.boss.hitFlash;
  }
  assert.ok(w.boss.hitFlash < 1, 'decayed from 1');
  w.boss.step(1, P);
  assert.equal(w.boss.hitFlash, 0, 'clamped to exactly 0');
});

test('ST-385: the boss hit-flash timeline is deterministic across reseeds', () => {
  const a = worldWithBoss(385).boss;
  const b = worldWithBoss(385).boss;
  const P = { x: 0, y: 0 };
  a.hit(); b.hit();
  assert.equal(a.hitFlash, b.hitFlash, 'same spike');
  assert.equal(a.hitFlash, 1, 'spike was 1');
  for (let i = 0; i < 40; i++) {
    a.step(DT, P); b.step(DT, P);
    assert.equal(a.hitFlash, b.hitFlash, 'identical decay at each step');
  }
});
