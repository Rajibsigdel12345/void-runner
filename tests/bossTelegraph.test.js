// ST-290 (I311): boss attack telegraph window math - pure core, DOM-free (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { teleProgress, teleUrgency } from '../src/core/bossTelegraph.js';

test('teleProgress: sentinel / out-of-window -> 0', () => {
  assert.equal(teleProgress(-1, 0.6), 0);          // -1 = no window (main.js sentinel)
  assert.equal(teleProgress(-0.01, 0.6), 0);      // fired (timer wrapped negative)
  assert.equal(teleProgress(0.7, 0.6), 0);        // before the window opens
  assert.equal(teleProgress(NaN, 0.6), 0);
  assert.equal(teleProgress(Infinity, 0.6), 0);
  assert.equal(teleProgress(0.3, 0), 0);          // degenerate window
  assert.equal(teleProgress(0.3, -0.5), 0);
  assert.equal(teleProgress('0.3', 0.6), 0);      // non-number
});

test('teleProgress: window edge 0, fire moment 1, mid 0.5', () => {
  assert.equal(teleProgress(0.6, 0.6), 0);
  assert.equal(teleProgress(0, 0.6), 1);
  assert.equal(teleProgress(0.3, 0.6), 0.5);
});

test('teleProgress: monotone non-decreasing as the timer counts down', () => {
  let prev = 0;
  for (let t = 0.6; t >= -1e-9; t -= 0.05) {
    const p = teleProgress(Math.max(0, t), 0.6);
    assert.ok(p >= prev - 1e-12, 'progress must not shrink while counting down at ' + t);
    prev = p;
  }
});

test('teleProgress: exact values at the three configured windows (0.6 / 0.5 / 0.8)', () => {
  assert.equal(teleProgress(0.3, 0.6), 0.5);   // ring
  assert.equal(teleProgress(0.25, 0.5), 0.5);  // aimed
  assert.equal(teleProgress(0.4, 0.8), 0.5);   // burst
});

test('teleUrgency: identity at exp=1, accelerates for exp>1', () => {
  assert.equal(teleUrgency(0.5, 1), 0.5);
  assert.equal(teleUrgency(0.5, 2), 0.25);
  const g = teleUrgency(0.5, 1.6);
  assert.ok(g > 0.25 && g < 0.5, 'exp 1.6 sits between exp 1 and exp 2, got ' + g);
  assert.equal(teleUrgency(0, 1.6), 0);
  assert.equal(teleUrgency(1, 1.6), 1);
});

test('teleUrgency: clamps progress, falls back linear for exp<1 or bad input', () => {
  assert.equal(teleUrgency(1.4, 2), 1);
  assert.equal(teleUrgency(-0.2, 2), 0);
  assert.equal(teleUrgency(NaN, 2), 0);
  assert.equal(teleUrgency(0.5, 0), 0.5);   // exp < 1 -> clamped linear pass-through
  assert.equal(teleUrgency(0.3, -2), 0.3);
});