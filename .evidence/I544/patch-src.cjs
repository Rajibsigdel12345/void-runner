// I544 (ST-510, E74): patch 1 of 2 - strings.js i18n keys + main.js wiring + tests/strings.test.js FILES + new menuModel.js + menuModel.test.js.
// House pattern: latin1 round-trip, rep() unique-anchor guard. Template: .evidence/I529/edit529.cjs.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'latin1'); }
function write(p, s) { fs.writeFileSync(path.join(ROOT, p), s, 'latin1'); }
function rep(s, anchor, replacement, label) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ': anchor count ' + n + ' (expected 1)');
  return s.replace(anchor, replacement);
}

// --- 1. src/core/strings.js: 5 new keys x 3 locales, after each menu.start_key line ---
let strings = read('src/core/strings.js');
const marker = "'menu.start_key': '";
const parts = strings.split(marker);
if (parts.length !== 4) throw new Error('strings: menu.start_key count ' + (parts.length - 1) + ' (expected 3)');
const NEW_KEYS = [
  ["    'menu.continue': 'CONTINUE \\u2014 LV {level}',",
   "    'menu.continue_aria': 'Continue the campaign from level {level}',",
   "    'menu.new_game': 'NEW GAME',",
   "    'menu.settings': 'SETTINGS',",
   "    'menu.settings_aria': 'Toggle the settings panel',"],
  ["    'menu.continue': '\\u7ee7\\u7eed \\u2014 \\u7b2c{level}\\u5173',",
   "    'menu.continue_aria': '\\u4ece\\u7b2c{level}\\u5173\\u7ee7\\u7eed\\u6218\\u5f79',",
   "    'menu.new_game': '\\u65b0\\u6e38\\u620f',",
   "    'menu.settings': '\\u8bbe\\u7f6e',",
   "    'menu.settings_aria': '\\u6253\\u5f00\\u8bbe\\u7f6e\\u9762\\u677f',"],
  ["    'menu.continue': '\\u7d9a \\u2014 LV{level}',",
   "    'menu.continue_aria': '\\u30ec\\u30d9\\u30eb{level}\\u304b\\u3089\\u30ad\\u30e3\\u30e9\\u30fc\\u3092\\u7d9a\\u3059\\u308b',",
   "    'menu.new_game': '\\u65b0\\u4f5c\\u30ec\\u30fc\\u30e9',",
   "    'menu.settings': '\\u8a2d\\u5b9a',",
   "    'menu.settings_aria': '\\u8a2d\\u5b9a\\u30d1\\u30cd\\u30eb\\u3092\\u958b\\u304f',"]
];
let out = parts[0];
for (let i = 1; i <= 3; i++) {
  const p = parts[i];
  const nl = p.indexOf('\r\n');
  if (nl < 0) throw new Error('strings: no CRLF after menu.start_key occurrence ' + i);
  out += marker + p.slice(0, nl + 2) + '\r\n' + NEW_KEYS[i - 1].join('\r\n') + p.slice(nl + 2);
}
write('src/core/strings.js', out);
console.log('strings.js: 15 keys inserted (en/zh/ja)');

// --- 2. src/main.js: import + menuProgress seam + Enter decision ---
let main = read('src/main.js');
main = rep(main,
  "import { Storage, toggleFxQuality } from './core/storage.js';\r\n",
  "import { Storage, toggleFxQuality } from './core/storage.js';\r\nimport { menuModel } from './core/menuModel.js'; // ST-510 (I544) D1: Enter = continue/start decision\r\n",
  'main-import');
main = rep(main,
  '  menu: menuSettings, pause: pauseSettings, touch: coarse, // I71: touch-aware menu\r\n',
  '  menu: menuSettings, pause: pauseSettings, touch: coarse, // I71: touch-aware menu\r\n  menuProgress: () => storage.getCampaignProgress(), // ST-510 (I544) D1: fresh campaign progress for the CONTINUE primary\r\n',
  'main-settings');
main = rep(main,
  "      startRun('normal'); // ST-141: Enter starts a normal run (DAILY button for the daily run)\r\n",
  "      startRun(menuModel(storage.getCampaignProgress()).enterAction); // ST-510 (I544) D1: Enter = CONTINUE (campaign checkpoint, ST-457) when progress exists, else the pre-E74 endless path (bit-identical at progress 0)\r\n",
  'main-enter');
write('src/main.js', main);
console.log('main.js: 3 ops applied');

// --- 3. tests/strings.test.js: FILES += src/core/menuModel.js ---
let ts = read('tests/strings.test.js');
ts = rep(ts,
  "  'src/main.js',\n",
  "  'src/main.js',\n  'src/core/menuModel.js', // ST-510 (I544): the menu decision model t() keys must resolve\n",
  'tests-files');
write('tests/strings.test.js', ts);
console.log('tests/strings.test.js: FILES += menuModel.js');

// --- 4. src/core/menuModel.js (new, CRLF, ASCII) ---
const MM = [
  '// Void Runner - main-menu decision model (E74 / ST-510, I544). Pure core module: no three.js, no DOM.',
  '// Given the saved campaign progress (0 = none, 1..4 = highest level reached, storage.js) it decides',
  "// the menu's primary action: CONTINUE - LV N (checkpoint continue, ST-457) when progress exists,",
  '// otherwise the classic start prompt. screens.js (DOM) and main.js (the Enter hotkey) both consume',
  '// it, so the button label, its aria text, and what Enter does can never disagree.',
  '',
  "import { t } from './strings.js';",
  '',
  'export function menuModel(campaignProgress) {',
  '  const p = Number.isInteger(campaignProgress) && campaignProgress > 0 ? campaignProgress : 0;',
  '  return {',
  '    level: p,',
  '    hasContinue: p > 0,',
  "    primary: p > 0",
  "      ? { kind: 'continue', label: t('menu.continue', { level: p }), aria: t('menu.continue_aria', { level: p }) }",
  "      : { kind: 'start', label: t('menu.start_key'), tap: t('menu.start_tap') },",
  "    enterAction: p > 0 ? 'campaign' : 'normal', // 'normal' = the pre-E74 Enter path (endless)",
  '  };',
  '}',
  ''
].join('\r\n');
write('src/core/menuModel.js', MM);
console.log('src/core/menuModel.js written (' + Buffer.byteLength(MM, 'latin1') + ' B)');

// --- 5. tests/menuModel.test.js (new, LF, ASCII) ---
const T = [
  '// ST-510 (I544): src/core/menuModel.js - the pure core menu decision model (DOM-free unit tests).',
  "// (a) no progress -> classic start primary + 'normal' Enter (the pre-E74 bit-identical path);",
  '// (b) levels 1..4 -> CONTINUE - LV N primary + campaign Enter; (c) garbage coerces to no progress;',
  '// (d) the continue label + aria follow the locale; (e) K1: every ST-510 key resolves in every locale.',
  "import { test } from 'node:test';",
  "import assert from 'node:assert/strict';",
  '',
  "import { menuModel } from '../src/core/menuModel.js';",
  "import { STRINGS, LOCALES, setLocale } from '../src/core/strings.js';",
  '',
  "test('menuModel: no progress -> classic start primary + endless Enter (bit-identical pre-E74 path)', () => {",
  '  const m = menuModel(0);',
  '  assert.equal(m.level, 0);',
  '  assert.equal(m.hasContinue, false);',
  "  assert.equal(m.primary.kind, 'start');",
  "  assert.equal(m.primary.label, 'PRESS ENTER TO START');",
  "  assert.equal(m.primary.tap, 'TAP TO START');",
  "  assert.equal(m.enterAction, 'normal');",
  '});',
  '',
  "test('menuModel: levels 1..4 -> CONTINUE - LV N primary + campaign Enter', () => {",
  '  for (let p = 1; p <= 4; p++) {',
  '    const m = menuModel(p);',
  '    assert.equal(m.level, p);',
  '    assert.equal(m.hasContinue, true);',
  "    assert.equal(m.primary.kind, 'continue');",
  "    assert.ok(m.primary.label.includes(String(p)), 'label should name level ' + p);",
  "    assert.ok(m.primary.aria.length > 0, 'aria should be non-empty');",
  "    assert.equal(m.enterAction, 'campaign');",
  '  }',
  '});',
  '',
  "test('menuModel: garbage progress coerces to no progress', () => {",
  "  const garbage = [NaN, -1, 7, 1.5, null, undefined, '3', {}, true, false];",
  '  for (const g of garbage) {',
  '    const m = menuModel(g);',
  '    assert.equal(m.level, 0);',
  '    assert.equal(m.hasContinue, false);',
  "    assert.equal(m.enterAction, 'normal');",
  '  }',
  '});',
  '',
  "test('menuModel: continue label + aria follow the locale', () => {",
  "  setLocale('en');",
  '  const en = menuModel(2);',
  "  for (const loc of ['zh', 'ja']) {",
  '    setLocale(loc);',
  '    const m = menuModel(2);',
  '    assert.notEqual(m.primary.label, en.primary.label);',
  '    assert.notEqual(m.primary.aria, en.primary.aria);',
  '  }',
  "  setLocale('en');",
  '});',
  '',
  "test('menuModel: K1 - every ST-510 key resolves in every locale', () => {",
  "  const keys = ['menu.continue', 'menu.continue_aria', 'menu.new_game', 'menu.settings', 'menu.settings_aria'];",
  '  for (const loc of LOCALES) {',
  '    for (const k of keys) {',
  "    assert.ok(STRINGS[loc][k] !== undefined, loc + ' missing ' + k);",
  '    }',
  '  }',
  '});',
  ''
].join('\n');
write('tests/menuModel.test.js', T);
console.log('tests/menuModel.test.js written (' + Buffer.byteLength(T, 'latin1') + ' B)');
console.log('PATCH1 DONE');