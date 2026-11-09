// ST-059: gravity vortex - periodic pull field: no early telegraph, interval
// window, rock/ship pull, phase ordering, durations, rearm (seeds 71-76)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { VortexField } from '../src/core/vortex.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** World with the wave director parked at `wave` (no new waves start). */
function parkedWorld(seed, wave) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.waves.wave = wave;
  w.waves.state = 'intermission';
  w.waves.intermission = 1e6;
  w.field.clear();
  return w;
}

test('vortex: config sanity (seed 71)', () => {
  const v = CONFIG.vortex;
  assert.ok(v.firstWave >= 5, 'engages after the base loop is taught');
  assert.ok(v.intervalMin > 0 && v.intervalMax > v.intervalMin, 'interval band sane');
  assert.ok(v.telegraph > 0 && v.duration > 0, 'phases have duration');
  assert.ok(v.radius < CONFIG.arena.radius, 'disk fits the arena');
  assert.ok(v.pullShip < CONFIG.ship.accel, 'ship can always overpower the pull');
  assert.ok(v.pullRocks > 0 && v.minDistFromShip > 0, 'pull and spawn safety positive');
});

test('vortex: no telegraph before firstWave, then one inside the roll window (seed 72)', () => {
  const w = parkedWorld(72, CONFIG.vortex.firstWave - 1);
  for (let i = 0; i < 30 * 60; i++) w.step(DT, NEUTRAL);
  const early = w.drainEvents().filter(e => e.type === 'vortexTelegraph');
  assert.equal(early.length, 0, 'wave ' + (CONFIG.vortex.firstWave - 1) + ' is below firstWave');
  w.waves.wave = CONFIG.vortex.firstWave;
  let hit = -1;
  for (let i = 0; i < 22 * 60; i++) {
    w.step(DT, NEUTRAL);
    const evs = w.drainEvents();
    if (evs.some(e => e.type === 'vortexTelegraph')) { hit = i + 1; break; }
  }
  assert.ok(hit > 0, 'telegraphed within 22s');
  const lo = CONFIG.vortex.intervalMin * 60, hi = CONFIG.vortex.intervalMax * 60;
  assert.ok(hit >= lo - 2 && hit <= hi + 2, 'first telegraph inside the roll window (step ' + hit + ')');
  const v = w.vortex;
  assert.equal(v.phase, 'telegraph');
  const d = Math.hypot(v.pos.x, v.pos.y);
  const maxD = CONFIG.arena.radius - CONFIG.vortex.radius - 4;
  assert.ok(d <= maxD + 1e-9, 'disk fully inside the arena');
  const shipD = Math.hypot(v.pos.x - w.ship.pos.x, v.pos.y - w.ship.pos.y);
  assert.ok(shipD >= CONFIG.vortex.minDistFromShip - 1e-9, 'spawned away from the ship');
});

test('vortex: pulls rocks inside the radius toward center, none outside (seed 73)', () => {
  const v = new VortexField(new RNG(73), CONFIG);
  v.activateAt(0, 0);
  const inside = { dead: false, pos: { x: 8, y: 0 }, vel: { x: 0, y: 0 } };
  const outside = { dead: false, pos: { x: 20, y: 0 }, vel: { x: 0, y: 0 } };
  const atEdge = { dead: false, pos: { x: CONFIG.vortex.radius, y: 0 }, vel: { x: 0, y: 0 } };
  const deadRock = { dead: true, pos: { x: 4, y: 0 }, vel: { x: 0, y: 0 } };
  v.step(DT, { wave: 9, shipPos: { x: 100, y: 0 }, rocks: [inside, outside, atEdge, deadRock] });
  assert.ok(inside.vel.x < 0 && inside.vel.y === 0, 'pulled toward the center');
  const mag = Math.hypot(inside.vel.x, inside.vel.y);
  assert.ok(Math.abs(mag - CONFIG.vortex.pullRocks * DT) < 1e-9, 'pull magnitude = pullRocks * dt');
  assert.equal(outside.vel.x, 0);
  assert.equal(outside.vel.y, 0);
  assert.equal(atEdge.vel.x, 0, 'at the exact radius edge: no pull');
  assert.equal(deadRock.vel.x, 0, 'dead rocks skipped');
});

test('vortex: ship inside the radius drifts toward it, clamped at maxSpeed (seed 74)', () => {
  const w = parkedWorld(74, 9);
  w.ship.pos = { x: 5, y: 0 };
  w.ship.vel = { x: 0, y: 0 };
  w.vortex.activateAt(10, 0);
  w.step(DT, NEUTRAL);
  assert.ok(w.ship.vel.x > 0, 'drifts toward the vortex');
  const mag = Math.hypot(w.ship.vel.x, w.ship.vel.y);
  assert.ok(mag <= CONFIG.ship.maxSpeed + 1e-9, 'never exceeds maxSpeed');
  for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL); // 1s of sustained pull
  const sp = Math.hypot(w.ship.vel.x, w.ship.vel.y);
  assert.ok(sp <= CONFIG.ship.maxSpeed + 1e-9, 'still clamped after 1s of pull');
});

test('vortex: telegraph -> start -> end order, exact durations, fresh rearm (seed 75)', () => {
  const v = new VortexField(new RNG(75), CONFIG);
  const ctx = { wave: 9, shipPos: { x: 0, y: 0 }, rocks: [] };
  v.nextIn = 0.05;
  const seen = [];
  let pullSeen = false;
  let rearmRoll = null; // nextIn at the moment of vortexEnd (before idle countdowns eat it)
  for (let i = 0; i < 600; i++) {
    const out = v.step(DT, ctx);
    for (const e of out.events) {
      seen.push(e.type);
      if (e.type === 'vortexEnd') rearmRoll = v.nextIn;
    }
    if (out.pull) pullSeen = true;
  }
  assert.deepEqual(seen, ['vortexTelegraph', 'vortexStart', 'vortexEnd'], 'phase order');
  assert.equal(v.phase, 'idle');
  assert.ok(rearmRoll !== null, 'rearm happened');
  assert.ok(rearmRoll >= CONFIG.vortex.intervalMin - 1e-9 && rearmRoll <= CONFIG.vortex.intervalMax + 1e-9, 're-armed with a fresh roll in-band');
  assert.ok(pullSeen, 'pulled the ship while active (spawn is always within the disk of the origin)');
});

test('vortex: full world cycle - no pull during telegraph, net drift toward center while active (seed 76)', () => {
  const w = parkedWorld(76, 9);
  w.ship.invuln = 999;
  let phase = 'wait';
  let cx = 0, cy = 0;
  let pullSteps = 0, pullDotSum = 0, telePullSteps = 0;
  for (let i = 0; i < 30 * 60; i++) {
    w.step(DT, NEUTRAL);
    for (const e of w.drainEvents()) {
      if (e.type === 'vortexTelegraph') {
        phase = 'telegraph';
        const n = Math.hypot(e.data.pos.x, e.data.pos.y) || 1;
        cx = e.data.pos.x / n; cy = e.data.pos.y / n;
      } else if (e.type === 'vortexStart') phase = 'active';
      else if (e.type === 'vortexEnd') phase = 'done';
    }
    if (phase === 'telegraph' || phase === 'active') {
      const sp = Math.hypot(w.ship.vel.x, w.ship.vel.y);
      if (phase === 'telegraph' && sp > 1e-6) telePullSteps++;
      if (phase === 'active' && sp > 1e-6) {
        pullSteps++;
        pullDotSum += w.ship.vel.x * cx + w.ship.vel.y * cy;
      }
    }
  }
  assert.equal(phase, 'done', 'full cycle completed within 30s');
  assert.equal(telePullSteps, 0, 'no pull during the telegraph phase');
  assert.ok(pullSteps > 20, 'ship drifted while active (steps: ' + pullSteps + ')');
  assert.ok(pullDotSum / pullSteps > 0, 'net drift toward the vortex center');
});
