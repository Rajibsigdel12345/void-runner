// ST-304 (I329): seam tests for the director wiring - WaveDirector.onDecide/_modFor
// and a World-level determinism smoke with the director live. Pure core.
//
// The seam tests use a direct-set drive (primeStart: set wave/state/intermission,
// one step) rather than slow time-stepping. The initial intermission is 2.2s
// (132 ticks at DT=1/60), so a 10-step loop cannot even start wave 1. Direct-set
// isolates exactly the wave-start transition the wiring touches.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveDirector } from '../src/core/waves.js';
import { AsteroidField } from '../src/core/asteroids.js';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const DT = 1 / 60;

function makeDir(seed, everyWave) {
  const field = new AsteroidField(new RNG(seed));
  const cfg = { ...CONFIG, director: { enabled: false }, boss: { ...CONFIG.boss, everyWave: everyWave || 5 } };
  const dir = new WaveDirector(new RNG(seed + 100), field, cfg);
  dir.start();
  return { field, dir, cfg };
}

// Prime the director so that exactly wave `target` starts on the next step, then
// run that step. Returns the step event (ev.startedWave === target).
function primeStart(dir, target, onDecide) {
  dir.onDecide = onDecide;
  dir.wave = target - 1;
  dir.toSpawn = 0;
  dir.state = 'intermission';
  dir.intermission = 0; // expires on the next step
  return dir.step(DT);
}

test('director seam: onDecide density scales toSpawn (d=0.5, wave 3 -> 4)', () => {
  const { field, dir } = makeDir(3041);
  let decided = null;
  field.clear();
  // Fill the field above wave-3 concurrent limit (12) so the spawn loop is
  // suppressed at the wave-3 start: toSpawn then stays at round(content*d).
  for (let i = 0; i < 40 && field.count < 13; i++) { if (!field.spawn('M', 1, null, null, false, null, 0, false)) break; }
  const ev = primeStart(dir, 3, (w) => { decided = w; return { d: 0.5, b: 1, drop: 1, mod: 'none' }; });
  assert.equal(ev.startedWave, 3);
  assert.equal(decided, 3, 'onDecide is called with the starting wave');
  assert.equal(dir.toSpawn, 4, 'round(contentFor(3)=7 * d=0.5)=4 (Math.round(3.5))');
});

test('director seam: gentle bias removes avoid-list mods (fast -> none)', () => {
  const { field, dir } = makeDir(3040); // seed 3040 pins base mod 'fast' for wave 3
  assert.equal(dir.modifierFor(3), 'fast', 'seed 3040 pins the base mod for wave 3 (re-pin if it drifts)');
  primeStart(dir, 3, () => ({ d: 1, b: 1, drop: 1, mod: 'gentle' }));
  assert.equal(dir.wave, 3);
  assert.equal(dir.activeMod, 'none', 'gentle avoids fast');
});

test('director seam: hard bias alternates prefer list (wave 3 inward, wave 4 fast)', () => {
  const { field, dir } = makeDir(3043);
  const hard = () => ({ d: 1, b: 1, drop: 1, mod: 'hard' });
  primeStart(dir, 3, hard);
  assert.equal(dir.wave, 3);
  assert.equal(dir.activeMod, 'inward', 'prefer[3%2]=inward');
  primeStart(dir, 4, hard);
  assert.equal(dir.wave, 4);
  assert.equal(dir.activeMod, 'fast', 'prefer[4%2]=fast');
});

test('director seam: breather wave stays mod-free even under hard bias', () => {
  const { field, dir } = makeDir(3044, 2); // everyWave=2 -> wave 3 is a breather
  const hard = () => ({ d: 1, b: 1, drop: 1, mod: 'hard' });
  primeStart(dir, 3, hard);
  assert.ok(dir.isBreatherWave(3));
  assert.equal(dir.activeMod, 'none', 'breather beats the hard bias');
});

test('director seam: World smoke - skill/director live, deterministic across two seeded runs', () => {
  function run() {
    const w = new World(new RNG(3045));
    w.begin();
    const waves = [];
    for (let i = 0; i < 4500 && w.simActive; i++) {
      let near = null, nd = Infinity; // seek nearest rock so the field clears fast (wave 3 starts ~tick 3834)
      for (const r of w.field.rocks) {
        const dx = r.pos.x - w.ship.pos.x, dy = r.pos.y - w.ship.pos.y;
        const d = dx * dx + dy * dy;
        if (d < nd) { nd = d; near = r; }
      }
      const thrust = near ? { x: (near.pos.x - w.ship.pos.x) * 0.02, y: (near.pos.y - w.ship.pos.y) * 0.02 } : { x: 0, y: 0 };
      w.step(DT, { thrust, aimPoint: near ? { x: near.pos.x, y: near.pos.y } : null, firing: !!near }); // seek + shoot so wave 3 (firstWave) is reached
      for (const ev of w.drainEvents()) if (ev.type === 'wave') waves.push({ n: ev.data.n, mod: ev.data.mod });
    }
    return { waves, skillTick: w.skill.tick, log: w.director.log.map(d => [d.wave, d.d, d.b, d.drop, d.mod, d.reason]), score: w.score, wave: w.wave };
  }
  const a = run();
  const b = run();
  assert.ok(a.skillTick > 0, 'skill.sample advances each tick');
  assert.ok(a.log.length >= 1, 'the director decided for a wave');
  assert.ok(a.log.every(d => d[0] >= 3), 'decisions only from wave 3 (firstWave)');
  assert.deepEqual(a, b, 'two seeded runs are bit-identical (director included)');
});