import test from 'node:test';
import assert from 'node:assert/strict';
import { RNG } from '../src/core/rng.js';

test('rng: same seed -> same sequence (determinism)', () => {
  const a = new RNG(1234);
  const b = new RNG(1234);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('rng: different seeds -> different sequences', () => {
  const a = new RNG(1);
  const b = new RNG(2);
  const sa = [a.next(), a.next(), a.next()];
  const sb = [b.next(), b.next(), b.next()];
  assert.notDeepEqual(sa, sb);
});

test('rng: next() within [0, 1)', () => {
  const r = new RNG(42);
  for (let i = 0; i < 1000; i++) { const v = r.next(); assert.ok(v >= 0 && v < 1); }
});

test('rng: range/int/pick/chance sanity', () => {
  const r = new RNG(7);
  for (let i = 0; i < 200; i++) {
    const v = r.range(2, 5); assert.ok(v >= 2 && v < 5);
    const n = r.int(1, 3); assert.ok(n === 1 || n === 2 || n === 3);
    assert.ok([10, 20, 30].includes(r.pick([10, 20, 30])));
  }
  // chance(1) always true, chance(0) always false
  const r1 = new RNG(9); assert.ok(r1.chance(1));
  const r0 = new RNG(9); assert.ok(!r0.chance(0));
});

test('rng: reset reproduces sequence', () => {
  const r = new RNG(55);
  const first = r.next();
  r.reset();
  assert.equal(r.next(), first);
});
