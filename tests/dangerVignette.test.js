import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dangerVignetteX } from '../src/core/dangerVignette.js';
import { CONFIG } from '../src/core/config.js';

const H = 0.5;
const F = 0.5;

test('t = 0 starts at full strength (explicit 1)', () => {
  const x = dangerVignetteX(0, H, F);
  assert.equal(x, 1);
  assert.ok(Object.is(x, 1));
});

test('negative t clamps to the t = 0 value', () => {
  assert.equal(dangerVignetteX(-1, H, F), 1);
});

test('hold phase stays at 1 up to and including t = hold', () => {
  assert.equal(dangerVignetteX(0.1, H, F), 1);
  assert.equal(dangerVignetteX(H * 0.99, H, F), 1);
  assert.equal(dangerVignetteX(H, H, F), 1);
});

test('fade phase falls linearly to 0', () => {
  assert.equal(dangerVignetteX(H + F * 0.5, H, F), 0.5);
  assert.equal(dangerVignetteX(H + F * 0.25, H, F), 0.75);
  assert.equal(dangerVignetteX(H + F * 0.75, H, F), 0.25);
});

test('t = hold + fade and beyond are an explicit 0', () => {
  const x = dangerVignetteX(H + F, H, F);
  assert.equal(x, 0);
  assert.ok(Object.is(x, 0));
  assert.equal(dangerVignetteX(H + F + 100, H, F), 0);
});

test('monotonic: never rises, always in [0, 1]', () => {
  let prev = 1;
  for (let t = 0; t <= H + F + 0.01; t += 0.01) {
    const x = dangerVignetteX(t, H, F);
    assert.ok(x <= prev + 1e-12, 'must not rise');
    assert.ok(x >= 0 && x <= 1, 'must stay in range');
    prev = x;
  }
});

test('degenerate: fade = 0 is a pure step (hold then off)', () => {
  assert.equal(dangerVignetteX(0, 0.5, 0), 1);
  assert.equal(dangerVignetteX(0.25, 0.5, 0), 1);
  assert.equal(dangerVignetteX(0.75, 0.5, 0), 0);
  assert.equal(dangerVignetteX(0.001, 0, 0), 0);
});

test('degenerate: hold = 0 is a pure fade from the hit frame', () => {
  assert.equal(dangerVignetteX(0, 0, 0.5), 1);
  assert.equal(dangerVignetteX(0.25, 0, 0.5), 0.5);
  assert.equal(dangerVignetteX(0.5, 0, 0.5), 0);
});

test('invalid holds/fades (negative, NaN) give 0', () => {
  assert.equal(dangerVignetteX(0.1, -1, F), 0);
  assert.equal(dangerVignetteX(0.1, H, -1), 0);
  assert.equal(dangerVignetteX(0.1, NaN, F), 0);
  assert.equal(dangerVignetteX(0.1, H, NaN), 0);
});

test('the shipped CONFIG values are valid and sane', () => {
  const { hold, fade } = CONFIG.fx.dangerVignette;
  assert.ok(Number.isFinite(hold) && hold >= 0, 'hold');
  assert.ok(Number.isFinite(fade) && fade > 0, 'fade');
  assert.ok(hold + fade <= 2, 'total window stays short');
  assert.equal(dangerVignetteX(0, hold, fade), 1);
  assert.equal(dangerVignetteX(hold + fade, hold, fade), 0);
});