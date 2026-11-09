// ST-052: golden asteroid - rare rim-spawn rock, faster, worth 5x, never from splits
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };

function cfgGolden(over) {
  return {
    ...CONFIG,
    asteroid: { ...CONFIG.asteroid, golden: { ...CONFIG.asteroid.golden, ...over } },
  };
}

/** Begin a world and force the wave director into `wave` with a full spawn queue. */
function forceWave(world, wave) {
  world.begin();
  world.livesMgr.count = 999; // probe aid: survive the forced spawns
  const w = world.waves;
  w.state = 'active';
  w.wave = wave;
  w.waveElapsed = 0;
  w.activeMod = 'none';
  w.toSpawn = CONFIG.wave.base + CONFIG.wave.growth * wave;
}

test('golden: config sanity (seed 46)', () => {
  const g = CONFIG.asteroid.golden;
  assert.ok(g.chance > 0 && g.chance < 0.2, 'chance in (0,0.2)');
  assert.ok(g.speedMult > 1, 'speedMult > 1');
  assert.ok(g.scoreMult >= 2, 'scoreMult >= 2');
  assert.ok(g.minWave >= 3, 'minWave >= 3');
});

test('golden: spawn roll is deterministic for a pinned seed (seed 47)', () => {
  const runs = [0, 1].map(() => {
    const w = new World(new RNG(47), cfgGolden({ chance: 0.2 }));
    forceWave(w, 3);
    w.step(1 / 60, NEUTRAL);
    return w.field.rocks.map(r => [r.size, r.golden, +r.pos.x.toFixed(3), +r.pos.y.toFixed(3)]);
  });
  assert.deepEqual(runs[1], runs[0]);
});

test('golden: minWave gate - none at wave 2, all at wave 3 when chance=1 (seed 48)', () => {
  const w2 = new World(new RNG(48), cfgGolden({ chance: 1 }));
  forceWave(w2, 2);
  w2.step(1 / 60, NEUTRAL);
  assert.ok(w2.field.count > 0, 'rocks spawned');
  assert.ok(w2.field.rocks.every(r => !r.golden), 'no golden before minWave');

  w2.field.clear();
  forceWave(w2, 3);
  w2.step(1 / 60, NEUTRAL);
  assert.ok(w2.field.count > 0, 'rocks spawned (wave 3)');
  assert.ok(w2.field.rocks.every(r => r.golden), 'all golden at wave 3');
});

test('golden: speedMult = ramp x golden.speedMult (seed 48)', () => {
  const w = new World(new RNG(48), cfgGolden({ chance: 1 }));
  forceWave(w, 3);
  w.step(1 / 60, NEUTRAL);
  const ramp = Math.min(CONFIG.wave.speedCap, 1 + CONFIG.wave.speedPerWave * 3);
  for (const r of w.field.rocks) {
    assert.ok(Math.abs(r.speedMult - ramp * CONFIG.asteroid.golden.speedMult) < 1e-9, 'speedMult');
  }
});

test('golden: kill pays 5x base (seed 49)', () => {
  const cases = [
    { golden: true, want: 50 * CONFIG.asteroid.golden.scoreMult },
    { golden: false, want: 50 },
  ];
  for (const c of cases) {
    const w = new World(new RNG(49));
    forceWave(w, 3);
    w.field.clear();
    const rock = w.field.spawn('M', 1, { x: 10, y: 0 }, null, c.golden);
    w.weapons.bullets.push({ id: 99999, pos: { x: 10, y: 0 }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
    w.step(1 / 60, NEUTRAL);
    const kill = w.drainEvents().find(e => e.type === 'kill');
    assert.ok(kill, 'kill event');
    assert.equal(kill.data.golden, c.golden, 'event flag');
    assert.equal(kill.data.points, c.want, 'points');
    assert.equal(w.score, c.want, 'score');
    void rock;
  }
});

test('golden: splits are never golden (seed 49)', () => {
  const w = new World(new RNG(49), cfgGolden({ chance: 1 }));
  forceWave(w, 3);
  w.field.clear();
  const rock = w.field.spawn('L', 1, { x: 10, y: 0 }, null, true);
  assert.ok(rock.golden, 'parent golden');
  const children = w.field.destroy(rock.id);
  assert.ok(children.length > 0, 'fragments spawned');
  assert.ok(children.every(c => !c.golden), 'children never golden');
});
