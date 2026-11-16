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
import { STRINGS, KEYCAPS, getLocale, setLocale, onLocale, LOCALES, LOCALE_NAMES, t, kc } from '../src/core/strings.js';

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

test('strings: ST-375 LOCALES + LOCALE_NAMES are frozen, complete, native names non-empty', () => {
  assert.deepEqual(LOCALES, ['en', 'zh', 'ja']);
  assert.ok(Object.isFrozen(LOCALES));
  assert.ok(Object.isFrozen(LOCALE_NAMES));
  for (const l of LOCALES) assert.ok(typeof LOCALE_NAMES[l] === 'string' && LOCALE_NAMES[l].length > 0);
});
test('strings: ST-375 setLocale switches; zh table resolves for t() and kc() (ST-376 content)', () => {
  setLocale('zh');
  try {
    assert.equal(getLocale(), 'zh');
    assert.equal(t('menu.board'), STRINGS.zh['menu.board']);
    assert.notEqual(t('menu.board'), STRINGS.en['menu.board']);
    assert.equal(kc('mouse'), KEYCAPS.zh['mouse']);
    assert.notEqual(kc('mouse'), KEYCAPS.en['mouse']);
  } finally { setLocale('en'); }
});
test('strings: ST-375 onLocale fires only on actual change; unsubscribe stops delivery', () => {
  const seen = [];
  const offA = onLocale((l) => seen.push(['a', l]));
  const offB = onLocale((l) => seen.push(['b', l]));
  setLocale('zh');
  setLocale('zh'); // same locale: no fire
  offA();
  setLocale('ja');
  assert.deepEqual(seen, [['a', 'zh'], ['b', 'zh'], ['b', 'ja']]);
  offB();
  setLocale('en'); // no listeners left
  assert.deepEqual(seen, [['a', 'zh'], ['b', 'zh'], ['b', 'ja']]);
});
test('strings: ST-375 setLocale(unknown) ignored: locale unchanged, no fire', () => {
  const seen = [];
  const off = onLocale((l) => seen.push(l));
  setLocale('nope');
  assert.equal(getLocale(), 'en');
  assert.deepEqual(seen, []);
  off();
});

// ST-376 (I406): zh + ja locale tables + keycap localization maps
const phSet = (v) => [...String(v).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort().join(',');
test('strings: ST-376 zh + ja tables are key-identical to en (no missing, no extra)', () => {
  const enKeys = Object.keys(STRINGS.en).sort();
  for (const l of ['zh', 'ja']) {
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), enKeys, l + ' key set matches en');
  }
});
test('strings: ST-376 every zh + ja template keeps the same {placeholders} as en', () => {
  for (const l of ['zh', 'ja']) {
    for (const k of Object.keys(STRINGS.en)) {
      assert.equal(phSet(STRINGS[l][k]), phSet(STRINGS.en[k]), l + ' ' + k);
    }
  }
});
test('strings: ST-376 boss names stay English in zh + ja (plan locale rule)', () => {
  for (const l of ['zh', 'ja']) {
    assert.equal(STRINGS[l]['banner.boss.splicer'], 'THE SPLICER');
    assert.equal(STRINGS[l]['banner.boss.monolith'], 'THE MONOLITH');
    assert.equal(STRINGS[l]['boss.splicer'], 'THE SPLICER');
    assert.equal(STRINGS[l]['boss.monolith'], 'THE MONOLITH');
    assert.equal(STRINGS[l]['feed.warden'], 'WARDEN');
  }
});
test('strings: ST-376 KEYCAPS zh + ja complete; single-letter hardware keys stay Latin', () => {
  const enKeys = Object.keys(KEYCAPS.en).sort();
  for (const l of ['zh', 'ja']) {
    assert.deepEqual(Object.keys(KEYCAPS[l]).sort(), enKeys, l + ' keycap set matches en');
    for (const k of ['m', 'f', 'n', 'p', 'r', 'q']) assert.equal(KEYCAPS[l][k], KEYCAPS.en[k]);
  }
  setLocale('ja');
  try { assert.equal(kc('wasd_arrows'), KEYCAPS.ja['wasd_arrows']); } finally { setLocale('en'); }
});

// ST-420 (I450): campaign i18n keys resolve in all three locales; banner.stage keeps {n};
// Prime proper noun stays English in zh + ja (locale rule for boss names).
const I450_KEYS = ['menu.mode_endless','menu.mode_campaign','banner.stage','banner.boss.prime','boss.monolith_prime','over.victory_title'];
test('strings: ST-420 I450 campaign keys resolve in all three locales', () => {
  for (const l of LOCALES) {
    for (const k of I450_KEYS) assert.ok(typeof STRINGS[l][k] === 'string' && STRINGS[l][k].length > 0, l + ' missing ' + k);
  }
});
test('strings: ST-420 banner.stage placeholder + Prime proper noun', () => {
  assert.equal(phSet(STRINGS.en['banner.stage']), 'n');
  for (const l of ['en','zh','ja']) {
    assert.equal(phSet(STRINGS[l]['banner.stage']), 'n', l + ' banner.stage placeholders');
    assert.equal(STRINGS[l]['banner.boss.prime'], 'THE MONOLITH PRIME', l + ' prime banner is a proper noun');
    assert.equal(STRINGS[l]['boss.monolith_prime'], l === 'en' ? 'MONOLITH PRIME' : 'THE MONOLITH PRIME', l + ' prime HUD name');
  }
});
