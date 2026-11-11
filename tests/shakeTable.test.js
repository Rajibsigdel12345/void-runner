import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shakeEnergy } from '../src/core/shakeTable.js';
import { createShake } from '../src/core/fx.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const T = CONFIG.fx.shakeTable;

// Behavior preservation: the unified table must carry the exact values the
// call sites used before ST-175 (6 hardcoded literals + 2 config values).
const PREVIOUS = {
  hit: 0.5,
  bomb: 1.0,
  mineExplode: 0.4,
  droneExplode: 0.35,
  bossSpawn: 0.7,
  bossDeath: 1.0,
  wardenSpawn: 0.5,
  wardenDeath: 0.8,
  stingerDeath: 0.6, // ST-229: charger burst rung (0.5 wardenSpawn < 0.6 < 0.8 wardenDeath)
};

test('the table is exactly the nine shaking events', () => {
  assert.deepEqual(Object.keys(T).sort(), Object.keys(PREVIOUS).sort());
});

test('every table value preserves the pre-ST-175 call-site value', () => {
  for (const k of Object.keys(PREVIOUS)) assert.equal(T[k], PREVIOUS[k], k);
});

test('table values are finite, in (0, 1]', () => {
  for (const [k, v] of Object.entries(T)) {
    assert.ok(Number.isFinite(v) && v > 0 && v <= 1, k);
  }
});

test('unknown events shake 0 (the table is the only source of shake)', () => {
  assert.equal(shakeEnergy('rockShieldHit', T), 0);
  assert.equal(shakeEnergy('droneDecay', T), 0);
  assert.equal(shakeEnergy('beltHit', T), 0);
  assert.equal(shakeEnergy('', T), 0);
  assert.equal(shakeEnergy(undefined, T), 0);
});

test('invalid tables shake 0 without throwing', () => {
  assert.equal(shakeEnergy('hit', null), 0);
  assert.equal(shakeEnergy('hit', undefined), 0);
  assert.equal(shakeEnergy('hit', 5), 0);
  assert.equal(shakeEnergy('hit', 'hit'), 0);
});

test('invalid entries (negative, NaN, non-number) shake 0', () => {
  assert.equal(shakeEnergy('a', { a: -0.5 }), 0);
  assert.equal(shakeEnergy('a', { a: NaN }), 0);
  assert.equal(shakeEnergy('a', { a: '0.5' }), 0);
  assert.equal(shakeEnergy('a', { a: null }), 0);
});

test('zero is a valid explicit no-shake entry', () => {
  const v = shakeEnergy('a', { a: 0 });
  assert.equal(v, 0);
  assert.ok(Object.is(v, 0));
});

test('integrates with createShake: table energy feeds the envelope', () => {
  const sh = createShake({ master: 1, decay: 6, amplitude: 0.5 }, new RNG(1));
  sh.trigger(shakeEnergy('hit', T));
  assert.equal(sh.magnitude(), 0.5);
  sh.trigger(shakeEnergy('bomb', T));
  assert.equal(sh.magnitude(), 1); // max-stacking: the deeper bomb wins
  const sh2 = createShake({ master: 0.5, decay: 6, amplitude: 0.5 }, new RNG(2));
  sh2.trigger(shakeEnergy('hit', T));
  assert.equal(sh2.magnitude(), 0.25); // master scale applies at trigger
});

test('master 0 envelope ignores the table', () => {
  const sh = createShake({ master: 0, decay: 6, amplitude: 0.5 }, new RNG(3));
  sh.trigger(shakeEnergy('bomb', T));
  assert.equal(sh.magnitude(), 0);
});