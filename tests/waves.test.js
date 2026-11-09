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
  // force-clear to advance
  for (let i = 0; i < 40; i++) {
    field.clear();
    const ev = dir.step(DT);
    if (dir.wave >= 17) break;
    if (ev.waveCleared === 0 && field.count > 0 && dir.toSpawn === 0) field.clear();
  }
  assert.ok(dir.wave >= 17, `reached wave ${dir.wave}`);
  assert.ok(Math.abs(dir.speedMult - CONFIG.wave.speedCap) < 1e-9, 'speed capped');
  assert.equal(dir.concurrentLimit, CONFIG.wave.maxConcurrentCap, 'concurrency capped');
});

test('waves: wave 10 numbers per GDD ramp', () => {
  const { field, dir } = setup();
  dir.wave = 10; // direct probe of the formulas
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
