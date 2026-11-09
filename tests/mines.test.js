// ST-054: mine drones - slow homing chasers, 1 hit, explode
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** Start a world and advance the wave director to `wave` (one step past intermission). */
function startWave(w, wave) {
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = wave - 1;
  w.step(DT, NEUTRAL);
  assert.equal(w.waves.wave, wave, 'director on wave ' + wave);
}

test('mines: config sanity (seed 53)', () => {
  const m = CONFIG.mine;
  assert.ok(m.firstWave >= 4, 'firstWave >= 4');
  assert.ok(m.speed < CONFIG.ship.maxSpeed, 'always dodgeable');
  assert.ok(m.turn > 0 && m.turn < 4, 'turn sane');
  assert.ok(m.radius > 0 && m.score > 0, 'radius/score');
  assert.ok(m.maxConcurrent >= 4, 'maxConcurrent');
});

test('mines: none before firstWave, one per eligible wave (seed 53)', () => {
  const w = new World(new RNG(53));
  w.begin();
  w.spawnMinesForWave(4);
  assert.equal(w.mines.count, 0, 'no mines at wave 4');
  w.spawnMinesForWave(5);
  assert.equal(w.mines.count, 1, 'one mine at wave 5');
  w.spawnMinesForWave(6);
  assert.equal(w.mines.count, 2, 'cumulative at wave 6');
  // through the wave director: starting wave 5 spawns a mine
  const w2 = new World(new RNG(53));
  startWave(w2, 5);
  assert.equal(w2.mines.count, 1, 'director start spawns a mine');
});

test('mines: homing turns toward the ship, bounded by turn rate (seed 54)', () => {
  const w = new World(new RNG(54));
  w.begin();
  const mine = w.mines.spawn();
  // park it with a 30-degree heading deficit: it must turn ~0.52 rad (within 1s of
  // the 1.6 rad/s budget) and then close on the ship at the origin
  mine.pos.x = 10; mine.pos.y = 0;
  const h0 = (150 * Math.PI) / 180; // ship direction from here is 180 deg
  mine.vel.x = Math.cos(h0) * CONFIG.mine.speed;
  mine.vel.y = Math.sin(h0) * CONFIG.mine.speed;
  const d0 = Math.hypot(mine.pos.x, mine.pos.y);
  const a0 = h0;
  for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
  const d1 = Math.hypot(mine.pos.x, mine.pos.y);
  const a1 = Math.atan2(mine.vel.y, mine.vel.x);
  let da = Math.abs(a1 - a0) % (2 * Math.PI);
  if (da > Math.PI) da = 2 * Math.PI - da;
  assert.ok(d1 < d0, 'approaches the ship');
  assert.ok(da < CONFIG.mine.turn * 1.0 + 0.05, 'turn bounded by rate (1s of steering)');
});

test('mines: bullet kill pays score, feeds combo, emits explode (seed 55)', () => {
  const w = new World(new RNG(55));
  w.begin();
  const mine = w.mines.spawn();
  mine.pos.x = 10; mine.pos.y = 0;
  w.weapons.bullets.push({ id: 99999, pos: { x: 10, y: 0 }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'mine', 'mine kill');
  assert.equal(kill.data.mine, true, 'mine flag');
  assert.equal(kill.data.points, CONFIG.mine.score, 'points');
  assert.ok(evs.find(e => e.type === 'mineExplode'), 'explode event');
  assert.equal(w.mines.count, 0, 'mine gone');
  assert.equal(w.score, CONFIG.mine.score, 'score');
  assert.equal(w.scoreKeeper.combo, 1, 'feeds the combo');
});

test('mines: touching the ship costs a life and destroys the mine (seed 55)', () => {
  const w = new World(new RNG(55));
  w.begin();
  const mine = w.mines.spawn();
  mine.pos.x = 1.2; mine.pos.y = 0; // 0.9 + 0.9 = 1.8 > 1.2 -> collision
  mine.vel.x = 0; mine.vel.y = 0;
  const livesBefore = w.lives;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.lives, livesBefore - 1, 'life lost');
  assert.ok(w.ship.isInvulnerable, 'invuln granted');
  assert.equal(w.mines.count, 0, 'mine destroyed');
  assert.ok(evs.find(e => e.type === 'hit'), 'hit event');
  assert.ok(evs.find(e => e.type === 'mineExplode'), 'explode event');
});

test('mines: deterministic trajectory for a pinned seed (seed 55)', () => {
  const run = () => {
    const w = new World(new RNG(55));
    startWave(w, 5);
    w.livesMgr.count = 999;
    for (let i = 0; i < 120; i++) w.step(DT, NEUTRAL);
    return w.mines.mines.map(m => [+m.pos.x.toFixed(3), +m.pos.y.toFixed(3)]);
  };
  assert.deepEqual(run(), run());
});
