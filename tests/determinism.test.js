// ST-076: determinism harness - fixed seed + fixed input script replayed twice must
// produce bit-identical world state (core is pure + all randomness is seeded RNG).
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';

const DT = 1 / 60;

// Canonical state snapshot (exact float values - any non-determinism fails the deep-equal).
function snapshot(w) {
  return {
    time: w.time,
    state: w.game.state,
    score: w.score,
    sk: { score: w.scoreKeeper.score, kills: w.scoreKeeper.kills, combo: w.scoreKeeper.combo, maxCombo: w.scoreKeeper.maxCombo },
    lives: w.livesMgr.count,
    wave: w.wave,
    rocks: w.field.rocks.map((r) => ({ id: r.id, size: r.size, x: r.pos.x, y: r.pos.y, vx: r.vel.x, vy: r.vel.y, spin: r.spin, rot: r.rot, golden: r.golden })),
    bullets: w.weapons.bullets.filter((b) => !b.dead).map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })),
    mines: w.mines.mines.filter((m) => !m.dead).map((m) => ({ id: m.id, x: m.pos.x, y: m.pos.y })),
    eb: w.enemyBullets.bullets.filter((b) => !b.dead).map((b) => ({ id: b.id, x: b.pos.x, y: b.pos.y })),
    drops: w.powerups.drops.map((d) => ({ id: d.id, type: d.type, x: d.pos.x, y: d.pos.y })),
    tl: { rapid: w.powerups.timeLeft.rapid, spread: w.powerups.timeLeft.spread, shield: w.powerups.timeLeft.shield, magnet: w.powerups.timeLeft.magnet, overdrive: w.powerups.timeLeft.overdrive },
    boss: w.boss ? { hp: w.boss.hp, x: w.boss.pos.x, y: w.boss.pos.y, state: w.boss.state, alive: !w.boss.dead } : null
  };
}

// Deterministic input script: oscillating thrust, always firing, aim at nearest live rock
// (aim derived from world state, so identical state => identical intent => true replay).
function intentFor(w, i) {
  let nearest = null;
  let best = Infinity;
  for (const r of w.field.rocks) {
    if (r.dead) continue;
    const dx = r.pos.x - w.ship.pos.x;
    const dy = r.pos.y - w.ship.pos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) { best = d2; nearest = r; }
  }
  return {
    thrust: { x: Math.cos(i * 0.013) * 0.8, y: Math.sin(i * 0.011) * 0.8 },
    aimPoint: nearest ? { x: nearest.pos.x, y: nearest.pos.y } : null,
    firing: true
  };
}

function runScript(seed, steps, checkpointEvery) {
  const w = new World(new RNG(seed));
  w.begin();
  const checkpoints = [];
  for (let i = 0; i < steps; i++) {
    w.step(DT, intentFor(w, i));
    if (checkpointEvery && (i + 1) % checkpointEvery === 0) checkpoints.push(snapshot(w));
  }
  checkpoints.push(snapshot(w));
  return { w, checkpoints };
}

test('determinism: same seed + same 90s input script => bit-identical state (ST-076)', () => {
  const steps = 5400; // 90 simulated seconds - multiple waves, kills, power-up rolls
  const a = runScript(999, steps, 900); // checkpoint every 15s
  const b = runScript(999, steps, 900);
  assert.deepEqual(a.checkpoints, b.checkpoints, 'every 15s checkpoint + final snapshot must be identical');
  const s = a.checkpoints[a.checkpoints.length - 1];
  // the run must have exercised real content (harness is not a no-op):
  assert.ok(s.sk.kills > 0, 'kills happened');
  assert.ok(s.wave >= 2, `wave reached ${s.wave}`);
});

test('determinism: different seeds with the same script diverge (sanity)', () => {
  const a = runScript(999, 1800, 0);
  const b = runScript(1000, 1800, 0);
  const sa = a.checkpoints[0], sb = b.checkpoints[0];
  assert.notDeepEqual(sa, sb, 'different seeds must produce different states');
});

test('determinism: pause/resume mid-replay keeps both runs identical (ST-076)', () => {
  function runWithPause(seed) {
    const w = new World(new RNG(seed));
    w.begin();
    const shots = [];
    for (let i = 0; i < 3600; i++) {
      if (i === 1500) w.pause();
      if (i === 1510) w.resume();
      if (w.game.state === 'PLAYING') w.step(DT, intentFor(w, i));
      if (i === 1501) shots.push(snapshot(w));
    }
    return [shots[0], snapshot(w)];
  }
  assert.deepEqual(runWithPause(777), runWithPause(777));
});
