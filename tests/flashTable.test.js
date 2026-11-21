import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flashEnergy } from '../src/core/flashTable.js';
import { CONFIG } from '../src/core/config.js';

const T = CONFIG.fx.flashTable;

// Behavior preservation: the unified table must carry the exact values the
// juice call sites used before ST-179 (9 inline literals in src/main.js).
const PREVIOUS = {
  hit: 0.5,
  bossDeath: 0.5,
  bossSpawn: 0.4,
  wardenDeath: 0.4,
  bomb: 0.35,
  mineExplode: 0.25,
  wardenSpawn: 0.25,
  droneExplode: 0.2,
  overdrive: 0.15,
  gunshipDeath: 0.4, // ST-418: heavy bomber death flash (wardenDeath 0.4)
  podDeath: 0.4, // ST-448: splitter death flash (wardenDeath 0.4; sentry/wasp deaths: none)
  beaconDeath: 0.4, // ST-518 (E75): signal kill flash (wardenDeath/gunshipDeath/podDeath 0.4 rung)
};

test('the table is exactly the twelve flashing events', () => {
  assert.deepEqual(Object.keys(T).sort(), Object.keys(PREVIOUS).sort());
});

test('every table value preserves the pre-ST-179 call-site value', () => {
  for (const k of Object.keys(PREVIOUS)) assert.equal(T[k], PREVIOUS[k], k);
});

test('table values are finite, in (0, 0.8]', () => {
  for (const [k, v] of Object.entries(T)) {
    assert.ok(Number.isFinite(v) && v > 0 && v <= 0.8, k);
  }
});

test('unknown / excluded events bump 0 (the table is the only flash source here)', () => {
  assert.equal(flashEnergy('rockShieldHit', T), 0);
  assert.equal(flashEnergy('droneDecay', T), 0);
  assert.equal(flashEnergy('shieldPop', T), 0);
  assert.equal(flashEnergy('weaponLevelUp', T), 0); // config-driven via weaponFanfare.flash, NOT this table
  assert.equal(flashEnergy('', T), 0);
  assert.equal(flashEnergy(undefined, T), 0);
});

test('invalid tables bump 0 without throwing', () => {
  assert.equal(flashEnergy('hit', null), 0);
  assert.equal(flashEnergy('hit', undefined), 0);
  assert.equal(flashEnergy('hit', 5), 0);
  assert.equal(flashEnergy('hit', 'hit'), 0);
});

test('invalid entries (negative, NaN, non-number) bump 0', () => {
  assert.equal(flashEnergy('a', { a: -0.5 }), 0);
  assert.equal(flashEnergy('a', { a: NaN }), 0);
  assert.equal(flashEnergy('a', { a: '0.5' }), 0);
  assert.equal(flashEnergy('a', { a: null }), 0);
});

test('zero is a valid explicit no-flash entry', () => {
  const v = flashEnergy('a', { a: 0 });
  assert.equal(v, 0);
  assert.ok(Object.is(v, 0));
});

test('the shared 0.8 cap absorbs over-charge (mirrors the juice dispatch)', () => {
  // main.js: flashA = Math.min(0.8, flashA + flashEnergy(type, CONFIG.fx.flashTable))
  let flashA = 0;
  flashA = Math.min(0.8, flashA + flashEnergy('hit', T));       // 0.5
  assert.equal(flashA, 0.5);
  flashA = Math.min(0.8, flashA + flashEnergy('bossDeath', T)); // 0.5 + 0.5 -> clamp 0.8
  assert.equal(flashA, 0.8);
  flashA = Math.min(0.8, flashA + flashEnergy('droneExplode', T)); // 0.8 + 0.2 -> clamp 0.8
  assert.equal(flashA, 0.8);
});

test('the two largest bumps (hit + bossDeath) stack past the 0.8 cap', () => {
  const top = flashEnergy('hit', T) + flashEnergy('bossDeath', T);
  assert.ok(top > 0.8, 'top two bumps must exceed the cap so a double-hit reads at full white');
});
