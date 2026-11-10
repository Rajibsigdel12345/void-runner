import { test } from 'node:test';
import assert from 'node:assert/strict';
import { killPunchEnergy, killPunchDir } from '../src/core/killPunch.js';
import { CONFIG } from '../src/core/config.js';

// ST-221 (I224): kill punch (T4) - pure mapping over the live config table.
const C = CONFIG.fx.killPunch;

test('config: bottom-rung energies ordered S < M < L, all under the fanfare rung', () => {
  assert.ok(C.s > 0 && C.s < C.m && C.m < C.l);
  assert.ok(C.l < 0.45, 'L rung must stay below the weapon fanfare punch (0.45)');
  assert.ok(C.max < 0.45, 'the cap must stay below the weapon fanfare punch');
  assert.ok(C.l * (1 + C.overdriveBoost) <= C.max, 'L + overdrive must stay under the cap');
});

test('energy: exact class rungs from the live config', () => {
  assert.equal(killPunchEnergy('S', false, C), C.s);
  assert.equal(killPunchEnergy('M', false, C), C.m);
  assert.equal(killPunchEnergy('L', false, C), C.l);
});

test('energy: a destroyed mine rides the S rung (small kill)', () => {
  assert.equal(killPunchEnergy('mine', false, C), C.s);
});

test('energy: unknown sizes map to zero (boss/warden/specials carry their own punch)', () => {
  assert.equal(killPunchEnergy('boss', false, C), 0);
  assert.equal(killPunchEnergy('warden', false, C), 0);
  assert.equal(killPunchEnergy(undefined, false, C), 0);
  assert.equal(killPunchEnergy(null, true, C), 0);
  assert.equal(killPunchEnergy('L', false, null), 0);
  assert.equal(killPunchEnergy('L', false, {}), 0);
});

test('energy: overdrive combo-heat scales exactly x(1 + boost)', () => {
  assert.equal(killPunchEnergy('L', true, C), C.l * (1 + C.overdriveBoost));
  assert.equal(killPunchEnergy('S', true, { s: 0.1, m: 0.2, l: 0.3, overdriveBoost: 1 }), 0.2);
  assert.equal(killPunchEnergy('M', false, { s: 0.1, m: 0.2, l: 0.3, overdriveBoost: 1 }), 0.2);
});

test('energy: the hard cap clamps boosted values; without max there is no cap', () => {
  assert.equal(killPunchEnergy('L', true, { s: 0.1, m: 0.2, l: 0.5, overdriveBoost: 1, max: 0.3 }), 0.3);
  assert.equal(killPunchEnergy('L', true, { s: 0.1, m: 0.2, l: 0.18, overdriveBoost: 5 }), 1.08);
  assert.equal(killPunchEnergy('L', true, { s: 0.1, m: 0.2, l: 0.18, overdriveBoost: 1, max: 0.3 }), 0.3);
});

test('dir: horizontal kill to the right of the ship (lift 0) is unit +x', () => {
  const o = killPunchDir({ x: 0, y: 0 }, { x: 3, y: 0 }, 0, {});
  assert.equal(o.x, 1);
  assert.equal(o.y, 0);
  assert.equal(o.z, 0);
});

test('dir: 3-4 diagonal with lift 0 normalizes to (0.6, 0, 0.8)', () => {
  const o = killPunchDir({ x: 0, y: 0 }, { x: 3, y: 4 }, 0, {});
  assert.ok(Math.abs(o.x - 0.6) < 1e-12);
  assert.ok(Math.abs(o.y) < 1e-12);
  assert.ok(Math.abs(o.z - 0.8) < 1e-12);
});

test('dir: with lift the vector stays unit-length and biased up', () => {
  const o = killPunchDir({ x: 0, y: 0 }, { x: 5, y: 0 }, 0.35, {});
  assert.ok(Math.abs(Math.hypot(o.x, o.y, o.z) - 1) < 1e-12);
  assert.ok(o.x > 0 && o.y > 0 && o.z === 0);
});

test('dir: a near kill (< 0.5) falls back to the straight-up default', () => {
  const o = killPunchDir({ x: 0, y: 0 }, { x: 0.2, y: 0.2 }, 0.35, {});
  assert.equal(o.x, 0);
  assert.equal(o.y, 1);
  assert.equal(o.z, 0);
});

test('dir: non-finite or missing positions never produce NaN', () => {
  const o1 = killPunchDir({ x: 0, y: 0 }, { x: NaN, y: 0 }, 0.35, {});
  const o2 = killPunchDir({ x: 0, y: 0 }, null, 0.35, {});
  const o3 = killPunchDir(null, { x: 1, y: 2 }, NaN, {});
  for (const o of [o1, o2, o3]) {
    assert.ok(isFinite(o.x) && isFinite(o.y) && isFinite(o.z));
  }
});

test('dir: the scratch-out object is reused (no per-kill allocation)', () => {
  const o = { x: 9, y: 9, z: 9 };
  const r = killPunchDir({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, o);
  assert.equal(r, o);
  assert.notEqual(o.x, 9);
});