// ST-117: homing drones - fast seekers (seek + wobble), 1 hit, wave 8+, score
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { DroneField } from '../src/core/drones.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** Start a world and advance the wave director to wave (one step past intermission). */
function startWave(w, wave) {
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = wave - 1;
  w.step(DT, NEUTRAL);
  assert.equal(w.waves.wave, wave, 'director on wave ' + wave);
}

test('drones: config sanity', () => {
  const d = CONFIG.drone;
  assert.equal(d.firstWave, 8, 'drone gate is wave 8');
  assert.ok(d.firstWave > CONFIG.mine.firstWave, 'later than mines');
  assert.ok(d.speed < CONFIG.ship.maxSpeed, 'always dodgeable');
  assert.ok(d.speed > CONFIG.mine.speed, 'faster than mines');
  assert.ok(d.turn > 0 && d.turn < 5, 'turn sane');
  assert.ok(d.radius > 0 && d.score > CONFIG.mine.score, 'radius/score');
  assert.ok(d.maxConcurrent >= 4, 'maxConcurrent');
  assert.ok(d.wobbleAmp > 0 && d.wobbleFreq > 0, 'wobble params');
});

test('drones: none before wave 8, one per eligible wave', () => {
  const w = new World(new RNG(61));
  w.begin();
  w.spawnDronesForWave(7);
  assert.equal(w.drones.count, 0, 'no drones at wave 7');
  w.spawnDronesForWave(8);
  assert.equal(w.drones.count, 1, 'one drone at wave 8');
  w.spawnDronesForWave(9);
  assert.equal(w.drones.count, 2, 'cumulative at wave 9');
  const w2 = new World(new RNG(61));
  startWave(w2, 8);
  assert.equal(w2.drones.count, 1, 'director start at wave 8 spawns a drone');
});

test('drones: homing seeks the ship, stays near the pursuit line', () => {
  const w = new World(new RNG(62));
  w.begin();
  const dr = w.drones.spawn();
  dr.pos.x = 10; dr.pos.y = 0;
  const h0 = (150 * Math.PI) / 180;
  dr.vel.x = Math.cos(h0) * CONFIG.drone.speed;
  dr.vel.y = Math.sin(h0) * CONFIG.drone.speed;
  dr.wobblePhase = 0;
  const d0 = Math.hypot(dr.pos.x, dr.pos.y);
  for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
  const d1 = Math.hypot(dr.pos.x, dr.pos.y);
  const toShip = Math.atan2(-dr.pos.y, -dr.pos.x);
  const velAng = Math.atan2(dr.vel.y, dr.vel.x);
  let da = Math.abs(velAng - toShip) % (2 * Math.PI);
  if (da > Math.PI) da = 2 * Math.PI - da;
  assert.ok(d1 < d0, 'approaches the ship');
  assert.ok(da < CONFIG.drone.wobbleAmp + 0.5, 'heading stays near the ship (seek)');
});

test('drones: wobble strafes around the pursuit line', () => {
  const field = new DroneField(new RNG(62));
  const dr = field.spawn({ x: 0, y: 0 });
  const angs = [];
  for (let i = 0; i < 240; i++) {
    field.step(DT, { x: 0, y: 0 });
    if (i < 60) continue;
    const toShip = Math.atan2(-dr.pos.y, -dr.pos.x);
    const velAng = Math.atan2(dr.vel.y, dr.vel.x);
    let a = velAng - toShip;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    angs.push(a);
  }
  const mn = Math.min(...angs), mx = Math.max(...angs);
  assert.ok(mx - mn > CONFIG.drone.wobbleAmp * 0.5, 'heading oscillates (wobble active)');
});

test('drones: bullet kill pays score, feeds combo, emits explode', () => {
  const w = new World(new RNG(63));
  w.begin();
  const dr = w.drones.spawn();
  dr.pos.x = 10; dr.pos.y = 0;
  w.weapons.bullets.push({ id: 99999, pos: { x: 10, y: 0 }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'drone', 'drone kill');
  assert.equal(kill.data.drone, true, 'drone flag');
  assert.equal(kill.data.points, CONFIG.drone.score, 'points');
  assert.ok(evs.find(e => e.type === 'droneExplode'), 'explode event');
  assert.equal(w.drones.count, 0, 'drone gone');
  assert.equal(w.score, CONFIG.drone.score, 'score');
  assert.equal(w.scoreKeeper.combo, 1, 'feeds the combo');
});

test('drones: touching the ship costs a life and destroys the drone', () => {
  const w = new World(new RNG(63));
  w.begin();
  const dr = w.drones.spawn();
  dr.pos.x = 1.0; dr.pos.y = 0;
  dr.vel.x = 0; dr.vel.y = 0;
  const livesBefore = w.lives;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.lives, livesBefore - 1, 'life lost');
  assert.ok(w.ship.isInvulnerable, 'invuln granted');
  assert.equal(w.drones.count, 0, 'drone destroyed');
  assert.ok(evs.find(e => e.type === 'hit'), 'hit event');
  assert.ok(evs.find(e => e.type === 'droneExplode'), 'explode event');
});

test('drones: deterministic trajectory for a pinned seed', () => {
  const run = () => {
    const w = new World(new RNG(63));
    startWave(w, 8);
    w.livesMgr.count = 999;
    for (let i = 0; i < 120; i++) w.step(DT, NEUTRAL);
    return w.drones.drones.map(d => [+d.pos.x.toFixed(3), +d.pos.y.toFixed(3)]);
  };
  assert.deepEqual(run(), run());
});

test('drones: maxConcurrent cap', () => {
  const w = new World(new RNG(64));
  w.begin();
  for (let i = 0; i < CONFIG.drone.maxConcurrent; i++) w.drones.spawn();
  assert.equal(w.drones.count, CONFIG.drone.maxConcurrent, 'at cap');
  assert.equal(w.drones.spawn(), null, 'over cap returns null');
});
