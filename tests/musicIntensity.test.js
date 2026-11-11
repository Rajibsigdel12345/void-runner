// ST-170 (I170): the wave -> music-intensity mapping is monotonic, asymptotes below
// 1 (leaving headroom for the boss floor), clamps to [0,1], defaults safely on a
// missing/zero world, and a live boss lifts intensity to at least bossFloor.
// ST-241 (I249): the boss floor eases in over boss.entered, a phase-2 enrage lift
// (capped at 1), and a post-death release decay from world.bossRelease back to the
// wave tension. Legacy fixtures without `entered` keep the exact ST-170 behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { musicIntensityX } from '../src/core/musicIntensity.js';

const O = { waveK: 12, waveCeil: 0.75, bossFloor: 0.9 };
const w = (wave, bossAlive = false) => ({ wave, boss: bossAlive ? { alive: true } : null });

test('wave 1 starts at 0 (calm)', () => {
  assert.equal(musicIntensityX(w(1), O), 0);
});

test('monotonic non-decreasing across waves', () => {
  let prev = -1;
  for (let wave = 1; wave <= 80; wave++) {
    const x = musicIntensityX(w(wave), O);
    assert.ok(x >= prev - 1e-9, 'not non-decreasing at wave ' + wave + ': ' + x + ' < ' + prev);
    prev = x;
  }
});

test('asymptotes below 1 on the non-boss path (headroom for boss)', () => {
  const x = musicIntensityX(w(200), O);
  assert.ok(x < 1, 'expected < 1, got ' + x);
  assert.ok(x > 0.7, 'expected late-game tension > 0.7, got ' + x);
});

test('always clamps to [0,1]', () => {
  for (let wave = 1; wave <= 300; wave++) {
    for (const boss of [false, true]) {
      const x = musicIntensityX(w(wave, boss), O);
      assert.ok(x >= 0 && x <= 1, 'out of range at wave ' + wave + ' boss=' + boss + ': ' + x);
    }
  }
});

test('a live boss lifts intensity to at least bossFloor', () => {
  assert.ok(musicIntensityX(w(1, true), O) >= O.bossFloor);
  assert.ok(musicIntensityX(w(5, true), O) >= O.bossFloor);
});

test('a boss at a low wave overrides the small wave value', () => {
  assert.ok(musicIntensityX(w(2, true), O) > musicIntensityX(w(2), O));
});

test('missing / zero world defaults safely to 0', () => {
  assert.equal(musicIntensityX(null, O), 0);
  assert.equal(musicIntensityX({ wave: 0 }, O), 0);
  assert.equal(musicIntensityX({}, O), 0);
});


// ST-241 (I249): entry ramp - the boss floor eases in over the entrance window.

test('entry ramp: entered 0 gives the pure wave value', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK)); // wave 5
  assert.equal(musicIntensityX({ wave: 5, boss: { alive: true, entered: 0 } }, O), waveX);
});

test('entry ramp: monotonically approaches the floor as entered rises', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  let prev = waveX;
  for (const e of [0.25, 0.5, 0.75, 1]) {
    const x = musicIntensityX({ wave: 5, boss: { alive: true, entered: e } }, O);
    assert.ok(x >= prev - 1e-9, 'not non-decreasing at entered ' + e + ': ' + x + ' < ' + prev);
    assert.equal(x, waveX + (O.bossFloor - waveX) * e, 'ramp value off at entered ' + e);
    prev = x;
  }
});

test('entry ramp: entered 1 equals the legacy full floor (ST-170 parity)', () => {
  assert.equal(musicIntensityX({ wave: 5, boss: { alive: true, entered: 1 } }, O),
               musicIntensityX({ wave: 5, boss: { alive: true } }, O));
});

test('entry ramp: out-of-range entered clamps (negative -> wave value, >1 -> floor)', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  assert.equal(musicIntensityX({ wave: 5, boss: { alive: true, entered: -2 } }, O), waveX);
  assert.equal(musicIntensityX({ wave: 5, boss: { alive: true, entered: 5 } }, O), O.bossFloor);
});

test('phase-2 lift: enrage raises intensity, capped at 1', () => {
  const p1 = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1, phase: 1 } }, O);
  const p2 = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1, phase: 2 } }, O);
  assert.equal(p2, p1 + 0.1);
  assert.equal(p2, 1, 'floor 0.9 + lift 0.1 caps at exactly 1');
});

test('phase-2 lift: caps even when floor + lift would exceed 1', () => {
  const x = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1, phase: 2 } },
    { waveK: 12, waveCeil: 0.75, bossFloor: 0.95, phase2Lift: 0.2 });
  assert.equal(x, 1);
});

test('phase-2 lift: absent in phase 1 (no leak)', () => {
  const x = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1, phase: 1 } }, O);
  assert.equal(x, O.bossFloor);
});

test('release: bossRelease 1 holds the peak (floor + lift capped)', () => {
  const x = musicIntensityX({ wave: 5, boss: null, bossRelease: 1 }, O);
  assert.equal(x, 1);
});

test('release: midpoint decays linearly between peak and wave tension', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  const mid = musicIntensityX({ wave: 5, boss: null, bossRelease: 0.5 }, O);
  assert.equal(mid, waveX + (1 - waveX) * 0.5);
});

test('release: 0 falls back to the pure wave value', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  assert.equal(musicIntensityX({ wave: 5, boss: null, bossRelease: 0 }, O), waveX);
  assert.equal(musicIntensityX({ wave: 5, boss: null }, O), waveX);
});

test('release: non-finite bossRelease guards to the wave value', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  for (const bad of [NaN, undefined, 'x', null]) {
    const x = musicIntensityX({ wave: 5, boss: null, bossRelease: bad }, O);
    assert.equal(x, waveX, 'bad bossRelease ' + bad + ' -> ' + x);
  }
});

test('release: a live boss wins over a stale bossRelease', () => {
  const x = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1 }, bossRelease: 1 }, O);
  assert.equal(x, O.bossFloor);
});

test('release: still clamps to [0,1] across the whole arc', () => {
  for (let r = 0; r <= 1.0001; r += 0.05) {
    const x = musicIntensityX({ wave: 40, boss: null, bossRelease: r }, O);
    assert.ok(x >= 0 && x <= 1, 'out of range at r=' + r + ': ' + x);
  }
});

test('arc end-to-end: ramp up -> phase 2 -> release decays back to waveX', () => {
  const waveX = O.waveCeil * (1 - Math.exp(-4 / O.waveK));
  const up = [];
  for (const e of [0, 0.5, 1]) up.push(musicIntensityX({ wave: 5, boss: { alive: true, entered: e } }, O));
  const peak = musicIntensityX({ wave: 5, boss: { alive: true, entered: 1, phase: 2 } }, O);
  assert.equal(peak, 1);
  const down = [1, 0.5, 0].map((r) => musicIntensityX({ wave: 5, boss: null, bossRelease: r }, O));
  assert.ok(up[2] >= up[1] && up[1] >= up[0], 'entry ramp monotone');
  assert.ok(down[0] >= down[1] && down[1] >= down[2], 'release decay monotone');
  assert.ok(down[0] > down[2], 'peak above the wave value');
  assert.equal(down[2], waveX, 'release lands exactly on the wave tension');
});

test('honors custom tunables (faster build reaches higher)', () => {
  const slow = musicIntensityX(w(10), { waveK: 12, waveCeil: 0.75, bossFloor: 0.9 });
  const fast = musicIntensityX(w(10), { waveK: 3, waveCeil: 1, bossFloor: 0.5 });
  assert.ok(fast > slow, 'fast ' + fast + ' should exceed slow ' + slow);
});