// ST-162: E8D test batch - stats storage, hotkey storage contract, and the
// ST-142 result codec (share.js) hardening. Pure core, DOM-free, node --test.
// Companion to tests/storage.test.js + tests/share.test.js (no duplication:
// those cover defaults/round-trip basics; this batch pins the edges).
import test from "node:test";
import assert from "node:assert/strict";
import { Storage, DEFAULT_SETTINGS, STORE_VERSION, toggleFxQuality } from "../src/core/storage.js";
import { encodeResult, decodeResult } from "../src/core/share.js";

function memStore() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => { m.set(k, String(v)); },
    remove: (k) => { m.delete(k); },
  };
}

function freshStorage(keys) {
  return new Storage(memStore(), keys || {});
}

// ------------------------------------------------------------------ codec
test("codec: encode clamps out-of-range / NaN / undefined inputs to the safe floor", () => {
  const code = encodeResult({ seed: -5, score: NaN, wave: 0, kills: undefined });
  const d = decodeResult(code);
  assert.equal(d.ok, true);
  assert.deepEqual({ seed: d.seed, score: d.score, wave: d.wave, kills: d.kills }, { seed: 0, score: 0, wave: 1, kills: 0 });
});

test("codec: decode rejects a tampered body (checksum mismatch)", () => {
  const code = encodeResult({ seed: 1, score: 0, wave: 1, kills: 0 });
  const parts = code.split(".");
  assert.equal(parts[2], "0");
  parts[2] = "1"; // score 0 -> 1
  assert.deepEqual(decodeResult(parts.join(".")), { ok: false });
});

test("codec: decode rejects a tampered checksum", () => {
  const code = encodeResult({ seed: 123456, score: 987, wave: 3, kills: 42 });
  const parts = code.split(".");
  const last = parts[5];
  const c = last[1] === "9" ? "0" : "9";
  const alt = last[0] + c;
  assert.notEqual(alt, last);
  parts[5] = alt;
  assert.deepEqual(decodeResult(parts.join(".")), { ok: false });
});

test("codec: decode rejects wrong field counts (5 or 7 parts)", () => {
  const code = encodeResult({ seed: 9, score: 9, wave: 2, kills: 3 });
  const parts = code.split(".");
  assert.equal(parts.length, 6);
  assert.deepEqual(decodeResult(parts.slice(0, 5).join(".")), { ok: false });
  assert.deepEqual(decodeResult(parts.concat(["00"]).join(".")), { ok: false });
});

test("codec: decode rejects non-string, empty, and upper-case input", () => {
  assert.deepEqual(decodeResult(null), { ok: false });
  assert.deepEqual(decodeResult(12345), { ok: false });
  assert.deepEqual(decodeResult({}), { ok: false });
  assert.deepEqual(decodeResult(""), { ok: false });
  const code = encodeResult({ seed: 35, score: 0, wave: 1, kills: 0 }); // seed 35 is base36 'z'
  const parts = code.split(".");
  assert.equal(parts[1], "z");
  parts[1] = "Z";
  assert.deepEqual(decodeResult(parts.join(".")), { ok: false });
});

test("codec: custom magic round-trips and cross-magic decode fails both ways", () => {
  const c2 = encodeResult({ seed: 7, score: 100, wave: 2, kills: 3 }, "test2");
  const d = decodeResult(c2, "test2");
  assert.equal(d.ok, true);
  assert.deepEqual({ seed: d.seed, score: d.score, wave: d.wave, kills: d.kills }, { seed: 7, score: 100, wave: 2, kills: 3 });
  assert.deepEqual(decodeResult(c2), { ok: false }); // default magic rejects the custom-magic code
  const c1 = encodeResult({ seed: 7, score: 100, wave: 2, kills: 3 });
  assert.deepEqual(decodeResult(c1, "test2"), { ok: false }); // custom magic rejects the default-magic code
  assert.notEqual(c1, c2);
});

test("codec: max representable values round-trip (seed 0xffffffff, others 0x7fffffff)", () => {
  const code = encodeResult({ seed: 0xffffffff, score: 0x7fffffff, wave: 0x7fffffff, kills: 0x7fffffff });
  const d = decodeResult(code);
  assert.equal(d.ok, true);
  assert.equal(d.seed, 0xffffffff);
  assert.equal(d.score, 0x7fffffff);
  assert.equal(d.wave, 0x7fffffff);
  assert.equal(d.kills, 0x7fffffff);
});

test("codec: checksum is always exactly 2 base36 chars (zero-padded)", () => {
  let padded = 0;
  for (let seed = 0; seed < 200; seed++) {
    const code = encodeResult({ seed, score: seed * 7, wave: 1 + (seed % 5), kills: seed % 11 });
    const parts = code.split(".");
    assert.equal(parts.length, 6);
    assert.equal(parts[5].length, 2);
    assert.match(parts[5], /^[0-9a-z]{2}$/);
    if (parts[5][0] === "0") padded++;
  }
  assert.ok(padded >= 1, "expected at least one zero-padded checksum within 200 seeds");
});

test("codec: distinct seeds produce distinct valid codes that all decode back", () => {
  const seen = new Set();
  for (let i = 0; i < 25; i++) {
    const seed = 1000 + i * 977;
    const code = encodeResult({ seed, score: i, wave: 1 + i, kills: i * 3 });
    assert.ok(!seen.has(code), "duplicate code for seed " + seed);
    seen.add(code);
    const d = decodeResult(code);
    assert.equal(d.ok, true);
    assert.equal(d.seed, seed);
  }
  assert.equal(seen.size, 25);
});

// ------------------------------------------------------------ stats storage
test("storage: recordScore ranks ties after strictly-greater entries only", () => {
  const st = freshStorage();
  const r1 = st.recordScore({ score: 100, wave: 2, kills: 5 });
  assert.deepEqual(r1, { list: [{ score: 100, wave: 2, kills: 5 }], rank: 1, newBest: true });
  assert.equal(st.recordScore({ score: 50, wave: 2, kills: 4 }).rank, 2);
  const r = st.recordScore({ score: 50, wave: 3, kills: 9 });
  assert.equal(r.rank, 2); // 100 strictly greater, then this entry - never newBest
  assert.equal(r.newBest, false);
  assert.deepEqual(r.list, [{ score: 100, wave: 2, kills: 5 }, { score: 50, wave: 2, kills: 4 }, { score: 50, wave: 3, kills: 9 }]);
});

test("storage: recordScore returns rank 0 and leaves a full board unchanged", () => {
  const st = freshStorage();
  for (const s of [500, 400, 300, 200, 100]) st.recordScore({ score: s, wave: 1, kills: 0 });
  const before = JSON.stringify(st.getHighScores());
  const r = st.recordScore({ score: 50, wave: 1, kills: 1 });
  assert.equal(r.rank, 0);
  assert.equal(r.newBest, false);
  assert.deepEqual(r.list, st.getHighScores());
  assert.equal(JSON.stringify(st.getHighScores()), before);
});

test("storage: recordScore sanitizes non-finite fields and ignores score <= 0", () => {
  const st = freshStorage();
  const r = st.recordScore({ score: 100, wave: NaN, kills: Infinity });
  assert.equal(r.rank, 1);
  assert.deepEqual(r.list, [{ score: 100, wave: 1, kills: 0 }]);
  assert.equal(st.recordScore({ score: 0, wave: 1, kills: 0 }).rank, 0);
  assert.equal(st.recordScore({ score: -50, wave: 1, kills: 0 }).rank, 0);
  assert.equal(st.recordScore({ score: NaN, wave: 1, kills: 0 }).rank, 0);
});

test("storage: newBest is true only when the entry lands at rank 1", () => {
  const st = freshStorage();
  assert.equal(st.recordScore({ score: 100, wave: 1, kills: 0 }).newBest, true);
  assert.equal(st.recordScore({ score: 200, wave: 2, kills: 1 }).newBest, true); // rank 1 again
  const r = st.recordScore({ score: 150, wave: 2, kills: 1 });
  assert.equal(r.rank, 2);
  assert.equal(r.newBest, false);
});

test("storage: setSettings discards unknown keys from the partial", () => {
  const st = freshStorage();
  const clean = st.setSettings({ volume: 0.5, bogusKey: 123, volume2: 9 });
  assert.ok(!("bogusKey" in clean));
  assert.ok(!("volume2" in clean));
  assert.equal(clean.volume, 0.5);
  assert.equal(clean.sfx, DEFAULT_SETTINGS.sfx);
});

test("storage: setSettings validates the merged value - invalid fx resets to the default tier", () => {
  const st = freshStorage();
  st.setSettings({ fx: "low", volume: 0.3 });
  const clean = st.setSettings({ fx: "medium" });
  assert.equal(clean.fx, DEFAULT_SETTINGS.fx); // invalid value -> default, the earlier 'low' is dropped
  assert.equal(clean.volume, 0.3); // untouched fields survive the partial
  const raw = JSON.parse(st.store.get("voidrunner.settings"));
  assert.equal(raw.fx, DEFAULT_SETTINGS.fx);
});

test("storage: written settings payload is { version, ...clean } with exactly the known keys", () => {
  const st = freshStorage();
  st.setSettings({ sfx: false, bogus: "nope" });
  const raw = JSON.parse(st.store.get("voidrunner.settings"));
  assert.equal(raw.version, STORE_VERSION);
  assert.equal(raw.sfx, false);
  assert.ok(!("bogus" in raw));
  const expectedKeys = Object.keys(DEFAULT_SETTINGS).slice().sort();
  const actualKeys = Object.keys(raw).filter((k) => k !== "version").sort();
  assert.deepEqual(actualKeys, expectedKeys);
});

test("storage: corrupt daily payload degrades (invalid JSON -> null, empty v1 -> empty key/zero)", () => {
  const st = freshStorage();
  st.store.set("voidrunner.daily", "this is not json");
  assert.equal(st.getDailyBest(), null);
  st.store.set("voidrunner.daily", JSON.stringify({ version: 1 }));
  assert.deepEqual(st.getDailyBest(), { key: "", value: 0 });
});

test("storage: recordDaily raises only on higher same-day scores and rolls over on a new day", () => {
  const st = freshStorage();
  assert.deepEqual(st.recordDaily("2026-01-01", -100), { newBest: false, value: 0 });
  assert.deepEqual(st.recordDaily("2026-01-01", 500), { newBest: true, value: 500 });
  assert.deepEqual(st.recordDaily("2026-01-01", 300), { newBest: false, value: 500 });
  assert.deepEqual(st.recordDaily("2026-01-02", 100), { newBest: true, value: 100 });
  assert.deepEqual(st.getDailyBest(), { key: "2026-01-02", value: 100 });
});

test("storage: getBest falls back to 0 for non-finite or non-numeric stored values", () => {
  const st = freshStorage();
  st.store.set("voidrunner.best", JSON.stringify({ version: 1, value: Number.NaN })); // JSON turns NaN into null
  assert.equal(st.getBest(), 0);
  st.store.set("voidrunner.best", JSON.stringify({ version: 1, value: "123" }));
  assert.equal(st.getBest(), 0);
  st.store.set("voidrunner.best", JSON.stringify({ version: 1, value: -40 }));
  assert.equal(st.getBest(), 0); // clamped at zero
  assert.equal(st.setBest(NaN), false); // non-finite never raises
  assert.equal(st.setBest(55), true);
  assert.equal(st.getBest(), 55);
});

// ---------------------------------------------------------- hotkey storage
test("hotkey: toggleFxQuality has strict parity over repeated flips", () => {
  let fx = "high";
  for (let i = 1; i <= 9; i++) {
    fx = toggleFxQuality(fx);
    assert.equal(fx, i % 2 === 1 ? "low" : "high");
  }
  assert.equal(toggleFxQuality("anything-weird"), "low"); // non-'low' input -> 'low' (defensive mirror)
});

test("hotkey: F contract - setSettings({fx}) persists, survives reload, and touches nothing else", () => {
  const st = freshStorage();
  st.setSettings({ volume: 0.3, sfx: false });
  st.setSettings({ fx: "low" }); // the F hotkey path
  const raw = JSON.parse(st.store.get("voidrunner.settings"));
  assert.equal(raw.fx, "low");
  // simulate a reload: a fresh Storage instance over the same store
  const st2 = new Storage(st.store, {});
  const s = st2.getSettings();
  assert.equal(s.fx, "low");
  assert.equal(s.volume, 0.3);
  assert.equal(s.sfx, false);
  assert.equal(s.reducedMotion, DEFAULT_SETTINGS.reducedMotion);
});
