// ST-018: persistent storage tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Storage, DEFAULT_SETTINGS, STORE_VERSION } from '../src/core/storage.js';
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
