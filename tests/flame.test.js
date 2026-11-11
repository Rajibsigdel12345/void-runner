// ST-256 (I268): engine flame layering math (src/core/flame.js). Pure-logic unit
// tests: determinism, reduced-motion steady state, monotone thrust response,
// flicker bounding, layer-order safety (core never crosses the mid tip), and
// bloom-band headroom for the mid plume layer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';
import { flameScales, flicker } from '../src/core/flame.js';

const F = CONFIG.ship.flame;

test('ST-256: deterministic - same (thrust, t, motionOn) always yields the same scales', () => {
  for (const t of [0.123, 4.567, 12.345]) {
    assert.deepStrictEqual(flameScales(0.8, t, true), flameScales(0.8, t, true));
  }
});

test('ST-256: reduced motion - steady output independent of time, zero sway', () => {
  const a = flameScales(1, 0.1, false);
  const b = flameScales(1, 7.77, false);
  assert.deepStrictEqual(a, b);
  assert.equal(a.swayX, 0);
  assert.equal(a.swayY, 0);
});

test('ST-256: monotone thrust response (steady) - full thrust beats 10% in every dimension', () => {
  const lo = flameScales(0.1, 0.42, false);
  const hi = flameScales(1.0, 0.42, false);
  for (const k of ['midLen', 'coreLen', 'midRadius', 'coreRadius', 'glowScale', 'glowOpacity']) {
    assert.ok(hi[k] > lo[k], k + ': hi ' + hi[k].toFixed(4) + ' > lo ' + lo[k].toFixed(4));
  }
});

test('ST-256: flicker bounded - midLen within [-26%, +26%] of steady, always positive', () => {
  const steady = flameScales(1, 0, false);
  const lo = steady.midLen * 0.74, hi = steady.midLen * 1.26;
  for (let t = 0; t <= 10.0001; t += 0.017) {
    const s = flameScales(1, t, true);
    assert.ok(s.midLen >= lo && s.midLen <= hi, 'midLen ' + s.midLen.toFixed(4) + ' out of [' + lo + ',' + hi + '] at t=' + t.toFixed(3));
    assert.ok(s.midLen > 0 && s.coreLen > 0 && s.glowScale > 0, 'positive dimensions at t=' + t.toFixed(3));
  }
});

test('ST-256: layer order - core stays strictly inside the mid plume (radius and length)', () => {
  for (const th of [0.1, 0.5, 1.0]) {
    const s = flameScales(th, 0.9, true);
    assert.ok(s.coreRadius < s.midRadius, 'coreRadius ' + s.coreRadius.toFixed(4) + ' < midRadius ' + s.midRadius.toFixed(4));
    assert.ok(s.coreLen < s.midLen, 'coreLen ' + s.coreLen.toFixed(4) + ' < midLen ' + s.midLen.toFixed(4));
  }
});

test('ST-256: mid plume is sub-bloom - isolated linear-R contribution under the 0.72 band', () => {
  const rLin = Math.pow(((F.mid.color >> 16) & 255) / 255, 2.2) * F.mid.opacity;
  assert.ok(rLin < 0.70, 'mid R-linear ' + rLin.toFixed(3) + ' < 0.70 (threshold 0.72)');
});

test('ST-256: glow is soft, flicker amplitudes bounded, reduced-motion flicker is exactly 1', () => {
  assert.ok(F.glow.opacity > 0 && F.glow.opacity <= 0.5, 'glow opacity ' + F.glow.opacity + ' in (0, 0.5]');
  assert.ok(F.flicker.amp + F.flicker.amp2 <= 0.3, 'total flicker amplitude ' + (F.flicker.amp + F.flicker.amp2) + ' <= 0.3');
  assert.equal(flicker(1.234, false), 1);
});
