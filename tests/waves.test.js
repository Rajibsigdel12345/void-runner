// ST-014: wave director tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveDirector } from '../src/core/waves.js';
import { AsteroidField } from '../src/core/asteroids.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const DT = CONFIG.wave.intermission + 0.01; // jump past intermission

function setup(seed = 1) {
  const field = new AsteroidField(new RNG(seed));
  const dir = new WaveDirector(new RNG(seed + 100), field);
  dir.start();
  return { field, dir };
}

test('waves: wave 1 spawns base+growth rocks at ramped speed', () => {
  const { field, dir } = setup();
  const ev = dir.step(DT);
  assert.equal(ev.startedWave, 1);
  assert.equal(dir.speedMult, 1 + CONFIG.wave.speedPerWave);
  assert.equal(field.count, CONFIG.wave.base + CONFIG.wave.growth * 1);
});

test('waves: speed and concurrency ramp with wave number (capped)', () => {
  const { field, dir } = setup();
  dir.step(DT); // wave 1
  // I39: derive the first wave where the speed ramp actually hits the cap,
  // so this probe stays correct if speedPerWave/speedCap get retuned.
  const capWave = Math.ceil((CONFIG.wave.speedCap - 1) / CONFIG.wave.speedPerWave) + 1;
  // force-clear to advance
  for (let i = 0; i < 60; i++) {
    field.clear();
    const ev = dir.step(DT);
    if (dir.wave >= capWave) break;
    if (ev.waveCleared === 0 && field.count > 0 && dir.toSpawn === 0) field.clear();
  }
  assert.ok(dir.wave >= capWave, `reached wave ${dir.wave}`);
  dir.activeMod = 'none'; // ST-051: probe the base ramp; modifier math lives in wavemods.test.js
  assert.ok(Math.abs(dir.speedMult - CONFIG.wave.speedCap) < 1e-9, 'speed capped');
  assert.equal(dir.concurrentLimit, CONFIG.wave.maxConcurrentCap, 'concurrency capped');
});

test('waves: wave 10 numbers per GDD ramp', () => {
  const { field, dir } = setup();
  dir.wave = 10; // direct probe of the formulas
  dir.activeMod = 'none'; // ST-051: base-ramp probe
  assert.ok(Math.abs(dir.speedMult - Math.min(CONFIG.wave.speedCap, 1 + CONFIG.wave.speedPerWave * 10)) < 1e-9);
  assert.equal(dir.concurrentLimit, Math.min(CONFIG.wave.maxConcurrentCap, 6 + CONFIG.wave.maxConcurrentGrowth * 10));
});

test('waves: intermission separates waves', () => {
  const { field, dir } = setup();
  dir.step(DT); // wave 1 active
  field.clear();
  dir.step(DT); // detects clear -> intermission
  assert.equal(dir.state, 'intermission');
  const ev = dir.step(0.5); // not yet
  assert.equal(ev.startedWave, 0);
  assert.equal(ev.waveCleared, 0);
  const ev2 = dir.step(CONFIG.wave.intermission + 0.5);
  assert.equal(ev2.startedWave, 2);
});

test('waves: no S rocks in first 3 waves', () => {
  const { field, dir } = setup(77);
  dir.step(DT);
  assert.ok(field.rocks.every(r => r.size !== 'S'), 'wave 1 has no S');
});

test('waves: deterministic size sequence per seed', () => {
  const mk = () => {
    const field = new AsteroidField(new RNG(5));
    const dir = new WaveDirector(new RNG(6), field);
    dir.start();
    dir.step(DT);
    return field.rocks.map(r => r.size).join('');
  };
  assert.equal(mk(), mk());
});

test('waves: trickle respects concurrent limit (spawns <= limit per step)', () => {
  const field = new AsteroidField(new RNG(3));
  const cfg = JSON.parse(JSON.stringify(CONFIG));
  cfg.wave.maxConcurrentCap = 24;
  const dir = new WaveDirector(new RNG(4), field, cfg);
  dir.start();
  dir.wave = 20; // limit = min(24, 6+40) = 24
  dir.state = 'active';
  dir.toSpawn = 100;
  dir.step(DT);
  assert.ok(field.count <= 24, `spawned ${field.count}`);
  assert.equal(dir.toSpawn, 100 - field.count);
});

test('waves: stall advance after stallTime carries leftover rocks (I42)', () => {
  const { field, dir } = setup(36);
  dir.step(DT); // wave 1 active
  assert.equal(dir.wave, 1);
  const leftover = field.count;
  assert.ok(leftover > 0, 'field has rocks to carry');
  const S = 1 / 60;
  let stalled = 0;
  for (let i = 0; i < Math.ceil(CONFIG.wave.stallTime / S) + 2; i++) {
    const ev = dir.step(S);
    if (ev.stallAdvance) { stalled = ev.stallAdvance; break; }
  }
  assert.equal(stalled, 2, 'stall advanced to wave 2');
  assert.equal(dir.wave, 2);
  assert.equal(dir.toSpawn, CONFIG.wave.base + CONFIG.wave.growth * 2);
  assert.equal(field.count, leftover, 'leftover rocks carried, none deleted');
  assert.ok(dir.waveElapsed < CONFIG.wave.stallTime, 'stall timer reset');
});

test('waves: clear in time does not stall (I42)', () => {
  const { field, dir } = setup(37);
  dir.step(DT); // wave 1 active
  field.clear();
  const ev = dir.step(0.5);
  assert.equal(ev.waveCleared, 1, 'normal clear fires');
  assert.equal(ev.stallAdvance, 0, 'no stall on a real clear');
  assert.equal(dir.state, 'intermission');
  assert.equal(dir.waveElapsed, 0, 'timer reset on clear');
});

test('waves: repeated stalls keep escalating (I42)', () => {
  const { field, dir } = setup(38);
  dir.step(DT); // wave 1 active
  const S = 1 / 60;
  const stalls = [];
  for (let i = 0; i < 2 * (Math.ceil(CONFIG.wave.stallTime / S)) + 12; i++) {
    const ev = dir.step(S);
    if (ev.stallAdvance) {
      stalls.push(ev.stallAdvance);
      if (stalls.length === 2) break;
    }
  }
  assert.deepEqual(stalls, [2, 3], 'two consecutive stalls -> waves 2 then 3');
  assert.equal(dir.wave, 3);
  assert.ok(field.count > 0, 'leftover rocks persist (concurrent cap bounds density)');
});

// ---- ST-242: breather open density (I250) ----

test('ST-242: isBreatherWave flags exactly the wave right after each boss wave', () => {
  const { dir } = setup(7);
  for (const w of [6, 11, 16, 21]) assert.equal(dir.isBreatherWave(w), true, `wave ${w} is a breather`);
  for (const w of [1, 5, 7, 10, 12, 20]) assert.equal(dir.isBreatherWave(w), false, `wave ${w} is not a breather`);
});

test('ST-242: openBudgetFor is null on non-breather waves', () => {
  const { dir } = setup(7);
  for (const w of [1, 5, 7, 10, 20]) assert.equal(dir.openBudgetFor(w), null, `wave ${w} has no budget`);
});

test('ST-242: openBudgetFor caps the breather opening batch (0.5, floor 3)', () => {
  const { dir } = setup(7);
  // wave 6: content 10, limit 18 -> normal min(16,10,18)=10 -> floor(10*0.5)=5
  assert.equal(dir.openBudgetFor(6), 5);
  // wave 11: content 15, limit 24 -> min(16,15,24)=15 -> floor(15*0.5)=7
  assert.equal(dir.openBudgetFor(11), 7);
  // wave 16: content 20 (endless cap 36), limit 24 -> min(16,20,24)=16 -> floor(16*0.5)=8
  assert.equal(dir.openBudgetFor(16), 8);
});

test('ST-242: openBudgetFor floors at breatherMinRocks on a tiny fraction', () => {
  const cfg = { ...CONFIG, wave: { ...CONFIG.wave, breatherOpenFrac: 0.05 } };
  const field = new AsteroidField(new RNG(7));
  const dir = new WaveDirector(new RNG(107), field, cfg);
  // floor(10 * 0.05) = 0 -> floored to breatherMinRocks (3)
  assert.equal(dir.openBudgetFor(6), cfg.wave.breatherMinRocks);
  assert.equal(dir.openBudgetFor(6), 3);
});

test('ST-242: missing boss config disables breather detection', () => {
  const cfg = { ...CONFIG, boss: undefined };
  const field = new AsteroidField(new RNG(7));
  const dir = new WaveDirector(new RNG(107), field, cfg);
  assert.equal(dir.isBreatherWave(6), false);
  assert.equal(dir.openBudgetFor(6), null);
});

test('ST-242: wave 6 opens with the reduced batch, rest trickles in (integration)', () => {
  const { field, dir } = setup(393);
  dir.wave = 5; dir.state = 'intermission'; dir.intermission = 0.001;
  dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.startedWave, 6);
  assert.equal(dir.activeMod, 'none', 'breather = no modifier');
  assert.equal(dir.field.count, 5, 'opening batch capped at 5 (not the full 10)');
  assert.equal(dir.toSpawn, 5, '5 rocks still queued to trickle in');
  const e2 = dir.step(S);
  assert.equal(dir.field.count, 10, 'remaining 5 trickle in on the next tick');
  assert.equal(dir.toSpawn, 0);
  assert.equal(dir.openGate, null, 'gate retired after the burst completes');
  assert.equal(e2.waveCleared, 0);
});

test('ST-242: a non-breather wave still opens at full density (control)', () => {
  const { field, dir } = setup(393);
  dir.wave = 3; dir.state = 'intermission'; dir.intermission = 0.001;
  dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.startedWave, 4);
  assert.equal(dir.openGate, null, 'no gate on a non-breather wave');
  assert.equal(dir.field.count, 8, 'wave 4 content 8 all spawn on the first tick');
  assert.equal(dir.toSpawn, 0);
});

test('ST-242: a stall-advance into wave 11 also sets the breather gate', () => {
  const { field, dir } = setup(393);
  dir.wave = 10; dir.state = 'active'; dir.toSpawn = 0;
  dir.waveElapsed = CONFIG.wave.stallTime - 0.01; dir.activeMod = 'none'; dir.openGate = null;
  field.clear();
  field.spawn('M', 1, null, null, false, null, 0, false); // one leftover so the wave is not cleared this tick
  const S = 1 / 60;
  const e1 = dir.step(S);
  assert.equal(e1.stallAdvance, 11);
  assert.equal(dir.openGate, 7, 'wave 11 breather gate = floor(15 * 0.5)');
  const e2 = dir.step(S);
  assert.equal(dir.field.count, 8, 'leftover 1 + first 7 of content 15');
  assert.equal(dir.toSpawn, 8);
  assert.equal(dir.openGate, null);
});

test('ST-242: wave-6 opening is deterministic across identical stagings (x2)', () => {
  const sig = () => {
    const { field, dir } = setup(393);
    dir.wave = 5; dir.state = 'intermission'; dir.intermission = 0.001;
    dir.toSpawn = 0; dir.waveElapsed = 0; dir.activeMod = 'none'; dir.openGate = null;
    field.clear();
    const S = 1 / 60;
    dir.step(S); dir.step(S);
    return { n: field.count, pos: field.rocks.map((r) => `${r.pos.x.toFixed(3)},${r.pos.y.toFixed(3)}`).join('|') };
  };
  const a = sig();
  const b = sig();
  assert.equal(a.n, b.n);
  assert.equal(a.pos, b.pos);
});
