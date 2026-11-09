// ST-058: endless difficulty curve - capped content, shrinking intermissions,
// rising small-rock share, ENDLESS flag on the wave event (seeds 67-71)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { WaveDirector } from '../src/core/waves.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** Director on an always-empty field (waves clear immediately). */
function clearedDir(seed) {
  const field = { count: 0, spawn: () => ({ id: 1 }) };
  const dir = new WaveDirector(new RNG(seed), field);
  dir.start();
  return dir;
}

test('endless: config sanity (seed 67)', () => {
  const e = CONFIG.waveEndless;
  assert.ok(e.first >= 5, 'curve engages late enough to teach the base loop');
  assert.ok(e.contentCap >= CONFIG.wave.base + CONFIG.wave.growth * e.first, 'cap above wave-10 content');
  assert.ok(e.minIntermission > 0 && e.minIntermission < CONFIG.wave.intermission, 'floor below base');
  assert.ok(e.intermissionStep > 0, 'per-wave shrinkage');
  assert.ok(e.sBiasStep > 0 && e.sBiasCap > 0.3 && e.sBiasCap < 0.6, 'S-bias band sane');
});

test('endless: content capped from wave 10, plain ramp before (seed 67)', () => {
  const field = { count: 99, spawn: () => null }; // full field: no spawn drain
  const dir = new WaveDirector(new RNG(67), field);
  dir.start();
  assert.equal(dir.contentFor(9), 13);            // 4 + 1*9, no cap
  assert.equal(dir.contentFor(10), 14);           // below the cap yet
  assert.equal(dir.contentFor(32), 36);           // 4+32 = cap boundary
  assert.equal(dir.contentFor(50), CONFIG.waveEndless.contentCap); // capped
  dir.wave = 40; dir.state = 'intermission'; dir.intermission = 0;
  const ev = dir.step(DT);
  assert.equal(ev.startedWave, 41);
  assert.equal(dir.toSpawn, CONFIG.waveEndless.contentCap, 'toSpawn capped');
  assert.equal(dir.endless(), true);
});

test('endless: intermission shrinks to floor, base before wave 10 (seed 68)', () => {
  const dir = clearedDir(68);
  const e = CONFIG.waveEndless;
  assert.equal(dir.intermissionFor(1), CONFIG.wave.intermission);
  assert.equal(dir.intermissionFor(9), CONFIG.wave.intermission);
  assert.equal(dir.intermissionFor(10), CONFIG.wave.intermission); // zero shrink steps
  assert.ok(Math.abs(dir.intermissionFor(e.first + 5) - (CONFIG.wave.intermission - 5 * e.intermissionStep)) < 1e-9);
  assert.equal(dir.intermissionFor(e.first + 100), e.minIntermission, 'floor');
  // live: clear wave 24 -> intermission for wave 25 clamps to the floor
  dir.wave = 24; dir.state = 'active'; dir.toSpawn = 0; dir.waveElapsed = 1;
  const ev = dir.step(DT);
  assert.equal(ev.waveCleared, 24);
  assert.equal(dir.state, 'intermission');
  assert.equal(dir.intermission, e.minIntermission);
});

test('endless: small-rock share rises per wave, capped (seed 69)', () => {
  const field = { count: 0, spawn: () => ({ id: 1 }) };
  const dir = new WaveDirector(new RNG(69), field);
  dir.start();
  const e = CONFIG.waveEndless;
  assert.equal(dir.sProb(), 0.3);
  dir.wave = e.first;
  assert.ok(Math.abs(dir.sProb() - 0.3) < 1e-9, 'wave 10 = base');
  dir.wave = e.first + 3;
  assert.ok(Math.abs(dir.sProb() - (0.3 + 3 * e.sBiasStep)) < 1e-9, 'wave 13 rising, uncapped');
  dir.wave = e.first + 10;
  assert.equal(dir.sProb(), e.sBiasCap, 'wave 20 already at the cap');
  dir.wave = e.first + 100;
  assert.equal(dir.sProb(), e.sBiasCap, 'deep endless stays capped');
  let s = 0; const N = 2000;
  for (let i = 0; i < N; i++) if (dir.pickSize() === 'S') s++;
  assert.ok(s / N > 0.42 && s / N < 0.48, 'S fraction near cap (got ' + (s / N).toFixed(3) + ')');
  dir.wave = 5;
  s = 0;
  for (let i = 0; i < N; i++) if (dir.pickSize() === 'S') s++;
  assert.ok(s / N > 0.25 && s / N < 0.35, 'pre-endless S fraction ~0.3 (got ' + (s / N).toFixed(3) + ')');
});

test('endless: wave event carries the endless flag (seed 70)', () => {
  const w = new World(new RNG(70));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 0;
  w.step(DT, NEUTRAL);
  let waveEv = w.drainEvents().find((ev) => ev.type === 'wave');
  assert.equal(waveEv.data.n, 1);
  assert.equal(waveEv.data.endless, false, 'wave 1 is not endless');
  // jump to the boundary: wave 9 done -> wave 10
  w.field.clear();
  w.waves.wave = 9;
  w.waves.toSpawn = 0;
  w.waves.state = 'intermission';
  w.waves.intermission = 0;
  w.step(DT, NEUTRAL);
  waveEv = w.drainEvents().find((ev) => ev.type === 'wave');
  assert.equal(waveEv.data.n, 10);
  assert.equal(waveEv.data.endless, true, 'wave 10 is endless');
  assert.equal(w.waves.endless(), true);
  assert.equal(w.field.count, 14, 'wave 10 content = min(cap, 4+10) all spawned');
});
