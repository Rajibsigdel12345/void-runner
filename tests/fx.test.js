// ST-025: screen-shake envelope tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { createShake, createPunch, createFovKick } from '../src/core/fx.js';
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

// ST-081: camera-punch envelope tests (directed, composing)
const PUNCH_CFG = { decay: 12, amplitude: 2.0 };

test('punch: idle -> zero magnitude, offset is a no-op', () => {
  const p = createPunch(PUNCH_CFG);
  assert.equal(p.magnitude(), 0);
  const out = { x: 1, y: 2, z: 3 };
  p.offset(out);
  assert.equal(out.x, 1); assert.equal(out.y, 2); assert.equal(out.z, 3);
});

test('punch: trigger sets magnitude, max-stacks, clamps at 1', () => {
  const p = createPunch(PUNCH_CFG);
  p.trigger({ x: 1, y: 0, z: 0 }, 0.4);
  assert.ok(Math.abs(p.magnitude() - 0.4) < 1e-9);
  p.trigger({ x: 0, y: 0, z: 1 }, 0.9);
  assert.ok(Math.abs(p.magnitude() - 0.9) < 1e-9);
  p.trigger(null, 2);
  assert.equal(p.magnitude(), 1);
});

test('punch: zero/negative strength is ignored', () => {
  const p = createPunch(PUNCH_CFG);
  p.trigger({ x: 1, y: 0, z: 0 }, 0);
  p.trigger({ x: 1, y: 0, z: 0 }, -1);
  assert.equal(p.magnitude(), 0);
});

test('punch: exponential decay settles to 0', () => {
  const p = createPunch(PUNCH_CFG);
  p.trigger({ x: 1, y: 0, z: 0 }, 1);
  p.step(0.5);
  assert.ok(Math.abs(p.magnitude() - Math.exp(-6)) < 1e-6);
  p.step(2);
  assert.equal(p.magnitude(), 0);
});

test('punch: offset writes dir * mag * amplitude and composes with shake', () => {
  const p = createPunch(PUNCH_CFG);
  p.trigger({ x: 0, y: 0.7, z: 0.5 }, 1);
  const out = p.offset({ x: 0, y: 0, z: 0 });
  assert.ok(Math.abs(out.x) < 1e-9);
  assert.ok(Math.abs(out.y - 0.7 * 2.0) < 1e-9);
  assert.ok(Math.abs(out.z - 0.5 * 2.0) < 1e-9);
  // composes (adds) after shake.offset (which overwrites) on the same target
  const s = createShake({ master: 1, decay: 6, amplitude: 0.5 }, new RNG(42));
  s.trigger(1);
  const c = { x: 0, y: 0, z: 0 };
  s.offset(c);
  const sx = c.x, sy = c.y, sz = c.z;
  p.offset(c);
  assert.ok(Math.abs(c.x - sx) < 1e-9);
  assert.ok(Math.abs(c.y - (sy + 1.4)) < 1e-9);
  assert.ok(Math.abs(c.z - (sz + 1.0)) < 1e-9);
});

// ST-082: dynamic FOV kick envelope tests
const FOVKICK_CFG = { decay: 5, max: 12 };

test('fovKick: idle -> zero value', () => {
  const k = createFovKick(FOVKICK_CFG);
  assert.equal(k.value(), 0);
});

test('fovKick: trigger sets value, max-stacks, clamps at max', () => {
  const k = createFovKick(FOVKICK_CFG);
  k.trigger(6);
  assert.ok(Math.abs(k.value() - 6) < 1e-9);
  k.trigger(4);
  assert.ok(Math.abs(k.value() - 6) < 1e-9); // max-stacking: a lower trigger never reduces
  k.trigger(20);
  assert.equal(k.value(), 12); // clamped at cfg.max
});

test('fovKick: zero/negative deg is ignored', () => {
  const k = createFovKick(FOVKICK_CFG);
  k.trigger(0);
  k.trigger(-3);
  assert.equal(k.value(), 0);
});

test('fovKick: exponential decay settles to 0', () => {
  const k = createFovKick(FOVKICK_CFG);
  k.trigger(6);
  k.step(0.5);
  assert.ok(Math.abs(k.value() - 6 * Math.exp(-2.5)) < 1e-6);
  k.step(2);
  assert.equal(k.value(), 0);
});
