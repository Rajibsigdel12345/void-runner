// ST-025: screen-shake envelope tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { createShake } from '../src/core/fx.js';
import { RNG } from '../src/core/rng.js';

const CFG = { master: 1, decay: 6, amplitude: 0.5 };

test('shake: idle -> zero magnitude and zero offset', () => {
  const s = createShake(CFG, new RNG(7));
  assert.equal(s.magnitude(), 0);
  const out = s.offset({ x: 9, y: 9, z: 9 });
  assert.equal(out.x, 0); assert.equal(out.y, 0); assert.equal(out.z, 0);
});

test('shake: trigger sets magnitude, max-stacks, clamps at 1', () => {
  const s = createShake(CFG, new RNG(7));
  s.trigger(0.4);
  assert.ok(Math.abs(s.magnitude() - 0.4) < 1e-9);
  s.trigger(0.9);
  assert.ok(Math.abs(s.magnitude() - 0.9) < 1e-9);
  s.trigger(2);
  assert.equal(s.magnitude(), 1);
});

test('shake: master 0 silences trigger; setMaster re-arms scaled', () => {
  const s = createShake({ master: 0, decay: 6, amplitude: 0.5 }, new RNG(7));
  s.trigger(1);
  assert.equal(s.magnitude(), 0);
  s.setMaster(0.5);
  s.trigger(1);
  assert.ok(Math.abs(s.magnitude() - 0.5) < 1e-9);
});

test('shake: exponential decay settles to 0', () => {
  const s = createShake(CFG, new RNG(7));
  s.trigger(1);
  s.step(0.5);
  assert.ok(Math.abs(s.magnitude() - Math.exp(-3)) < 1e-6);
  s.step(2);
  assert.equal(s.magnitude(), 0);
});

test('shake: jitter bounded by amplitude and deterministic per seed', () => {
  const a = createShake(CFG, new RNG(42));
  const b = createShake(CFG, new RNG(42));
  a.trigger(1); b.trigger(1);
  const oa = a.offset({ x: 0, y: 0, z: 0 });
  const ob = b.offset({ x: 0, y: 0, z: 0 });
  assert.equal(oa.x, ob.x); assert.equal(oa.y, ob.y); assert.equal(oa.z, ob.z);
  const horiz = Math.hypot(oa.x, oa.z);
  assert.ok(horiz > 0 && horiz <= CFG.amplitude * 1.0001);
  assert.ok(Math.abs(oa.y) <= CFG.amplitude * 0.5 * 1.0001);
});
