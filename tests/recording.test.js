// I191: recording decisions + the ST-191 capture flow (record a live run, replay it,
// faithful to the original). Pure core - no DOM, no three.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { recordingAction, shouldSaveOnGameOver } from '../src/core/recording.js';
import { createRecorder, pilotIntent, createPlayer, decodeReplay } from '../src/core/replay.js';

const DT = 1 / 60;

// --- O-key toggle rules ---

test('recording: O starts only in PLAYING when no recorder exists', () => {
  assert.equal(recordingAction('PLAYING', false, false), 'start');
  assert.equal(recordingAction('PLAYING', false, true), 'start'); // stopped flag is irrelevant without a recorder
  assert.equal(recordingAction('MENU', false, false), 'none');
  assert.equal(recordingAction('PAUSED', false, false), 'none');
  assert.equal(recordingAction('GAME_OVER', false, false), 'none');
  assert.equal(recordingAction('REPLAY', false, false), 'none'); // a watched replay can never start a recording
});

test('recording: O stops an active recording; a stopped one cannot be re-armed', () => {
  assert.equal(recordingAction('PLAYING', true, false), 'stop');
  assert.equal(recordingAction('PLAYING', true, true), 'none');
});

test('recording: unknown or mismatched states are no-ops (exact-match semantics)', () => {
  assert.equal(recordingAction('BOGUS', false, false), 'none');
  assert.equal(recordingAction('playing', false, false), 'none');
  assert.equal(recordingAction(undefined, false, false), 'none');
});

// --- save-on-game-over rules ---

test('recording: save only a non-empty recording of a live (non-watched) run', () => {
  assert.equal(shouldSaveOnGameOver(true, 5, false), true);
  assert.equal(shouldSaveOnGameOver(true, 1, false), true); // one substep is enough
  assert.equal(shouldSaveOnGameOver(true, 0, false), false); // started but captured nothing
  assert.equal(shouldSaveOnGameOver(false, 5, false), false); // never started
  assert.equal(shouldSaveOnGameOver(true, 5, true), false); // a watched replay never saves
});

// --- the ST-191 flow: record a live run, replay it faithfully ---
//
// The tape quantizes intents to 1/quant (quant = 1000 in CONFIG.replay). In this
// chaotic sim a low resolution (e.g. 1/25) cascades into a different run (measured:
// wrong death time/wave/score); at 1/1000 the replay is outcome-identical
// (measured: same state/time/score/wave/kills, ship within 0.001 world units).
// The exact bit-identity guarantee is between two replays of the same tape - the
// player's input, faithfully quantized, through the same deterministic sim.

function snap(w) {
  return {
    time: w.time,
    state: w.game.state,
    alive: w.simActive, // I191 fix: outcome, not label - a faithful survivor ends PLAYING (original) vs REPLAY (watched)
    score: w.score,
    kills: w.scoreKeeper.kills,
    wave: w.wave,
    lives: w.livesMgr.count,
    px: w.ship.pos.x,
    py: w.ship.pos.y,
    rocks: w.field.rocks.map((r) => ({ id: r.id, size: r.size, x: r.pos.x, y: r.pos.y, vx: r.vel.x, vy: r.vel.y })),
    bullets: w.weapons.bullets.filter((b) => !b.dead).map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })),
  };
}

test('replay: a live-recorded run replays faithfully and deterministically (ST-191 flow)', () => {
  const SEED = 777;
  // Original run: the main.js flow - fresh seed per run, record the exact intent the sim receives.
  const w0 = new World(new RNG(1), { ...CONFIG, director: { enabled: false } }); // ST-304 (I329): replay is director-neutral, so the live original must be too
  w0.reset();
  w0.reseed(SEED);
  w0.begin();
  const rec = createRecorder(SEED, { quant: CONFIG.replay.quant, maxSteps: CONFIG.replay.maxSteps, maxTapeBytes: CONFIG.replay.maxTapeBytes });
  for (let i = 0; i < 3600 && w0.simActive; i++) {
    const it = pilotIntent(w0, i);
    rec.record(it);
    w0.step(DT, it);
  }
  const raw = rec.finish({ score: w0.score, wave: Math.max(1, w0.wave), kills: w0.scoreKeeper.kills, time: Math.round(w0.time), mode: 'normal', dailyKey: '' });
  assert.ok(rec.length > 0 && !rec.truncated, 'the run recorded real input without hitting the caps');
  const d = decodeReplay(raw, { maxLen: CONFIG.replay.maxSteps });
  assert.ok(d.ok, d.error);
  assert.equal(d.data.seed, SEED, 'the tape carries the run seed');

  // Two replays of the same tape are bit-identical (the determinism guarantee).
  function replayTape() {
    const w = new World(new RNG(1), { ...CONFIG, director: { enabled: false } }); // ST-304 (I329): replay is director-neutral
    w.reset();
    w.reseed(SEED); // main.js watch flow: reset -> reseed -> replayBegin
    w.replayBegin();
    const player = createPlayer(d.data);
    for (let i = 0; i < player.length; i++) {
      if (!w.simActive) break;
      w.step(DT, player.intent(w, i));
    }
    return snap(w);
  }
  const a = replayTape();
  const b = replayTape();
  assert.deepEqual(a, b, 'two replays of the same tape are bit-identical');

  // The replay is faithful to the live original (quantization is 1/1000, not lossless).
  const o = snap(w0);
  assert.equal(a.alive, o.alive, 'same ending aliveness');
  if (!o.alive) assert.equal(a.state, o.state, 'same ending state when the run actually ends');
  assert.equal(a.wave, o.wave, 'same wave reached');
  assert.equal(a.kills, o.kills, 'same kill count');
  assert.equal(a.score, o.score, 'same final score');
  assert.ok(Math.abs(a.time - o.time) <= 0.1, 'same end time (within 6 substeps)');
  assert.ok(Math.hypot(a.px - o.px, a.py - o.py) < 1.0, 'ship trajectory stays close to the original');
  assert.ok(o.kills > 0, 'the harness exercised a real run');
});
