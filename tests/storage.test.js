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
