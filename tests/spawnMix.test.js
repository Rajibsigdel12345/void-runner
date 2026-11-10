// ST-131: data-driven spawn-mix table tests. I131 replaced the hardcoded pickSize
// ramp (0.3 S base, +0.02/wave from w10, 0.45 cap, L:M 3:4 within non-S) with
// config.spawnMix.rows. Waves 1-9 must stay byte-identical (same values AND the
// same 1-draw RNG width); only the wave 10+ shape changed (L floor 0.28-0.30,
// S cap 0.40).
import test from "node:test";
import assert from "node:assert/strict";
import { WaveDirector } from "../src/core/waves.js";
import { RNG } from "../src/core/rng.js";
import { CONFIG } from "../src/core/config.js";

const director = (seed, wave, mod = "none", cfg = CONFIG) => {
  const d = new WaveDirector(new RNG(seed), null, cfg);
  d.wave = wave;
  d.activeMod = mod;
  return d;
};

const tally = (d, n) => {
  const c = { L: 0, M: 0, S: 0 };
  for (let i = 0; i < n; i++) c[d.pickSize()]++;
  return c;
};

test("spawn mix table: rows ordered, last unbounded, shares sum to 1, L floor held", () => {
  const t = CONFIG.spawnMix;
  assert.ok(t.rows.length >= 2, "at least two rows");
  let prev = -Infinity;
  for (let i = 0; i < t.rows.length; i++) {
    const row = t.rows[i];
    assert.ok(row.L > 0 && row.M > 0, "row " + i + ": L/M positive");
    assert.ok(row.S >= 0 && row.S <= 1, "row " + i + ": S in [0,1]");
    assert.ok(Math.abs(row.L + row.M + row.S - 1) < 1e-9, "row " + i + " sums to 1");
    assert.ok(row.L >= t.lFloor - 1e-9, "row " + i + " holds the L floor");
    if (row.toWave !== -1) {
      assert.ok(row.toWave > prev, "toWave strictly increasing");
      prev = row.toWave;
    }
  }
  assert.equal(t.rows[0].toWave, 2, "first row ends at wave 2 (teach band)");
  assert.equal(t.rows[t.rows.length - 1].toWave, -1, "last row is unbounded");
  assert.equal(Math.max(...t.rows.map((r) => r.S)), 0.4, "S capped at 0.40 across all rows");
  assert.deepEqual([t.rows[0].L, t.rows[0].M, t.rows[0].S], [0.5, 0.5, 0], "teach band unchanged (w1-2)");
  assert.deepEqual([t.rows[1].L, t.rows[1].M, t.rows[1].S], [0.3, 0.4, 0.3], "base band = pre-I131 values (w3-9)");
});

test("spawn mix: waves 1-2 never spawn S, L:M 50/50 (pre-I131 behavior)", () => {
  for (const w of [1, 2]) {
    const n = 20000;
    const c = tally(director(7, w), n);
    assert.equal(c.S, 0, "wave " + w + ": zero S");
    assert.ok(Math.abs(c.L / n - 0.5) < 0.02, "wave " + w + " L ~0.5");
    assert.ok(Math.abs(c.M / n - 0.5) < 0.02, "wave " + w + " M ~0.5");
  }
});

test("spawn mix: base band w3-9 = 0.3/0.4/0.3 exactly as pre-I131 (20k draws)", () => {
  for (const w of [3, 6, 9]) {
    const n = 20000;
    const c = tally(director(11, w), n);
    assert.ok(Math.abs(c.L / n - 0.3) < 0.02, "w" + w + " L ~0.3 (got " + (c.L / n).toFixed(3) + ")");
    assert.ok(Math.abs(c.M / n - 0.4) < 0.02, "w" + w + " M ~0.4");
    assert.ok(Math.abs(c.S / n - 0.3) < 0.02, "w" + w + " S ~0.3");
  }
});

test("spawn mix: I131 late bands - ramp w10-14 0.28/0.32/0.40, late w15+ 0.30/0.30/0.40", () => {
  const expect = (w, L, M, S) => {
    const n = 20000;
    const c = tally(director(23, w), n);
    assert.ok(Math.abs(c.L / n - L) < 0.02, "w" + w + " L ~" + L + " (got " + (c.L / n).toFixed(3) + ")");
    assert.ok(Math.abs(c.M / n - M) < 0.02, "w" + w + " M ~" + M);
    assert.ok(Math.abs(c.S / n - S) < 0.02, "w" + w + " S ~" + S);
  };
  expect(10, 0.28, 0.32, 0.4);
  expect(14, 0.28, 0.32, 0.4);
  expect(15, 0.3, 0.3, 0.4);
  expect(60, 0.3, 0.3, 0.4);
});

test("spawn mix: mixRow lookup - band boundaries and unbounded fallback", () => {
  const rows = CONFIG.spawnMix.rows;
  const rowAt = (w) => director(1, w).mixRow();
  assert.equal(rowAt(1), rows[0]);
  assert.equal(rowAt(2), rows[0]);
  assert.equal(rowAt(3), rows[1]);
  assert.equal(rowAt(9), rows[1]);
  assert.equal(rowAt(10), rows[2]);
  assert.equal(rowAt(14), rows[2]);
  assert.equal(rowAt(15), rows[3]);
  assert.equal(rowAt(999), rows[3], "unbounded last row catches any wave");
});

test("spawn mix: deterministic per seed, different across seeds", () => {
  const seq = (seed, wave) => {
    const d = director(seed, wave);
    const out = [];
    for (let i = 0; i < 60; i++) out.push(d.pickSize());
    return out.join("");
  };
  assert.equal(seq(555, 12), seq(555, 12), "same seed same wave -> same sequence");
  assert.notEqual(seq(555, 12), seq(556, 12), "different seed -> different sequence");
});

test("spawn mix: non-mod pickSize consumes exactly one RNG draw (pre-I131 width)", () => {
  const d = director(99, 12);
  const ref = new RNG(99);
  for (let i = 0; i < 100; i++) { d.pickSize(); ref.next(); }
  assert.equal(d.rng._s, ref._s, "stream position matches plain next() calls");
  // ST-051 small mod (pre-I131 shape): 1 draw when S wins, 2 draws for L/M
  const dm = director(99, 12, "small");
  for (let i = 0; i < 20; i++) {
    let draws = 0;
    const orig = dm.rng.next.bind(dm.rng);
    dm.rng.next = () => { draws++; return orig(); };
    const sz = dm.pickSize();
    dm.rng.next = orig;
    if (sz === "S") assert.equal(draws, 1, "S -> one draw");
    else assert.equal(draws, 2, sz + " -> two draws");
  }
});

test("spawn mix: small mod still biases S to 0.5 (ST-051 preserved)", () => {
  const n = 20000;
  const c = tally(director(31, 12, "small"), n);
  assert.ok(Math.abs(c.S / n - CONFIG.waveMods.smallSBias) < 0.02, "S ~smallSBias");
});
