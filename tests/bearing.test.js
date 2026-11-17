// ST-444 (I477): bearing math tests (pure math, DOM-free)
import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapPi, relBearing, nearestRim, centerVisible } from '../src/core/bearing.js';

const HALF = Math.PI / 2;

test('wrapPi: wraps into (-PI, PI]', () => {
  assert.equal(wrapPi(0), 0);
  assert.equal(wrapPi(Math.PI), Math.PI);
  assert.ok(Math.abs(wrapPi(3 * Math.PI) - Math.PI) < 1e-12);
  assert.ok(Math.abs(wrapPi(-3 * Math.PI) - Math.PI) < 1e-12); // -3pi == +pi in (-PI, PI]
  assert.ok(Math.abs(wrapPi(2 * Math.PI + 0.5) - 0.5) < 1e-12);
  assert.ok(Math.abs(wrapPi(-2 * Math.PI - 0.5) + 0.5) < 1e-12);
});

test('relBearing: left is positive, right is negative, ahead is 0, behind is +/\-PI', () => {
  // ship at origin facing +x
  assert.equal(relBearing(0, 0, 1, 0, 10, 0), 0); // straight ahead
  assert.ok(Math.abs(relBearing(0, 0, 1, 0, 0, 10) - HALF) < 1e-12); // arena +z = ship LEFT
  assert.ok(Math.abs(relBearing(0, 0, 1, 0, 0, -10) + HALF) < 1e-12); // arena -z = ship RIGHT
  assert.equal(relBearing(0, 0, 1, 0, -10, 0), Math.PI); // directly behind
  // ship facing -y (the spawn heading); target at arena -y (ahead)
  assert.equal(relBearing(0, 0, 0, -1, 0, -10), 0);
  // translation invariance: the same geometry from an offset position
  assert.ok(Math.abs(relBearing(5, -3, 1, 0, 15, -3) - relBearing(0, 0, 1, 0, 10, 0)) < 1e-12);
});

test('nearestRim: on the rim in the center->ship direction; undefined near the center', () => {
  const R = 26;
  const out = { x: 99, y: 99, ok: true };
  nearestRim(0, 0, R, out);
  assert.equal(out.ok, false);
  nearestRim(0.1, 0, R, out); // below minDist (0.5)
  assert.equal(out.ok, false);
  nearestRim(0, -13, R, out);
  assert.equal(out.ok, true);
  assert.ok(Math.abs(out.x) < 1e-12);
  assert.ok(Math.abs(out.y + R) < 1e-12); // nearest rim point from (0,-13) is (0,-26)
  nearestRim(10, 10, R, out);
  assert.ok(Math.hypot(out.x, out.y) - R < 1e-9); // on the rim
  assert.ok(Math.abs(out.x - out.y) < 1e-12); // 45-degree direction preserved
});

test('centerVisible: false at/near the center, true away from it', () => {
  assert.equal(centerVisible(0, 0), false);
  assert.equal(centerVisible(0.4, 0), false);
  assert.equal(centerVisible(0.5, 0), true);
  assert.equal(centerVisible(12, -5), true);
});
