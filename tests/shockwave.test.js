// ST-238 (I245): class-scaled shockwave ring table (pure core + config block).
import test from 'node:test';
import assert from 'node:assert/strict';
import { shockwaveRadius } from '../src/core/shockwave.js';
import { CONFIG } from '../src/core/config.js';

const SW = CONFIG.fx.shockwave;

test('config: the shockwave block exists with finite tunables', () => {
  assert.ok(SW, 'CONFIG.fx.shockwave');
  assert.ok(SW.classes && typeof SW.classes === 'object');
  assert.ok(Number.isFinite(SW.life) && SW.life > 0, 'life positive finite');
  assert.ok(Number.isFinite(SW.baseOpacity) && SW.baseOpacity > 0 && SW.baseOpacity <= 1, 'baseOpacity in (0,1]');
  assert.ok(Number.isInteger(SW.pool) && SW.pool >= 1 && SW.pool <= 16, 'pool in [1,16]');
  assert.ok(Number.isFinite(SW.height) && SW.height >= 0, 'height finite non-negative');
});

test('the ST-238 spec classes all carry a rung: S M L drone stinger warden', () => {
  for (const k of ['S', 'M', 'L', 'drone', 'stinger', 'warden']) {
    assert.ok(Number.isFinite(SW.classes[k]) && SW.classes[k] > 0, 'classes.' + k);
  }
});

test('rock rungs scale with rock size (S < M < L)', () => {
  assert.ok(SW.classes.S < SW.classes.M);
  assert.ok(SW.classes.M < SW.classes.L);
});

test('enemy rungs stay ordered (drone < stinger < warden)', () => {
  assert.ok(SW.classes.drone < SW.classes.stinger);
  assert.ok(SW.classes.stinger < SW.classes.warden);
});

test('all rungs are inside the readable band (1..5 world units)', () => {
  for (const k in SW.classes) assert.ok(SW.classes[k] >= 1 && SW.classes[k] <= 5, 'classes.' + k + ' in band');
});

test('shockwaveRadius: mapped classes return the table value', () => {
  for (const k of ['S', 'M', 'L', 'drone', 'stinger', 'warden']) {
    assert.equal(shockwaveRadius(k, SW), SW.classes[k]);
  }
});

test('shockwaveRadius: unmapped kill classes get no ring (mine, flyer, boss)', () => {
  for (const k of ['mine', 'flyer', 'boss', 'splicer']) {
    assert.equal(shockwaveRadius(k, SW), 0);
  }
});

test('shockwaveRadius: invalid args return 0 without throwing', () => {
  assert.equal(shockwaveRadius(null, SW), 0);
  assert.equal(shockwaveRadius('', SW), 0);
  assert.equal(shockwaveRadius('S', null), 0);
  assert.equal(shockwaveRadius('S', {}), 0);
  assert.equal(shockwaveRadius('S', { classes: null }), 0);
});

test('shockwaveRadius: non-finite / negative / zero / non-numeric rungs are rejected (0)', () => {
  assert.equal(shockwaveRadius('x', { classes: { x: NaN } }), 0);
  assert.equal(shockwaveRadius('x', { classes: { x: -2 } }), 0);
  assert.equal(shockwaveRadius('x', { classes: { x: 0 } }), 0);
  assert.equal(shockwaveRadius('x', { classes: { x: 'big' } }), 0);
});
