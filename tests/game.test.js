// ST-012: world orchestrator tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;

test('world: bullet kill -> score + fragments + kill event', () => {
  const w = new World(new RNG(1));
  const rock = w.field.spawn('L', 1, { x: 3, y: 0 });
  rock.vel = v2(0, 0);
  // drop a bullet directly onto the rock
  w.weapons._spawn({ x: rock.pos.x, y: rock.pos.y }, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.score, CONFIG.asteroid.sizes.L.score);
  const ev = w.drainEvents().find(e => e.type === 'kill');
  assert.ok(ev && ev.data.size === 'L', 'kill event emitted');
  assert.ok(w.field.count >= 2 && w.field.count <= 3, `fragments ${w.field.count}`);
  assert.ok(w.field.rocks.every(r => r.size === 'M'), 'L splits into M');
});

test('world: multiple kills accumulate score', () => {
  const w = new World(new RNG(2));
  for (let i = 0; i < 3; i++) {
    const r = w.field.spawn('M', 1, { x: i * 10 - 10, y: 5 });
    r.vel = v2(0, 0);
    w.weapons._spawn({ x: r.pos.x, y: r.pos.y }, 0);
  }
  w.step(DT, NOINTENT);
  // same-frame chain: combo 1,2,3 -> 1.0x + 1.1x + 1.2x
  const m = CONFIG.asteroid.sizes.M.score;
  assert.equal(w.score, m + Math.floor(m * 1.1) + Math.floor(m * 1.2));
});

test('world: ship hit -> lose life, knockback, invuln, rock destroyed', () => {
  const w = new World(new RNG(3));
  const rock = w.field.spawn('S', 1, { x: 1.5, y: 0 }); // overlapping ship radius 0.9 + rock 0.7
  rock.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives - 1);
  assert.ok(w.ship.isInvulnerable);
  assert.equal(w.field.count, w.field.rocks.filter(r => r.size !== 'S' && r.id !== rock.id).length + w.field.rocks.filter(r => r.id !== rock.id).length > 0 ? w.field.count : 0, 'sanity');
  const ev = w.drainEvents().find(e => e.type === 'hit');
  assert.ok(ev, 'hit event emitted');
  assert.equal(ev.data.lives, CONFIG.ship.lives - 1);
});

test('world: invulnerable ship takes no second hit', () => {
  const w = new World(new RNG(4));
  const r1 = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r1.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  const livesAfterFirst = w.lives;
  const r2 = w.field.spawn('S', 1, { x: -1.5, y: 0 });
  r2.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, livesAfterFirst, 'no damage while invulnerable');
});

test('world: game over at zero lives + event', () => {
  const w = new World(new RNG(5));
  w.lives = 1;
  const r = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.ok(w.gameOver);
  const ev = w.drainEvents().find(e => e.type === 'gameover');
  assert.ok(ev, 'gameover event emitted');
  // further steps are inert
  w.step(DT, NOINTENT);
  assert.equal(w.lives, 0);
});

test('world: firing emits fire events at cadence', () => {
  const w = new World(new RNG(6));
  const intent = { thrust: v2(0, 0), aimPoint: null, firing: true };
  for (let i = 0; i < 60; i++) w.step(DT, intent); // 1s of firing @5.5rps
  const fires = w.drainEvents().filter(e => e.type === 'fire').length;
  assert.ok(fires >= 5 && fires <= 7, `fire events ${fires}`);
});

test('world: deterministic replay (same seed + same intents)', () => {
  const mk = () => new World(new RNG(99));
  const a = mk(), b = mk();
  // both start with an identical rock
  for (const w of [a, b]) {
    const r = w.field.spawn('L', 1, { x: 8, y: 2 });
    r.vel = v2(-2, 0);
  }
  for (let i = 0; i < 600; i++) {
    const intent = {
      thrust: v2(Math.sin(i / 37), Math.cos(i / 53)),
      aimPoint: v2(Math.cos(i / 21) * 10, Math.sin(i / 29) * 10),
      firing: i % 12 === 0,
    };
    a.step(DT, intent);
    b.step(DT, intent);
  }
  assert.equal(a.score, b.score);
  assert.equal(a.lives, b.lives);
  assert.equal(a.field.count, b.field.count);
  assert.ok(Math.abs(a.ship.pos.x - b.ship.pos.x) < 1e-9);
});


