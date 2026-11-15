// ST-374 (I404): src/core/strings.js - locales-ready presentation strings (DOM-free unit tests).
// (a) en table is the byte-faithful source of truth and non-empty; (b) extraction completeness:
// every t()/kc() literal-key call in the 8 rewired source files resolves to an existing en key;
// (c) the dynamic key families (string-concatenated in source) exist; (d) substitution,
// locale fallback, missing-key and unknown-locale semantics.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRINGS, KEYCAPS, getLocale, setLocale, t, kc } from '../src/core/strings.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'src/render/screens.js',
  'src/render/hud.js',
  'src/render/waveBanner.js',
  'src/render/killFeed.js',
  'src/render/tutorialOverlay.js',
  'src/render/settingsPanel.js',
  'src/render/bossHealth.js',
  'src/main.js',
];
// Matches t('key') / tr('key') / kc('key') / kcap('key') calls whose string literal is the FULL
// first argument (followed by ) or ,). Partial concatenations like tr('hud.pu.' + type) are
// intentionally excluded - they are covered by the dynamic-family assertions below.
const CALL_RE = /(?<![a-zA-Z0-9_.$])(t|tr|kc|kcap)\('([^']+)'\s*[,)]/g;

function literalKeys(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const tKeys = new Set();
  const kKeys = new Set();
  for (const m of src.matchAll(CALL_RE)) {
    if (m[1] === 'kc' || m[1] === 'kcap') kKeys.add(m[2]);
    else tKeys.add(m[2]);
  }
  return { tKeys, kKeys };
}

test('strings: default locale is en and the tables are non-empty', () => {
  assert.equal(getLocale(), 'en');
  assert.ok(Object.keys(STRINGS.en).length >= 140, 'en string table');
  assert.ok(Object.keys(KEYCAPS.en).length >= 14, 'en keycap table');
});

test('strings: every literal t()/kc() key in the 8 source files exists in the en tables', () => {
  for (const f of FILES) {
    const { tKeys, kKeys } = literalKeys(f);
    assert.ok(tKeys.size > 0 || kKeys.size > 0, f + ': no t()/kc() calls - rewire regression?');
    for (const k of tKeys) assert.notEqual(STRINGS.en[k], undefined, f + ': missing string key ' + k);
    for (const k of kKeys) assert.notEqual(KEYCAPS.en[k], undefined, f + ': missing keycap key ' + k);
  }
});

test('strings: dynamic key families exist (keys concatenated in the source)', () => {
  const families = [
    'hud.pu.rapid', 'hud.pu.spread', 'hud.pu.shield', 'hud.pu.magnet', 'hud.pu.overdrive', 'hud.pu.slowmo',
    'hud.mod.fast', 'hud.mod.small', 'hud.mod.inward', 'hud.mod.big',
    'settings.fx.high', 'settings.fx.low', 'settings.fx.off',
    'settings.font_scale.normal', 'settings.font_scale.large', 'settings.font_scale.xl',
    'boss.splicer', 'boss.monolith',
    'state.on', 'state.off', 'state.high', 'state.low',
  ];
  for (const k of families) assert.notEqual(STRINGS.en[k], undefined, 'missing dynamic key ' + k);
});
test('strings: t() substitutes {named} placeholders', () => {
  assert.equal(t('over.stats_accuracy', { acc: 95, hit: 10, fired: 20 }), 'ACCURACY 95%    SHOTS 10/20');
  assert.equal(t('menu.status_line', { mute: 'ON', fx: 'HIGH', music: 'ON' }), 'M \u2014 MUTE (ON)     F \u2014 FX (HIGH)     N \u2014 MUSIC (ON)');
  assert.equal(t('replays.row_stat', { score: 12, wave: 3, kills: 4, time: '0:42' }), 'SCORE 12    WAVE 3    4 KILLS    0:42');
  assert.equal(t('banner.boss_sub', { n: 5, hp: 120 }), 'WAVE 5 \u00b7 120 HP');
});
test('strings: unknown placeholder -> empty string', () => { assert.equal(t('hud.wave', {}), 'WAVE '); });
test('strings: missing key returns empty string (never the raw key)', () => { assert.equal(t('nope.nothere'), ''); assert.equal(kc('nope.nothere'), ''); });
test('strings: kc() resolves keycap labels', () => { assert.equal(kc('mouse'), 'MOUSE'); assert.equal(kc('wasd_arrows'), 'WASD / ARROWS'); assert.equal(kc('two_fingers'), '2 FINGERS'); });
test('strings: setLocale(unknown) is ignored', () => { setLocale('xx'); assert.equal(getLocale(), 'en'); });
test('strings: locale fallback - missing locale key falls back to en', () => {
  STRINGS.zztest = { 'menu.board': 'ZZBOARD' };
  setLocale('zztest');
  try {
    assert.equal(t('menu.board'), 'ZZBOARD');
    assert.equal(t('menu.tagline'), STRINGS.en['menu.tagline']);
  } finally {
    setLocale('en');
    delete STRINGS.zztest;
  }
});
