// ST-009: asteroid field tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { AsteroidField } from '../src/core/asteroids.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2, v2Len, v2Dist } from '../src/core/math.js';

const DT = 1 / 60;

test('asteroids: deterministic spawn with fixed seed', () => {
  const f1 = new AsteroidField(new RNG(42));
  const f2 = new AsteroidField(new RNG(42));
  const r1 = f1.spawn('L');
  const r2 = f2.spawn('L');
  assert.deepEqual({ x: r1.pos.x, y: r1.pos.y }, { x: r2.pos.x, y: r2.pos.y });
  assert.deepEqual({ x: r1.vel.x, y: r1.vel.y }, { x: r2.vel.x, y: r2.vel.y });
});

test('asteroids: split rules L->2..3 M, M->2..3 S, S->none', () => {
  const f = new AsteroidField(new RNG(7));
  const L = f.spawn('L', 1, { x: 5, y: 0 });
  const mFrag = f.destroy(L.id);
  assert.ok(mFrag.length >= 2 && mFrag.length <= 3, `L fragments ${mFrag.length}`);
  assert.ok(mFrag.every(c => c.size === 'M'));

  const M = f.spawn('M', 1, { x: -5, y: 3 });
  const sFrag = f.destroy(M.id);
  assert.ok(sFrag.length >= 2 && sFrag.length <= 3, `M fragments ${sFrag.length}`);
  assert.ok(sFrag.every(c => c.size === 'S'));

  const S = f.spawn('S', 1, { x: 0, y: -5 });
  assert.deepEqual(f.destroy(S.id), []);
});

test('asteroids: fragments inherit parent speedMult', () => {
  const f = new AsteroidField(new RNG(3));
  const L = f.spawn('L', 1.5, { x: 5, y: 0 });
  const frags = f.destroy(L.id);
  assert.ok(frags.length > 0);
  assert.ok(frags.every(c => c.speedMult === 1.5));
});

test('asteroids: concurrent cap enforced', () => {
  const f = new AsteroidField(new RNG(1));
  for (let i = 0; i < CONFIG.asteroid.maxConcurrent; i++) f.spawn('S');
  assert.equal(f.spawn('S'), null, 'at cap');
});

test('asteroids: rim bounce keeps rocks inside arena', () => {
  const f = new AsteroidField(new RNG(5));
  const r = f.spawn('L', 1, { x: 24, y: 0 });
  r.vel = v2(10, 0); // outward
  for (let i = 0; i < 60 * 3; i++) f.step(DT);
  assert.ok(v2Len(r.pos) + r.radius <= CONFIG.arena.radius + 1e-6, `rock escaped: ${v2Len(r.pos)}`);
});

test('asteroids: drift matches velocity integration', () => {
  const f = new AsteroidField(new RNG(9));
  const r = f.spawn('S', 1, { x: 0, y: 0 });
  const v = { x: r.vel.x, y: r.vel.y };
  f.step(0.5);
  assert.ok(Math.abs(r.pos.x - v.x * 0.5) < 1e-9);
  assert.ok(Math.abs(r.pos.y - v.y * 0.5) < 1e-9);
});

test('asteroids: destroyed rock is removed (no double kill)', () => {
  const f = new AsteroidField(new RNG(11));
  const L = f.spawn('L', 1, { x: 1, y: 1 });
  const kids = f.destroy(L.id);
  assert.ok(!f.rocks.some(r => r.id === L.id), 'original rock removed');
  assert.equal(f.count, kids.length);
  assert.deepEqual(f.destroy(L.id), [], 'second kill returns nothing');
  assert.equal(f.count, kids.length, 'count unchanged by double kill');
});

test('asteroids: spawn respects noNear player distance (I34)', () => {
  const f = new AsteroidField(new RNG(35));
  const player = { x: 24, y: 0 }; // hugging the +x rim
  for (let i = 0; i < 10 && f.count < 10; i++) {
    const r = f.spawn('L', 1, null, { x: player.x, y: player.y, min: 8 });
    if (!r) break;
    assert.ok(v2Dist(r.pos, player) >= 8 - 1e-9, 'rock too close: ' + v2Dist(r.pos, player).toFixed(2));
  }
});
