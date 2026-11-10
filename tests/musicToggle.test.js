// ST-171 (I171): music hotkey contract. The N key path (main.js) is:
// storage.setSettings({ music: !current }) -> applySettings -> panel sync +
// toast - the unit-testable seam is the settings contract the hotkey rides
// on: music is a persisted boolean, defaults ON, non-boolean garbage is
// discarded, and repeated flips (the hotkey loop) round-trip cleanly.
// Pure core, DOM-free, node --test. Companion to tests/e8dBatch.test.js
// (the F contract pattern mirrored here; no duplication of storage basics).
import test from "node:test";
import assert from "node:assert/strict";
import { Storage, DEFAULT_SETTINGS } from "../src/core/storage.js";

function memStore() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => { m.set(k, v); },
    remove: (k) => { m.delete(k); },
    _map: m,
  };
}

test("music: default is ON (fresh player hears the bed)", () => {
  const st = new Storage(memStore());
  assert.equal(DEFAULT_SETTINGS.music, true);
  assert.equal(st.getSettings().music, true);
});

test("hotkey: N contract - setSettings({music}) persists, survives reload, and touches nothing else", () => {
  const st = new Storage(memStore());
  st.setSettings({ volume: 0.3, sfx: false });
  st.setSettings({ music: false }); // the N hotkey path
  const raw = JSON.parse(st.store.get("voidrunner.settings"));
  assert.equal(raw.music, false);
  // simulate a reload: a fresh Storage instance over the same store
  const st2 = new Storage(st.store, {});
  const s = st2.getSettings();
  assert.equal(s.music, false);
  assert.equal(s.volume, 0.3);
  assert.equal(s.sfx, false);
  assert.equal(s.fx, DEFAULT_SETTINGS.fx);
  assert.equal(s.reducedMotion, DEFAULT_SETTINGS.reducedMotion);
});

test("hotkey: N loop - nine flips through storage round-trip with strict parity", () => {
  const st = new Storage(memStore());
  let music = st.getSettings().music;
  for (let i = 1; i <= 9; i++) {
    music = !music;
    const merged = st.setSettings({ music });
    assert.equal(merged.music, music);
    assert.equal(st.getSettings().music, music); // read-back each flip
    assert.equal(music, i % 2 === 0); // ON -> OFF -> ON ...
  }
});

test("music: non-boolean partial values are discarded (setting stays a boolean)", () => {
  const st = new Storage(memStore());
  assert.equal(st.setSettings({ music: "yes" }).music, DEFAULT_SETTINGS.music); // string discarded
  assert.equal(st.setSettings({ music: 0 }).music, DEFAULT_SETTINGS.music); // 0 is not boolean
  assert.equal(st.setSettings({ music: null }).music, DEFAULT_SETTINGS.music); // null discarded
  // a valid flip still works after the garbage
  assert.equal(st.setSettings({ music: false }).music, false);
});