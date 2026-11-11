// ST-180 (I180): headless unit tests for src/render/audio.js, the WebAudio
// synth layer. audio.js has no imports and touches window only inside init(),
// so it is directly importable in Node with the stub from
// tests/helpers/webaudio.js.
//
// Deliberate boundary: these tests NEVER call music(true)/ambience(true).
// Those schedule recurring setTimeouts (chord ticks, 1.2-1.3s disconnect
// tails) that keep the node event loop alive and would hang the in-process
// runner. The bus seams (musicChord, musicIntensity, timeWarp) are exercised
// in their no-bus state - the same state main.js starts them in.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/render/audio.js';
import { installAudioStub } from './helpers/webaudio.js';

// Fresh stub + fresh audio module instance per test; the stub restores the
// previous global window afterwards (all test files share one process).
function fresh(t) {
  const stub = installAudioStub();
  t.after(() => stub.restore());
  const a = createAudio();
  return { stub: stub, a: a, ctx: function () { return stub.instances[0]; } };
}

const CUE_NAMES = [
  'shoot', 'kill', 'hit', 'powerup', 'slowmo', 'shieldPop', 'shieldHit', 'swish',
  'mine', 'drone', 'droneDecay', 'bossSpawn', 'wardenSpawn', 'bossRing', 'bossDeath',
  'wardenDeath', 'stingerTelegraph', 'stingerDeath', 'bossFire', 'mineFire', 'overdrive', 'vortexTelegraph', 'vortexStart',
  'bomb', 'wave', 'cleared', 'gameover', 'levelUp',
];

test('state() reports uninitialized before init', (t) => {
  const { a } = fresh(t);
  assert.equal(a.state(), 'uninitialized');
});

test('meter() is null before init', (t) => {
  const { a } = fresh(t);
  assert.equal(a.meter(), null);
});

test('sfx() before init is a safe no-op (false, no throw)', (t) => {
  const { a } = fresh(t);
  assert.equal(a.sfx('shoot'), false);
  assert.equal(a.sfx('hit', { x: 10, y: 0 }), false);
  assert.equal(a.state(), 'uninitialized');
});

test('weights() maps every cue to a finite positive gain', (t) => {
  const { a } = fresh(t);
  const w = a.weights();
  for (const name of CUE_NAMES) {
    assert.ok(Object.prototype.hasOwnProperty.call(w, name), 'missing cue: ' + name);
    assert.ok(Number.isFinite(w[name]) && w[name] > 0, 'bad gain for ' + name);
  }
  assert.equal(Object.keys(w).length, CUE_NAMES.length, 'unexpected extra/missing cues');
  // I173 (ST-173) tier placements + ST-087 impact trims, pinned for drift
  assert.equal(w.droneDecay, 0.14);
  assert.equal(w.wardenSpawn, 0.22);
  assert.equal(w.wardenDeath, 0.34);
  // ST-229 charger cues, pinned for drift (telegraph sweep g 0.2; death boom below the warden rung 0.34)
  assert.equal(w.stingerTelegraph, 0.2);
  assert.equal(w.stingerDeath, 0.28);
  assert.equal(w.slowmo, 0.18);
  assert.equal(w.bomb, 0.55);
  assert.equal(w.hit, 0.45);
  assert.equal(w.shieldHit, 0.16);
  assert.equal(w.shoot, 0.12);
});

test('init() builds the master chain gain->comp->makeup->limiter->analyser/dest', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  const c = ctx();
  assert.equal(a.state(), 'running');
  assert.equal(c.gains.length, 2);       // master + makeup
  assert.equal(c.compressors.length, 2); // compressor + true-peak limiter
  assert.equal(c.analysers.length, 1);
  assert.equal(c.analysers[0].fftSize, 1024);
  // shared noise buffer: 0.5s at the context sample rate
  assert.equal(c.buffers.length, 1);
  assert.equal(c.buffers[0].len, Math.floor(c.sampleRate * 0.5));
  const master = c.gains[0];
  assert.equal(master.__connections[0], c.compressors[0]);
  assert.equal(c.compressors[0].__connections[0], c.gains[1]);
  assert.equal(c.gains[1].__connections[0], c.compressors[1]);
  assert.ok(c.compressors[1].__connections.includes(c.analysers[0]));
  assert.ok(c.compressors[1].__connections.includes(c.destination));
  // compressor/limiter settings (ST-029 / ST-087)
  assert.equal(c.compressors[0].threshold.value, -18);
  assert.equal(c.compressors[1].threshold.value, -8);
  assert.equal(c.compressors[1].ratio.value, 20);
  // default volume 0.7 applied during init
  assert.equal(master.gain.__lastTarget, 0.7);
});

test('init() is idempotent and resumes a suspended context', (t) => {
  const { a, ctx, stub } = fresh(t);
  a.init();
  a.init();
  assert.equal(stub.instances.length, 1);
  assert.equal(ctx().gains.length, 2);
  ctx().state = 'suspended';
  a.init();
  assert.equal(ctx().resumeCalls, 1);
});

test('sfx(shoot) after init schedules and counts (center pan without pos)', (t) => {
  const { a } = fresh(t);
  a.init();
  assert.equal(a.sfx('shoot'), true);
  assert.equal(a.played.shoot, 1);
  assert.equal(a.lastPan(), 0);
});

test('unknown cue name returns false and does not count', (t) => {
  const { a } = fresh(t);
  a.init();
  assert.equal(a.sfx('shoot'), true);
  assert.equal(a.sfx('definitelyNotACue'), false);
  assert.equal(a.played.shoot, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(a.played, 'definitelyNotACue'), false);
});

test('per-cue rate limit holds until min elapsed (shoot min 0.04)', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  assert.equal(a.sfx('shoot'), true);
  ctx().currentTime = 0.02;
  assert.equal(a.sfx('shoot'), false, 'too soon: 0.02 < 0.04');
  assert.equal(a.played.shoot, 1);
  ctx().currentTime = 0.05;
  assert.equal(a.sfx('shoot'), true);
  assert.equal(a.played.shoot, 2);
});

test('setVolume clamps to [0,1] and retargets the master gain', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  a.setVolume(5);
  assert.equal(a.volume, 1);
  assert.equal(ctx().gains[0].gain.__lastTarget, 1);
  a.setVolume(-1);
  assert.equal(a.volume, 0);
  assert.equal(ctx().gains[0].gain.__lastTarget, 0);
});

test('setMuted routes the master gain to 0 and back to volume', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  a.setMuted(true);
  assert.equal(ctx().gains[0].gain.__lastTarget, 0);
  a.setMuted(false);
  assert.equal(ctx().gains[0].gain.__lastTarget, 0.7); // default volume
});

test('stereo pan from world x: clamped to +-ARENA_R, scaled by 0.8', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  const c = ctx();
  const fire = (pos) => { c.currentTime += 0.1; return a.sfx('kill', pos); };
  assert.equal(fire({ x: 26, y: 0 }), true);
  assert.ok(Math.abs(a.lastPan() - 0.8) < 1e-9, 'right edge');
  assert.equal(fire({ x: 52, y: -3 }), true);
  assert.ok(Math.abs(a.lastPan() - 0.8) < 1e-9, 'clamped at +ARENA_R');
  assert.equal(fire({ x: -30, y: 0 }), true);
  assert.ok(Math.abs(a.lastPan() + 0.8) < 1e-9, 'clamped at -ARENA_R');
  assert.equal(fire(), true);
  assert.equal(a.lastPan(), 0, 'no pos -> center');
  assert.equal(fire({ x: NaN, y: 0 }), true);
  assert.equal(a.lastPan(), 0, 'non-finite x -> center');
});

test('timeWarp seam maps dilation to detune cents (no music bus)', (t) => {
  const { a } = fresh(t);
  a.init();
  a.timeWarp(0.5);
  assert.equal(a.warpCents(), -350);
  a.timeWarp(0);
  assert.equal(a.warpCents(), 0);
  a.timeWarp(1);
  assert.equal(a.warpCents(), -700);
  a.timeWarp(2);
  assert.equal(a.warpCents(), -700, 'clamped to 1');
  assert.equal(a.musicOn(), false, 'the seam must not start the music bus');
});

test('musicIntensity clamps to [0,1] (no music bus)', (t) => {
  const { a } = fresh(t);
  a.init();
  a.musicIntensity(2);
  assert.equal(a.musicIntensityVal(), 1);
  a.musicIntensity(-1);
  assert.equal(a.musicIntensityVal(), 0);
  a.musicIntensity();
  assert.equal(a.musicIntensityVal(), 0);
  assert.equal(a.musicOn(), false, 'the seam must not start the music bus');
});

test('musicChord() exposes the current chord (starts on Am, index 0)', (t) => {
  const { a } = fresh(t);
  a.init();
  const ch = a.musicChord();
  assert.equal(ch.i, 0);
  assert.equal(ch.sub, 55);
  assert.deepEqual(ch.f, [110.00, 164.81, 220.00, 329.63]);
});

test('meter() computes peak and rms from the analyser frame', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  const m = a.meter();
  assert.ok(m, 'meter available after init');
  assert.equal(m.peak, 0.25); // stub frame is flat 0.25
  assert.equal(m.rms, 0.25);
  assert.equal(ctx().analysers[0].__meterCalls, 1);
  assert.equal(a.ambLevel(), null, 'no ambience bus running');
});

test('setSfx(false) gates every cue; setSfx(true) re-enables', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  assert.equal(a.sfx('shoot'), true);
  a.setSfx(false);
  ctx().currentTime = 1;
  assert.equal(a.sfx('shoot'), false, 'sfx off');
  assert.equal(a.played.shoot, 1);
  a.setSfx(true);
  ctx().currentTime = 2;
  assert.equal(a.sfx('shoot'), true);
  assert.equal(a.played.shoot, 2);
});

test('cue node creation: single-tone+noise vs 4-note stinger', (t) => {
  const { a, ctx } = fresh(t);
  a.init();
  const c = ctx();
  assert.equal(c.oscillators.length, 0);
  assert.equal(c.bufferSources.length, 0);
  assert.equal(c.panners.length, 0);
  // hit: one f0->f1 sweep + a noise tail
  assert.equal(a.sfx('hit'), true);
  assert.equal(c.oscillators.length, 1);
  assert.equal(c.bufferSources.length, 1);
  assert.equal(c.panners.length, 1);
  assert.equal(c.oscillators[0].__started, 1);
  assert.equal(c.oscillators[0].__stopped, 1);
  assert.equal(c.bufferSources[0].__started, 1);
  assert.equal(c.bufferSources[0].__stopped, 1);
  assert.equal(c.panners[0].pan.value, 0);
  c.currentTime = 0.5; // comfortably past both cues' min windows
  // cleared: 4-note rising jingle, no noise
  assert.equal(a.sfx('cleared'), true);
  assert.equal(c.oscillators.length, 5);
  assert.equal(c.bufferSources.length, 1, 'notes-only cue adds no buffer source');
  assert.equal(c.panners.length, 2);
});
