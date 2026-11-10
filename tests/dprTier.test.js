// Void Runner - dprForTier tests (ST-225, load-reactive DPR).
import test from 'node:test';
import assert from 'node:assert/strict';
import { dprForTier } from '../src/core/dprTier.js';

const CAPS = { high: 2, low: 1.5 };

test('dprForTier: high caps at 2 (dpr 2 -> 2, dpr 3 -> 2, dpr 1.25 -> 1.25)', () => {
  assert.equal(dprForTier('high', 2, CAPS), 2);
  assert.equal(dprForTier('high', 3, CAPS), 2);
  assert.equal(dprForTier('high', 1.25, CAPS), 1.25);
});

test('dprForTier: low caps at 1.5 (dpr 2 -> 1.5, dpr 3 -> 1.5, dpr 1.25 -> 1.25 no-op)', () => {
  assert.equal(dprForTier('low', 2, CAPS), 1.5);
  assert.equal(dprForTier('low', 3, CAPS), 1.5);
  assert.equal(dprForTier('low', 1.25, CAPS), 1.25);
});

test('dprForTier: off follows the low cap (ST-225: off is a low-end choice)', () => {
  assert.equal(dprForTier('off', 2, CAPS), 1.5);
  assert.equal(dprForTier('off', 1.25, CAPS), 1.25);
});

test('dprForTier: invalid tier normalizes to high (defensive mirror of storage)', () => {
  assert.equal(dprForTier('garbage', 3, CAPS), 2);
  assert.equal(dprForTier(undefined, 3, CAPS), 2);
  assert.equal(dprForTier(null, 2, CAPS), 2);
});

test('dprForTier: invalid dpr clamps to 1 (no NaN, no negatives)', () => {
  assert.equal(dprForTier('high', NaN, CAPS), 1);
  assert.equal(dprForTier('high', 0, CAPS), 1);
  assert.equal(dprForTier('high', -1, CAPS), 1);
  assert.equal(dprForTier('low', undefined, CAPS), 1);
});

test('dprForTier: custom caps honored; invalid caps fall back to 2 / 1.5', () => {
  assert.equal(dprForTier('low', 3, { high: 2, low: 1.25 }), 1.25);
  assert.equal(dprForTier('high', 3, { high: 1.75, low: 1.5 }), 1.75);
  assert.equal(dprForTier('low', 3), 1.5); // no caps -> defaults
  assert.equal(dprForTier('low', 3, { high: 2, low: -1 }), 1.5); // invalid low cap -> default
});
