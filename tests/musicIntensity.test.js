// ST-170 (I170): the wave -> music-intensity mapping is monotonic, asymptotes below
// 1 (leaving headroom for the boss floor), clamps to [0,1], defaults safely on a
// missing/zero world, and a live boss lifts intensity to at least bossFloor.
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

test('honors custom tunables (faster build reaches higher)', () => {
  const slow = musicIntensityX(w(10), { waveK: 12, waveCeil: 0.75, bossFloor: 0.9 });
  const fast = musicIntensityX(w(10), { waveK: 3, waveCeil: 1, bossFloor: 0.5 });
  assert.ok(fast > slow, 'fast ' + fast + ' should exceed slow ' + slow);
});