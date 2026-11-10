// I190: replay codec + storage + playback determinism (ST-190). Pure core - no DOM, no three.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { Storage } from '../src/core/storage.js';
import { CONFIG } from '../src/core/config.js';
import {
  REPLAY_VERSION, quantizeIntent, dequantizeIntent, createRecorder,
  pilotIntent, demoReplay, createPlayer, decodeReplay,
} from '../src/core/replay.js';

const DT = 1 / 60;
const Q = 25;

// Compact exact snapshot for determinism checks (any divergence fails deepEqual).
function snap(w) {
  return {
    time: w.time,
    state: w.game.state,
    score: w.score,
    kills: w.scoreKeeper.kills,
    wave: w.wave,
    lives: w.livesMgr.count,
    rocks: w.field.rocks.map((r) => ({ id: r.id, size: r.size, x: r.pos.x, y: r.pos.y, vx: r.vel.x, vy: r.vel.y })),
    bullets: w.weapons.bullets.filter((b) => !b.dead).map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })),
  };
}

// --- quantization round-trip ---

test('replay: quantize/dequantize round-trip within 1/q (firing exact)', () => {
  const i = { thrust: { x: 0.8, y: -0.35 }, aimPoint: { x: 3.7, y: -1.2 }, firing: true };
  const e = quantizeIntent(i, Q);
  assert.equal(e.length, 6);
  for (const v of e) assert.ok(Number.isInteger(v), 'all quantized values are integers');
  const d = dequantizeIntent(e, Q);
  assert.ok(Math.abs(d.thrust.x - 0.8) <= 1 / Q, 'thrust.x within 1/q');
  assert.ok(Math.abs(d.thrust.y - (-0.35)) <= 1 / Q, 'thrust.y within 1/q');
  assert.ok(Math.abs(d.aimPoint.x - 3.7) <= 1 / Q, 'aim.x within 1/q');
  assert.ok(Math.abs(d.aimPoint.y - (-1.2)) <= 1 / Q, 'aim.y within 1/q');
  assert.equal(d.firing, true, 'firing survives exactly');
});

test('replay: null aim is disambiguated from aim at (0,0)', () => {
  const q1 = quantizeIntent({ thrust: { x: 0, y: 0 }, aimPoint: null, firing: false }, Q);
  const q2 = quantizeIntent({ thrust: { x: 0, y: 0 }, aimPoint: { x: 0, y: 0 }, firing: false }, Q);
  assert.equal(q1[2], 0, 'null aim -> flag 0');
  assert.equal(q2[2], 1, 'aim at origin -> flag 1');
  assert.equal(dequantizeIntent(q1, Q).aimPoint, null);
  assert.deepEqual(dequantizeIntent(q2, Q).aimPoint, { x: 0, y: 0 });
});

test('replay: quantize clamps coordinates to +/-40q', () => {
  const e = quantizeIntent({ thrust: { x: 999, y: -999 }, aimPoint: { x: 500, y: -500 }, firing: true }, Q);
  const clamp = 40 * Q;
  assert.deepEqual(e, [clamp, -clamp, 1, clamp, -clamp, 1]);
});

test('replay: quantize is defensive against missing/garbage fields', () => {
  assert.deepEqual(quantizeIntent(null, Q), [0, 0, 0, 0, 0, 0]);
  const e = quantizeIntent({ thrust: { x: NaN, y: undefined }, aimPoint: { x: NaN, y: NaN }, firing: 'yes' }, Q);
  assert.equal(e[2], 0, 'all-NaN aim counts as no aim');
  assert.equal(e[5], 1, 'truthy firing -> 1');
  assert.ok(e.every((v) => Number.isFinite(v) && Math.abs(v) <= 40 * Q));
});

// --- recorder RLE ---

test('replay: recorder RLE compresses a constant intent to one entry', () => {
  const rec = createRecorder(1, { quant: Q, maxSteps: 1000, maxTapeBytes: 100000 });
  const it = { thrust: { x: 0.4, y: 0.2 }, aimPoint: { x: 1, y: 1 }, firing: true };
  for (let i = 0; i < 300; i++) rec.record(it);
  const r = rec.finish({ score: 10 });
  assert.equal(r.tape.length, 1, 'one run for a constant intent');
  assert.equal(r.tape[0][0], 300, 'run length 300');
  assert.equal(r.len, 300);
  assert.equal(r.kind, 'tape');
  assert.equal(r.v, REPLAY_VERSION);
  assert.equal(r.truncated, false);
});

test('replay: recorder RLE alternation -> one entry per step; sum of runs === len', () => {
  const A = { thrust: { x: 1, y: 0 }, aimPoint: null, firing: true };
  const B = { thrust: { x: 0, y: 1 }, aimPoint: null, firing: false };
  const rec = createRecorder(1, { quant: Q, maxSteps: 1000, maxTapeBytes: 100000 });
  for (let i = 0; i < 50; i++) { rec.record(A); rec.record(B); }
  const r = rec.finish();
  assert.equal(r.tape.length, 100, 'no compression for strict alternation');
  assert.equal(r.tape.reduce((s, e) => s + e[0], 0), 100, 'sum of runs === len');
  assert.equal(r.len, 100);
});

test('replay: recorder truncates at maxSteps (flag + capped length, runs still sum to len)', () => {
  const rec = createRecorder(1, { quant: Q, maxSteps: 50, maxTapeBytes: 1e9 });
  for (let i = 0; i < 80; i++) rec.record({ thrust: { x: 0, y: 0 }, aimPoint: null, firing: false });
  assert.equal(rec.length, 50);
  assert.equal(rec.truncated, true);
  const r = rec.finish();
  assert.equal(r.len, 50);
  assert.equal(r.truncated, true);
  assert.equal(r.tape.reduce((s, e) => s + e[0], 0), 50);
});

// --- decodeReplay ---

function makeTape(score) {
  const rec = createRecorder(7, { quant: Q });
  rec.record({ thrust: { x: 1, y: 0 }, aimPoint: { x: 0, y: 0 }, firing: true });
  rec.record({ thrust: { x: 0, y: 0 }, aimPoint: null, firing: false });
  return rec.finish({ score, wave: 1, kills: 1, time: 2, mode: 'normal' });
}

test('replay: decodeReplay accepts a valid tape with sanitized meta', () => {
  const raw = makeTape(7);
  raw.meta = { score: 7, wave: 2, kills: 3, time: 12.9, mode: 'daily', dailyKey: '2026-11-10' };
  const d = decodeReplay(raw, { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  assert.equal(d.data.seed, 7);
  assert.equal(d.data.len, 2);
  assert.deepEqual(d.data.meta, { score: 7, wave: 2, kills: 3, time: 12, mode: 'daily', dailyKey: '2026-11-10' });
});

test('replay: decodeReplay accepts a valid demo payload', () => {
  const d = decodeReplay(demoReplay(1909, 2220), { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  assert.equal(d.data.kind, 'demo');
  assert.equal(d.data.meta.mode, 'demo');
});

test('replay: decodeReplay rejects corrupt payloads (battery)', () => {
  const base = makeTape(1);
  const cases = [
    [null, 'not an object'],
    [{ v: 2, kind: 'tape', seed: 1, len: 2, q: Q, tape: base.tape }, 'bad version'],
    [{ ...base, kind: 'blob' }, 'bad kind'],
    [{ ...base, seed: 'x' }, 'bad seed'],
    [{ ...base, seed: 2147483648 }, 'bad seed (over 32-bit)'],
    [{ ...base, len: 0 }, 'bad len (zero)'],
    [{ ...base, len: 3 }, 'bad len (mismatch)'],
    [{ ...base, q: 3 }, 'bad quant (low)'],
    [{ ...base, q: 1001 }, 'bad quant (high)'],
    [{ ...base, tape: 'nope' }, 'no tape'],
    [{ ...base, len: 2, tape: [base.tape[0], [1, 0, 0, 0, 0, 0]] }, 'bad entry len'],
    [{ ...base, len: 1, tape: [[0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]] }, 'bad run n (zero)'],
    [{ ...base, len: 1, tape: [[1.5, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0]] }, 'bad run n (non-int)'],
    [{ ...base, len: 2, tape: [[1, 40 * Q + 1, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0]] }, 'bad coord (over clamp)'],
    [{ ...base, len: 2, tape: [[1, 0, 0, 2, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0]] }, 'bad aim flag'],
    [{ ...base, len: 2, tape: [[1, 0, 0, 0, 0, 0, 3], [1, 0, 0, 0, 0, 0, 0]] }, 'bad fire flag'],
  ];
  for (const [payload, label] of cases) {
    const d = decodeReplay(payload, { maxLen: CONFIG.replay.maxSteps });
    assert.ok(!d.ok, label + ' must be rejected');
    assert.ok(d.error, label + ' reports an error');
  }
});

test('replay: decodeReplay enforces maxLen for demos too', () => {
  const d = decodeReplay(demoReplay(1, 101), { maxLen: 100 });
  assert.ok(!d.ok, 'demo over maxLen rejected');
});

test('replay: decodeReplay clamps tampered meta (NaN/negative/huge -> sane ints)', () => {
  const raw = makeTape(1);
  raw.meta = { score: NaN, wave: -4, kills: 9.7, time: 1e9, mode: 'evil', dailyKey: 'x'.repeat(20) };
  const d = decodeReplay(raw, { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  assert.equal(d.data.meta.score, 0);
  assert.equal(d.data.meta.wave, 0);
  assert.equal(d.data.meta.kills, 9);
  assert.equal(d.data.meta.mode, 'normal');
  assert.equal(d.data.meta.dailyKey, '');
});

// --- createPlayer ---

test('replay: createPlayer(tape) returns quantized intents within 1/q; neutral past the end', () => {
  const A = { thrust: { x: 0.83, y: -0.41 }, aimPoint: { x: 2.2, y: 0.7 }, firing: true };
  const B = { thrust: { x: -0.52, y: 0.67 }, aimPoint: null, firing: false };
  const rec = createRecorder(9, { quant: Q, maxSteps: 1000, maxTapeBytes: 100000 });
  for (let i = 0; i < 50; i++) { rec.record(A); rec.record(B); }
  const d = decodeReplay(rec.finish({}), { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  const p = createPlayer(d.data);
  assert.equal(p.length, 100);
  for (let i = 0; i < 100; i += 10) {
    const orig = i % 2 === 0 ? A : B;
    const it = p.intent(null, i);
    assert.ok(Math.abs(it.thrust.x - orig.thrust.x) <= 1 / Q + 1e-9, 'thrust.x[' + i + '] within 1/q');
    assert.ok(Math.abs(it.thrust.y - orig.thrust.y) <= 1 / Q + 1e-9, 'thrust.y[' + i + '] within 1/q');
    if (orig.aimPoint) {
      assert.ok(it.aimPoint, 'aim preserved at ' + i);
      assert.ok(Math.abs(it.aimPoint.x - orig.aimPoint.x) <= 1 / Q + 1e-9);
      assert.ok(Math.abs(it.aimPoint.y - orig.aimPoint.y) <= 1 / Q + 1e-9);
    } else assert.equal(it.aimPoint, null, 'null aim preserved at ' + i);
    assert.equal(it.firing, orig.firing, 'firing exact at ' + i);
  }
  const past = p.intent(null, 100);
  assert.deepEqual(past, { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false }, 'neutral past the end');
});

test('replay: createPlayer(demo) drives the canonical pilot (thrust exact, neutral past len)', () => {
  const p = createPlayer(demoReplay(123, 300));
  assert.equal(p.length, 300);
  const w = new World(new RNG(123));
  const it0 = p.intent(w, 0);
  assert.equal(it0.thrust.x, Math.cos(0) * 0.8, 'pilot thrust x at step 0');
  assert.equal(it0.thrust.y, Math.sin(0) * 0.8, 'pilot thrust y at step 0');
  assert.equal(it0.firing, true, 'pilot always fires');
  assert.equal(p.intent(w, 300).firing, false, 'neutral past len');
  assert.throws(() => createPlayer(null), 'no data throws');
});

// --- playback determinism ---

function playTape(seed, data) {
  const w = new World(new RNG(seed));
  w.replayBegin(); // MENU -> REPLAY (fresh systems + waves start, identical to a fresh world)
  const player = createPlayer(data);
  for (let i = 0; i < player.length; i++) {
    if (!w.simActive) break;
    w.step(DT, player.intent(w, i));
  }
  return snap(w);
}

test('replay: recorded-tape playback is bit-identical across two fresh worlds', () => {
  // record a 40s pilot run on a live world
  const w0 = new World(new RNG(555));
  w0.begin();
  const rec = createRecorder(555, { quant: Q, maxSteps: CONFIG.replay.maxSteps, maxTapeBytes: CONFIG.replay.maxTapeBytes });
  for (let i = 0; i < 2400 && w0.simActive; i++) {
    const it = pilotIntent(w0, i);
    rec.record(it);
    w0.step(DT, it);
  }
  const raw = rec.finish({ score: w0.score, wave: Math.max(1, w0.wave), kills: w0.scoreKeeper.kills, time: Math.floor(w0.time), mode: 'normal' });
  const d = decodeReplay(raw, { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  const sa = playTape(555, d.data);
  const sb = playTape(555, d.data);
  assert.deepEqual(sa, sb, 'two playbacks of the same tape are bit-identical');
  assert.ok(sa.kills > 0, 'the playback exercised real kills (harness is not a no-op)');
});

test('replay: demo pilot (seed 1909) playback is deterministic and reaches GAME_OVER', () => {
  function playDemo() {
    const w = new World(new RNG(1));
    w.reset();
    w.reseed(1909); // main.js real flow: reset -> reseed -> replayBegin
    w.replayBegin();
    const player = createPlayer(demoReplay(1909, CONFIG.replay.demoLen));
    for (let i = 0; i < player.length; i++) {
      if (!w.simActive) break;
      w.step(DT, player.intent(w, i));
    }
    return { snap: snap(w), state: w.game.state, kills: w.scoreKeeper.kills, wave: w.wave, score: w.score };
  }
  const a = playDemo();
  const b = playDemo();
  assert.deepEqual(a, b, 'two demo runs are bit-identical');
  assert.equal(a.state, 'GAME_OVER', 'the pilot dies inside demoLen');
  assert.ok(a.kills > 0, 'real kills');
  assert.ok(a.wave >= 2, 'reached wave ' + a.wave);
});

test('replay: two consecutive demo runs on ONE world are bit-identical (IDs included)', () => {
  // Browser flow (main.js): the page keeps ONE World; exitReplayView/startReplayView both
  // funnel through world.reset() -> reseed -> replayBegin. Consecutive runs must therefore be
  // identical INCLUDING entity ids (render pools map by array index, so id reuse is safe).
  const w = new World(new RNG(1));
  function runOnce() {
    w.reset();
    w.reseed(1909);
    w.replayBegin();
    const player = createPlayer(demoReplay(1909, CONFIG.replay.demoLen));
    for (let i = 0; i < player.length; i++) {
      if (!w.simActive) break;
      w.step(DT, player.intent(w, i));
    }
    return snap(w);
  }
  const a = runOnce();
  const b = runOnce();
  assert.deepEqual(a, b, 'consecutive replay runs on one world are bit-identical (ids included)');
  assert.ok(a.rocks.length > 0, 'snapshot has rocks (rock ids were compared)');
  const ids = a.rocks.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'rock ids unique within a run');
});

// --- storage ---

function memStore() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => { m.set(k, v); },
    remove: (k) => { m.delete(k); },
    _map: m,
  };
}

test('storage: getReplays starts empty; saveReplay keeps newest-first with the cap', () => {
  const store = memStore();
  const st = new Storage(store);
  assert.deepEqual(st.getReplays(), []);
  assert.deepEqual(st.saveReplay(makeTape(100)), { saved: true });
  assert.deepEqual(st.saveReplay(makeTape(200)), { saved: true });
  assert.deepEqual(st.saveReplay(makeTape(300)), { saved: true }); // cap = CONFIG.replay.replaysMax (2) -> oldest dropped
  const list = st.getReplays();
  assert.equal(list.length, CONFIG.storage.replaysMax);
  assert.equal(list[0].data.meta.score, 300, 'newest first');
  assert.equal(list[1].data.meta.score, 200);
});

test('storage: saveReplay rejects invalid payloads ({saved:false}, nothing written)', () => {
  const st = new Storage(memStore());
  assert.deepEqual(st.saveReplay(null), { saved: false });
  assert.deepEqual(st.saveReplay({ v: 9, kind: 'tape', seed: 1, len: 2, q: Q, tape: makeTape(1).tape }), { saved: false });
  assert.deepEqual(st.getReplays(), []);
});

test('storage: getReplays drops corrupt stored entries defensively', () => {
  const store = memStore();
  const st = new Storage(store);
  st.saveReplay(makeTape(111));
  store.set(st.replaysKey, JSON.stringify([{ data: { v: 1, kind: 'blob', seed: 1, len: 1 } }, { data: makeTape(222) }]));
  const list = st.getReplays();
  assert.equal(list.length, 1, 'corrupt entry dropped');
  assert.equal(list[0].data.meta.score, 222);
});
