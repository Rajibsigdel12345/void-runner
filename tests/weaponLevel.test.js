// ST-122: weapon progression (levels by wave) tests (core-only)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;
function freshWorld(seed) { const w = new World(new RNG(seed)); w.begin(); return w; }

test('weaponLevel: config levels are sane and ordered', () => {
  const lv = CONFIG.weapon.levels;
  assert.ok(Array.isArray(lv) && lv.length >= 2, 'levels array >= 2');
  assert.equal(lv[0].minWave, 1, 'level 1 is the base (wave 1)');
  for (let i = 1; i < lv.length; i++) assert.ok(lv[i].minWave > lv[i - 1].minWave, 'minWave strictly increasing');
  for (const s of lv) {
    assert.ok(s.count >= 1, 'count >= 1');
    assert.ok(s.arc >= 0, 'arc >= 0');
    assert.ok(s.rateMul >= 1, 'rateMul >= 1');
  }
});

test('weaponLevel: thresholds map wave -> level', () => {
  const w = freshWorld(11);
  for (const [wave, expect] of [[0, 1], [1, 1], [4, 1], [5, 2], [9, 2], [10, 3], [99, 3]]) {
    w.waves.wave = wave;
    assert.equal(w.weaponLevel(), expect, 'wave ' + wave + ' -> ' + expect);
  }
});

test('weaponLevel: weaponSpec reflects the current level', () => {
  const w = freshWorld(12);
  w.waves.wave = 10; // L3
  const spec = w.weaponSpec();
  const lv = CONFIG.weapon.levels[2];
  assert.equal(spec.count, lv.count, 'L3 count');
  assert.equal(spec.arc, lv.arc, 'L3 arc');
  assert.equal(spec.rateMul, lv.rateMul, 'L3 rateMul');
});

test('weaponLevel: fireWeapon fires the level bullet count', () => {
  let w = freshWorld(13); // wave 1 -> L1 (single)
  w.fireWeapon();
  assert.equal(w.weapons.count, CONFIG.weapon.levels[0].count, 'L1 fires 1');
  w = freshWorld(14);
  w.waves.wave = 10; // L3 (triple)
  w.fireWeapon();
  assert.equal(w.weapons.count, CONFIG.weapon.levels[2].count, 'L3 fires 3');
});

test('weaponLevel: crossing a threshold emits weaponLevelUp and tracks the level', () => {
  const w = freshWorld(15);
  assert.equal(w._wlevel, 1, 'starts at level 1');
  w.waves.wave = 5; // into L2
  w.step(DT, NOINTENT);
  const up = w.drainEvents().find(e => e.type === 'weaponLevelUp');
  assert.ok(up, 'weaponLevelUp emitted');
  assert.equal(up.data.level, 2, 'level 2');
  assert.equal(w._wlevel, 2, 'tracked');
});

test('weaponLevel: the fire event carries the level', () => {
  const w = freshWorld(16);
  w.waves.wave = 10; // L3
  w.fireWeapon();
  const f = w.drainEvents().find(e => e.type === 'fire');
  assert.ok(f, 'fire event');
  assert.equal(f.data.level, 3, 'level carried on fire');
});
