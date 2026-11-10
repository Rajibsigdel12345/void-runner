import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deathWarpX } from '../src/core/deathWarp.js';
import { timeWarpX } from '../src/core/timeWarp.js';

const D = 0.8;
const S = 0.25;

test('full window (remain = dur) lands exactly at 1 - deathScale', () => {
  assert.equal(deathWarpX(D, D, S), 0.75);
});

test('closed window (remain = 0) returns an explicit 0 (not -0)', () => {
  const x = deathWarpX(0, D, S);
  assert.equal(x, 0);
  assert.ok(Object.is(x, 0));
});

test('mid-window values follow the linear fall', () => {
  assert.equal(deathWarpX(D * 0.5, D, S), 0.375);
  assert.equal(deathWarpX(D * 0.25, D, S), 0.1875);
  assert.equal(deathWarpX(0, D, S), 0);
});

test('monotonic: x never rises as remain decreases', () => {
  let prev = Infinity;
  for (let t = D; t >= 0; t -= 0.01) {
    const x = deathWarpX(t, D, S);
    assert.ok(x <= prev + 1e-12, 'x must not increase as remain shrinks');
    prev = x;
  }
});

test('clamps remain beyond the window', () => {
  assert.equal(deathWarpX(2 * D, D, S), 0.75);
  assert.equal(deathWarpX(-3, D, S), 0);
});

test('degenerate: dur <= 0 and deathScale = 1 give 0', () => {
  assert.equal(deathWarpX(1, 0, S), 0);
  assert.equal(deathWarpX(1, -5, S), 0);
  assert.equal(deathWarpX(D, D, 1), 0);
});

test('custom deathScale scales the peak (default is 0.25)', () => {
  assert.ok(Math.abs(deathWarpX(1, 1, 0.5) - 0.5) < 1e-12); // binary-exact anyway
  assert.ok(Math.abs(deathWarpX(1, 1, 0.9) - 0.1) < 1e-12); // 1 - 0.9 is not binary-exact: tolerance
  assert.equal(deathWarpX(1, 1), 0.75); // 0.25 is a binary fraction: exact
});

test('exact composition with timeWarpX: x === timeWarpX(1 - (1 - deathScale) * p)', () => {
  for (let i = 0; i <= 20; i++) {
    const p = i / 20;
    const remain = p * D;
    const impliedScale = 1 - (1 - S) * p;
    assert.ok(Math.abs(deathWarpX(remain, D, S) - timeWarpX(impliedScale)) < 1e-12,
      'composition mismatch at p=' + p);
  }
});
