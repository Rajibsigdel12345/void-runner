import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, damp, v2, v2Len, v2Dist, v2Norm, angDiff, dampAngle, v2Set } from '../src/core/math.js';

test('clamp', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test('lerp', () => {
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 1), 20);
});

test('damp: converges, frame-rate independent', () => {
  let a = 0;
  for (let i = 0; i < 60; i++) a = damp(a, 10, 4, 1 / 60);
  assert.ok(Math.abs(a - 10) < 0.5);
  // one big step vs many small steps -> similar result
  let b = 0; b = damp(b, 10, 4, 1);
  let c = 0; for (let i = 0; i < 60; i++) c = damp(c, 10, 4, 1 / 60);
  assert.ok(Math.abs(b - c) < 0.01);
});

test('v2 helpers', () => {
  const a = v2(3, 4);
  assert.equal(v2Len(a), 5);
  assert.equal(v2Dist(v2(1, 1), v2(4, 5)), 5);
  const n = v2Norm(v2(10, 0));
  assert.equal(n.x, 1); assert.equal(n.y, 0);
  const o = v2Set(v2(), 7, 8);
  assert.equal(o.x, 7); assert.equal(o.y, 8);
});

test('v2Norm handles zero vector', () => {
  const n = v2Norm(v2(0, 0));
  assert.equal(n.x, 0); assert.equal(n.y, 0);
});

test('angDiff: shortest signed arc', () => {
  assert.ok(Math.abs(angDiff(0, Math.PI / 2) - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(angDiff(0, -Math.PI / 2) + Math.PI / 2) < 1e-9);
  // crossing the seam
  assert.ok(Math.abs(angDiff(3.0, -3.0) - 0.28318530717958624) < 1e-6);
  assert.ok(Math.abs(angDiff(0, Math.PI) - Math.PI) < 1e-9);
  assert.ok(Math.abs(angDiff(0, -Math.PI) + Math.PI) < 1e-9);
});

test('dampAngle: converges along shortest path, seam-safe', () => {
  let a = 3.0;
  for (let i = 0; i < 120; i++) a = dampAngle(a, -3.0, 6, 1 / 60);
  // should approach -3 (i.e. 3.2831... wrapped), not travel the long way to -6.28
  let diff = a - -3.0;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  assert.ok(Math.abs(diff) < 0.05);
});
