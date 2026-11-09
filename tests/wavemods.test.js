// ST-051: wave modifiers (fast / small / inward) - deterministic per (seed, wave)
import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveDirector } from '../src/core/waves.js';
import { AsteroidField } from '../src/core/asteroids.js';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

function dirFor(seed = 39) {
  const field = new AsteroidField(new RNG(seed));
  const dir = new WaveDirector(new RNG(seed + 100), field);
  dir.start();
  return { field, dir };
}

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };

test('wavemods: config sanity', () => {
  const m = CONFIG.waveMods;
  assert.ok(m.first >= 1, 'first');
  assert.ok(m.list.length >= 2, 'list');
  assert.ok(m.fastSpeedMult > 1, 'fastSpeedMult');
  assert.ok(m.smallSBias > 0 && m.smallSBias <= 1, 'smallSBias in (0,1]');
  assert.ok(m.inwardAccel > 0, 'inwardAccel');
});

test('wavemods: modifierFor is a pure function of (seed, wave)', () => {
  const { dir } = dirFor(39);
  const { dir: dir2 } = dirFor(39);
  for (let w = 1; w <= 24; w++) assert.equal(dir.modifierFor(w), dir2.modifierFor(w), 'wave ' + w);
});

test('wavemods: waves before waveMods.first are plain', () => {
  const { dir } = dirFor(40);
  for (let w = 1; w < CONFIG.waveMods.first; w++) assert.equal(dir.modifierFor(w), 'none', 'wave ' + w);
});

test('wavemods: picks stay in the list (or a post-boss breather) and all three appear over 60 waves', () => {
  const { dir } = dirFor(41);
  const isBreather = (w) => w - 1 >= CONFIG.boss.everyWave && (w - 1) % CONFIG.boss.everyWave === 0;
  const seen = new Set();
  for (let w = CONFIG.waveMods.first; w < CONFIG.waveMods.first + 60; w++) {
    const mod = dir.modifierFor(w);
    if (isBreather(w)) {
      assert.equal(mod, 'none', 'wave ' + w + ' is a post-boss breather');
    } else {
      assert.ok(CONFIG.waveMods.list.includes(mod), 'wave ' + w + ' -> ' + mod);
      seen.add(mod);
    }
  }
  assert.equal(seen.size, CONFIG.waveMods.list.length, 'all modifiers appear (seed 41)');
});

test('wavemods: the wave after each boss wave is a modifier-free breather (I92/F9)', () => {
  const { dir } = dirFor(41);
  const ev = CONFIG.boss.everyWave;
  for (const w of [ev + 1, ev * 2 + 1, ev * 3 + 1]) assert.equal(dir.modifierFor(w), 'none', 'breather wave ' + w);
  for (const w of [ev, ev * 2, ev * 2 + 2, ev * 3]) assert.ok(CONFIG.waveMods.list.includes(dir.modifierFor(w)), 'non-breather wave ' + w);
});

test('wavemods: activeMod is set on wave start and the wave event carries it', () => {
  const w = new World(new RNG(42));
  w.begin();
  w.waves.intermission = 0.001;
  w.step(0.5, NEUTRAL);
  const evs = w.drainEvents();
  const waveEv = evs.find(e => e.type === 'wave');
  assert.ok(waveEv, 'wave event emitted');
  assert.equal(waveEv.data.mod, w.waves.activeMod, 'event carries the active modifier');
  assert.equal(waveEv.data.n, w.waves.wave, 'event carries the wave number');
});

test('wavemods: FAST multiplies spawn speed on top of the ramp', () => {
  const { dir } = dirFor(43);
  dir.wave = 5;
  dir.activeMod = 'none';
  const base = dir.speedMult;
  dir.activeMod = 'fast';
  assert.ok(Math.abs(dir.speedMult - base * CONFIG.waveMods.fastSpeedMult) < 1e-9, 'fast = base x mult');
});

test('wavemods: SMALL waves roll S far more often than plain waves', () => {
  const rolls = (mod, wave, seed) => {
    const field = new AsteroidField(new RNG(seed));
    const dir = new WaveDirector(new RNG(seed + 100), field);
    dir.start();
    dir.wave = wave;
    dir.activeMod = mod;
    let s = 0;
    for (let i = 0; i < 400; i++) if (dir.pickSize() === 'S') s++;
    return s / 400;
  };
  assert.ok(rolls('small', 3, 44) > 0.4, 'small wave: S fraction > 0.4 (got ' + rolls('small', 3, 44) + ')');
  assert.ok(rolls('none', 3, 44) < 0.4, 'plain wave: S fraction < 0.4 (baseline ~0.3, got ' + rolls('none', 3, 44) + ')');
});

test('wavemods: INWARD pulls rocks toward the arena center', () => {
  const mk = (seed) => {
    const w = new World(new RNG(seed));
    w.begin();
    w.waves.wave = 3;
    w.waves.state = 'intermission'; // keep the director from spawning
    w.waves.intermission = 1e9;
    w.waves.toSpawn = 0;
    w.waves.activeMod = 'inward';
    const r = w.field.spawn('M', 1, { x: 10, y: 0 }, null);
    r.vel.x = 0;
    r.vel.y = 0;
    return { w, r };
  };
  const { w, r } = mk(45);
  w.step(0.5, NEUTRAL);
  assert.ok(r.vel.x < 0, 'rock at (10,0) accelerates toward center (vel.x < 0)');
  assert.ok(Math.abs(r.vel.y) < 1e-9, 'no sideways component');
  const c = mk(45);
  c.w.waves.activeMod = 'none';
  c.w.step(0.5, NEUTRAL);
  assert.equal(c.r.vel.x, 0, 'no drift without the modifier');
});
