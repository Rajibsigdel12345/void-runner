// ST-018: persistent storage tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage, DEFAULT_SETTINGS, STORE_VERSION, migratePayload, toggleFxQuality } from '../src/core/storage.js';
import { CONFIG } from '../src/core/config.js';

function memStore() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => { m.set(k, v); },
    remove: (k) => { m.delete(k); },
    _map: m,
  };
}
function throwingStore() {
  return {
    get: () => { throw new Error('denied'); },
    set: () => { throw new Error('denied'); },
    remove: () => { throw new Error('denied'); },
  };
}

test('storage: best starts at 0 and round-trips across instances', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.equal(a.getBest(), 0);
  assert.ok(a.setBest(490));
  assert.equal(a.getBest(), 490);
  const b = new Storage(store); // same backing store, new instance
  assert.equal(b.getBest(), 490);
  const raw = JSON.parse(store.get(a.bestKey));
  assert.equal(raw.version, STORE_VERSION);
});

test('storage: setBest only raises and flags NEW BEST', () => {
  const a = new Storage(memStore());
  assert.ok(a.setBest(100));
  assert.ok(!a.setBest(100), 'equal does not count');
  assert.ok(!a.setBest(50), 'lower does not count');
  assert.ok(a.setBest(120));
  assert.equal(a.getBest(), 120);
  assert.ok(!a.setBest(-5), 'negative floors to 0, never raises');
  assert.ok(!a.setBest(NaN), 'NaN never raises');
});

test('storage: uses CONFIG storage keys when injected', () => {
  const store = memStore();
  const s = new Storage(store, CONFIG.storage);
  s.setBest(77);
  assert.ok(store._map.has(CONFIG.storage.bestKey));
  assert.equal(new Storage(store, CONFIG.storage).getBest(), 77);
});

test('storage: corrupt payloads fall back safely', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.bestKey, '{not json');
  assert.equal(a.getBest(), 0);
  store.set(a.bestKey, JSON.stringify({ value: 'abc' }));
  assert.equal(a.getBest(), 0);
  store.set(a.bestKey, JSON.stringify({ value: -42 }));
  assert.equal(a.getBest(), 0);
  store.set(a.bestKey, JSON.stringify({ value: 3.9 }));
  assert.equal(a.getBest(), 3, 'floors to int');
});

test('storage: throwing store never throws', () => {
  const a = new Storage(throwingStore());
  assert.equal(a.getBest(), 0);
  assert.ok(!a.setBest(100));
  assert.deepEqual(a.getSettings(), { ...DEFAULT_SETTINGS });
  assert.deepEqual(a.setSettings({ volume: 0.5 }), { ...DEFAULT_SETTINGS, volume: 0.5 }, 'returns session values even when the write fails (not persisted, but usable)');
  assert.ok(!a.remove('voidrunner.best'), 'remove failure swallowed, reported false');
});

test('storage: settings defaults + partial merge + persistence', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.deepEqual(a.getSettings(), { ...DEFAULT_SETTINGS });
  const merged = a.setSettings({ volume: 0.25, sfx: false });
  assert.equal(merged.volume, 0.25);
  assert.equal(merged.sfx, false);
  assert.equal(merged.fx, DEFAULT_SETTINGS.fx, 'untouched keys keep defaults');
  const b = new Storage(store);
  assert.equal(b.getSettings().volume, 0.25);
  assert.equal(b.getSettings().sfx, false);
});

test('storage: settings validate and clamp bad values', () => {
  const a = new Storage(memStore());
  assert.equal(a.setSettings({ volume: 5 }).volume, 1);
  assert.equal(a.setSettings({ volume: -1 }).volume, 0);
  assert.equal(a.setSettings({ fx: 'ultra' }).fx, DEFAULT_SETTINGS.fx);
  assert.equal(a.setSettings({ reducedMotion: 'yes' }).reducedMotion, DEFAULT_SETTINGS.reducedMotion);
});



test('storage: invalid settings values rejected, numerics clamped', () => {
  const store = memStore();
  const a = new Storage(store);
  const r = a.setSettings({ fx: 'ultra', volume: 2.5, sfx: 'yes', reducedMotion: 1 });
  assert.equal(r.fx, 'high', "non high/low fx ignored");
  assert.equal(r.volume, 1, 'volume clamped to 1');
  assert.equal(r.sfx, true, 'non-boolean sfx ignored');
  assert.equal(r.reducedMotion, false, 'non-boolean reducedMotion ignored');
});

// I66: top-5 high-score board
test('storage: high scores start empty and survive corrupt payloads', () => {
  const store = memStore();
  const s = new Storage(store);
  assert.deepEqual(s.getHighScores(), []);
  store.set(s.highScoresKey, '{bad json');
  assert.deepEqual(s.getHighScores(), []);
  store.set(s.highScoresKey, JSON.stringify({ list: 'nope' }));
  assert.deepEqual(s.getHighScores(), []);
  store.set(s.highScoresKey, JSON.stringify({ list: [{ score: 50, wave: 2, kills: 3 }, { score: 'x', wave: 1, kills: 1 }, { score: 10, wave: 0, kills: 2 }, null, 42] }));
  assert.deepEqual(s.getHighScores(), [{ score: 50, wave: 2, kills: 3 }]); // malformed entries filtered
});

test('storage: recordScore inserts, sorts desc, caps at maxScores', () => {
  const s = new Storage(memStore());
  let last;
  for (const sc of [100, 300, 200, 500, 400, 150]) last = s.recordScore({ score: sc, wave: 2, kills: 4 });
  const list = s.getHighScores();
  assert.equal(list.length, 5); // 100 dropped by the cap
  assert.deepEqual(list.map((e) => e.score), [500, 400, 300, 200, 150]);
  assert.equal(last.rank, 5);
  assert.ok(!last.newBest);
});

test('storage: recordScore ranks, flags new best, ignores zero scores', () => {
  const s = new Storage(memStore());
  const r1 = s.recordScore({ score: 1000, wave: 3, kills: 9 });
  assert.equal(r1.rank, 1);
  assert.ok(r1.newBest);
  const r2 = s.recordScore({ score: 700, wave: 2, kills: 5 });
  assert.equal(r2.rank, 2);
  assert.ok(!r2.newBest);
  const r3 = s.recordScore({ score: 900, wave: 2, kills: 5 });
  assert.equal(r3.rank, 2); // 1000 still strictly above
  assert.ok(!r3.newBest);
  const r0 = s.recordScore({ score: 0, wave: 1, kills: 0 });
  assert.equal(r0.rank, 0);
  assert.ok(!r0.newBest);
  assert.deepEqual(s.getHighScores().map((e) => e.score), [1000, 900, 700]);
});

test('storage: high scores honor CONFIG keys and cap', () => {
  const store = memStore();
  const s = new Storage(store, CONFIG.storage);
  assert.equal(s.highScoresKey, CONFIG.storage.highScoresKey);
  assert.equal(s.maxScores, CONFIG.storage.highScoresMax);
  for (let i = 1; i <= 6; i++) s.recordScore({ score: i * 10, wave: 1, kills: i });
  assert.equal(s.getHighScores().length, 5);
});

test('storage: recordScore never throws on a throwing store', () => {
  const s = new Storage(throwingStore());
  const r = s.recordScore({ score: 500, wave: 4, kills: 12 });
  assert.deepEqual(r.list, [{ score: 500, wave: 4, kills: 12 }]); // computed in memory; the write failed silently
  assert.equal(r.rank, 1);
  assert.ok(r.newBest);
});

test('storage: fontScale defaults to 1, validates, and round-trips (I70)', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.equal(a.getSettings().fontScale, 1); // default
  assert.equal(a.setSettings({ fontScale: 1.25 }).fontScale, 1.25);
  assert.equal(a.getSettings().fontScale, 1.25); // round-trips
  assert.equal(new Storage(store).getSettings().fontScale, 1.25); // persists across instances
  assert.equal(a.setSettings({ fontScale: 2 }).fontScale, 1); // out of range -> default
  assert.equal(a.setSettings({ fontScale: '1.25' }).fontScale, 1); // wrong type -> default
  assert.equal(a.setSettings({ fontScale: 0.5 }).fontScale, 1); // below range -> default
  assert.equal(a.setSettings({ fontScale: 1.5 }).fontScale, 1.5); // valid max
  assert.equal(a.setSettings({ fontScale: 1 }).fontScale, 1); // valid min
});


// I79: versioning + migration + corruption guards
test('migratePayload: current version passes through unchanged', () => {
  const d = { value: 5 };
  assert.equal(migratePayload(1, d), d); // v1 === STORE_VERSION -> identity
});

test('migratePayload: missing version treated as legacy v1', () => {
  assert.deepEqual(migratePayload(undefined, { value: 7 }), { value: 7 });
  assert.deepEqual(migratePayload(null, { value: 7 }), { value: 7 });
});

test('migratePayload: unknown future version rejected (fallback)', () => {
  assert.equal(migratePayload(2, { value: 5 }), null);
  assert.equal(migratePayload(99, { list: [] }), null);
});

test('migratePayload: corrupt / non-integer version rejected', () => {
  assert.equal(migratePayload(0, { value: 1 }), null);
  assert.equal(migratePayload(-1, { value: 1 }), null);
  assert.equal(migratePayload(1.5, { value: 1 }), null);
  assert.equal(migratePayload('1', { value: 1 }), null);
});

test('migratePayload: non-object payloads rejected', () => {
  assert.equal(migratePayload(1, 'str'), null);
  assert.equal(migratePayload(1, 42), null);
  assert.equal(migratePayload(1, null), null);
  assert.equal(migratePayload(1, [1, 2]), null);
});

test('migratePayload: multi-step migration runs in order to targetVersion', () => {
  const steps = { 1: (d) => ({ ...d, b: 2 }), 2: (d) => ({ ...d, c: 3 }) };
  assert.deepEqual(migratePayload(1, { a: 1 }, steps, 3), { a: 1, b: 2, c: 3 });
});

test('migratePayload: a missing migration step aborts (no partial upgrade)', () => {
  const steps = { 1: (d) => ({ ...d, b: 2 }) }; // no step for 2 -> 3
  assert.equal(migratePayload(1, { a: 1 }, steps, 3), null);
});

test('migratePayload: a throwing migration aborts safely', () => {
  const steps = { 1: () => { throw new Error('boom'); } };
  assert.equal(migratePayload(1, { a: 1 }, steps, 2), null);
});

test('storage: a future-versioned settings payload falls back to defaults (ST-079)', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.settingsKey, JSON.stringify({ version: 2, volume: 0.9 }));
  assert.deepEqual(a.getSettings(), { ...DEFAULT_SETTINGS });
});

test('storage: a current-versioned settings payload is honored (ST-079)', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.settingsKey, JSON.stringify({ version: 1, volume: 0.3 }));
  assert.equal(a.getSettings().volume, 0.3);
});

test('storage: legacy (unversioned) settings payload still reads (backward compat, ST-079)', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.settingsKey, JSON.stringify({ volume: 0.4, sfx: false }));
  assert.equal(a.getSettings().volume, 0.4);
  assert.equal(a.getSettings().sfx, false);
});

test('storage: a future-versioned high-score board falls back to empty (ST-079)', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.highScoresKey, JSON.stringify({ version: 2, list: [{ score: 100, wave: 1, kills: 1 }] }));
  assert.deepEqual(a.getHighScores(), []);
});

test('storage: a future-versioned best falls back to 0 (ST-079)', () => {
  const store = memStore();
  const a = new Storage(store);
  store.set(a.bestKey, JSON.stringify({ version: 2, value: 999 }));
  assert.equal(a.getBest(), 0);
});

test('storage: daily best starts null and records/raises for a given day (ST-141)', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.equal(a.getDailyBest(), null);
  assert.deepEqual(a.recordDaily('2026-11-10', 500), { newBest: true, value: 500 });
  assert.deepEqual(a.getDailyBest(), { key: '2026-11-10', value: 500 });
  assert.deepEqual(a.recordDaily('2026-11-10', 300), { newBest: false, value: 500 }); // lower same-day does not raise
  assert.deepEqual(a.recordDaily('2026-11-10', 800), { newBest: true, value: 800 }); // higher same-day raises
  assert.equal(a.getDailyBest().value, 800);
});

test('storage: daily best rolls over to a new day (key differs -> fresh best) (ST-141)', () => {
  const store = memStore();
  const a = new Storage(store);
  a.recordDaily('2026-11-09', 9999);
  const r = a.recordDaily('2026-11-10', 10); // new day: even a smaller score is a fresh best
  assert.equal(r.newBest, true);
  assert.deepEqual(a.getDailyBest(), { key: '2026-11-10', value: 10 });
});

test('storage: daily best ignores zero scores (does not persist) (ST-141)', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.deepEqual(a.recordDaily('2026-11-10', 0), { newBest: false, value: 0 });
  assert.equal(a.getDailyBest(), null);
});

test('storage: daily best persists across instances and survives a corrupt payload (ST-141)', () => {
  const store = memStore();
  const a = new Storage(store);
  a.recordDaily('2026-11-10', 4242);
  const b = new Storage(store); // new instance, same backing store
  assert.deepEqual(b.getDailyBest(), { key: '2026-11-10', value: 4242 });
  store.set(b.dailyBestKey, JSON.stringify({ version: 2, key: 'x', value: 1 })); // unknown future version
  assert.equal(b.getDailyBest(), null); // degrades to null, no throw
});

test('storage: tutorial seen flag starts false, persists, and round-trips (I151)', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.equal(a.getTutorialSeen(), false); // absent -> false
  assert.ok(a.setTutorialSeen());
  assert.equal(a.getTutorialSeen(), true);
  const b = new Storage(store); // new instance, same backing store
  assert.equal(b.getTutorialSeen(), true);
  const raw = JSON.parse(store.get(a.tutorialKey));
  assert.equal(raw.version, STORE_VERSION);
  assert.equal(raw.seen, true);
});

test('storage: setTutorialSeen is idempotent and survives corrupt/unknown payloads (I151)', () => {
  const store = memStore();
  const a = new Storage(store);
  a.setTutorialSeen();
  a.setTutorialSeen(); // second write: still true, no throw
  assert.equal(a.getTutorialSeen(), true);
  store.set(a.tutorialKey, '{not json'); // corrupt -> degrades to false, no throw
  assert.equal(a.getTutorialSeen(), false);
  store.set(a.tutorialKey, JSON.stringify({ version: 2, seen: true })); // unknown future version
  assert.equal(a.getTutorialSeen(), false);
});

test('storage: uses the injected tutorialKey when provided (I151)', () => {
  const store = memStore();
  const a = new Storage(store, { tutorialKey: 'custom.tutorial' });
  assert.equal(a.tutorialKey, 'custom.tutorial');
  a.setTutorialSeen();
  assert.ok(store._map.has('custom.tutorial'));
  assert.equal(new Storage(store, { tutorialKey: 'custom.tutorial' }).getTutorialSeen(), true);
});

test('storage: shapeCues defaults on, round-trips, and rejects bad types (I155)', () => {
  const store = memStore();
  const a = new Storage(store);
  assert.equal(a.getSettings().shapeCues, true); // default on (colorblind-friendly)
  assert.equal(a.setSettings({ shapeCues: false }).shapeCues, false);
  assert.equal(a.getSettings().shapeCues, false); // round-trips
  assert.equal(new Storage(store).getSettings().shapeCues, false); // persists across instances
  assert.equal(a.setSettings({ shapeCues: 'no' }).shapeCues, true); // non-boolean -> default
  store.set(a.settingsKey, '{bad json');
  assert.equal(a.getSettings().shapeCues, true); // corrupt -> default, no throw
});

test('storage: toggleFxQuality cycles high -> low -> off -> high, unknown as high (I157/ST-224)', () => {
  assert.equal(toggleFxQuality('high'), 'low');
  assert.equal(toggleFxQuality('low'), 'off');
  assert.equal(toggleFxQuality('off'), 'high');
  assert.equal(toggleFxQuality(undefined), 'low'); // missing -> treated as high -> flips to low
  assert.equal(toggleFxQuality('garbage'), 'low');
  assert.equal(toggleFxQuality(toggleFxQuality(toggleFxQuality('high'))), 'high'); // triple flip = identity (ST-224)
});

test('storage: fx 3-tier persistence - off round-trips, invalid rejected, old 2-tier values still valid (ST-224)', () => {
  const store = memStore();
  const s = new Storage(store);
  assert.equal(s.getSettings().fx, 'high'); // default unchanged
  assert.equal(s.setSettings({ fx: 'off' }).fx, 'off');
  assert.equal(s.getSettings().fx, 'off'); // round-trip
  assert.equal(s.setSettings({ fx: 'ultra' }).fx, 'high'); // invalid -> default (same clean semantics as the 2-tier build)
  assert.equal(s.setSettings({ fx: 'low' }).fx, 'low');
  assert.equal(s.setSettings({ fx: 'high' }).fx, 'high'); // old 2-tier values stay valid
});

test('storage: I158 options (music / colorblindPreview / slowmoHint) defaults, round-trip, reject, corrupt', () => {
  const store = memStore();
  const a = new Storage(store);
  const g = a.getSettings();
  assert.equal(g.music, true);            // default on
  assert.equal(g.colorblindPreview, false); // default off
  assert.equal(g.slowmoHint, true);       // default on
  const m = a.setSettings({ music: false, colorblindPreview: true, slowmoHint: false });
  assert.equal(m.music, false);
  assert.equal(m.colorblindPreview, true);
  assert.equal(m.slowmoHint, false);
  const b = new Storage(store); // persists across instances
  assert.equal(b.getSettings().music, false);
  assert.equal(b.getSettings().colorblindPreview, true);
  assert.equal(b.getSettings().slowmoHint, false);
  const bad = a.setSettings({ music: 'yes', colorblindPreview: 1, slowmoHint: 'no' }); // non-boolean -> default
  assert.equal(bad.music, true);
  assert.equal(bad.colorblindPreview, false);
  assert.equal(bad.slowmoHint, true);
  store.set(a.settingsKey, '{bad json');
  const c = a.getSettings(); // corrupt -> defaults, no throw
  assert.equal(c.music, true);
  assert.equal(c.colorblindPreview, false);
  assert.equal(c.slowmoHint, true);
});
