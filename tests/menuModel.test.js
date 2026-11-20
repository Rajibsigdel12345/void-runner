// ST-510 (I544): src/core/menuModel.js - the pure core menu decision model (DOM-free unit tests).
// (a) no progress -> classic start primary + 'normal' Enter (the pre-E74 bit-identical path);
// (b) levels 1..4 -> CONTINUE - LV N primary + campaign Enter; (c) garbage coerces to no progress;
// (d) the continue label + aria follow the locale; (e) K1: every ST-510 key resolves in every locale.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { menuModel } from '../src/core/menuModel.js';
import { STRINGS, LOCALES, setLocale } from '../src/core/strings.js';

test('menuModel: no progress -> classic start primary + endless Enter (bit-identical pre-E74 path)', () => {
  const m = menuModel(0);
  assert.equal(m.level, 0);
  assert.equal(m.hasContinue, false);
  assert.equal(m.primary.kind, 'start');
  assert.equal(m.primary.label, 'PRESS ENTER TO START');
  assert.equal(m.primary.tap, 'TAP TO START');
  assert.equal(m.enterAction, 'normal');
});

test('menuModel: levels 1..4 -> CONTINUE - LV N primary + campaign Enter', () => {
  for (let p = 1; p <= 4; p++) {
    const m = menuModel(p);
    assert.equal(m.level, p);
    assert.equal(m.hasContinue, true);
    assert.equal(m.primary.kind, 'continue');
    assert.ok(m.primary.label.includes(String(p)), 'label should name level ' + p);
    assert.ok(m.primary.aria.length > 0, 'aria should be non-empty');
    assert.equal(m.enterAction, 'campaign');
  }
});

test('menuModel: garbage progress coerces to no progress', () => {
  const garbage = [NaN, -1, 7, 1.5, null, undefined, '3', {}, true, false];
  for (const g of garbage) {
    const m = menuModel(g);
    assert.equal(m.level, 0);
    assert.equal(m.hasContinue, false);
    assert.equal(m.enterAction, 'normal');
  }
});

test('menuModel: continue label + aria follow the locale', () => {
  setLocale('en');
  const en = menuModel(2);
  for (const loc of ['zh', 'ja']) {
    setLocale(loc);
    const m = menuModel(2);
    assert.notEqual(m.primary.label, en.primary.label);
    assert.notEqual(m.primary.aria, en.primary.aria);
  }
  setLocale('en');
});

test('menuModel: K1 - every ST-510 key resolves in every locale', () => {
  const keys = ['menu.continue', 'menu.continue_aria', 'menu.new_game', 'menu.settings', 'menu.settings_aria'];
  for (const loc of LOCALES) {
    for (const k of keys) {
    assert.ok(STRINGS[loc][k] !== undefined, loc + ' missing ' + k);
    }
  }
});
