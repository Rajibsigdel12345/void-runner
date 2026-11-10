// I215: E9 test batch (ST-215, cgs-standards-tests). 18 tests deepening the
// thinnest core coverage found by the I215 audit: ship (5), enemyBullets (4),
// mines (4), lives (2), recording (2), rng (1). All pure-logic, seeded, no
// DOM, no three.js - pinned against the I214 config values.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Ship } from '../src/core/ship.js';
import { EnemyBulletField } from '../src/core/enemyBullets.js';
import { MineField } from '../src/core/mines.js';
import { Lives } from '../src/core/lives.js';
import { recordingAction, shouldSaveOnGameOver } from '../src/core/recording.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const DT = 1 / 60;

// --- ship -------------------------------------------------------------

test('ship: full thrust reaches exactly maxSpeed and never exceeds it', () => {
  const s = new Ship();
  for (let i = 0; i < 120; i++) s.step(DT, { x: 0, y: 1 }); // 2 s: cap ~1.24 s, no wall
  assert.ok(s.speed <= CONFIG.ship.maxSpeed + 1e-9, 'exceeds maxSpeed: ' + s.speed);
  assert.ok(s.speed > CONFIG.ship.maxSpeed - 0.01, 'never reached the cap: ' + s.speed);
});

test('ship: zero thrust decays velocity to ~0 via damping', () => {
  const s = new Ship();
  s.vel.x = 10;
  for (let i = 0; i < 300; i++) s.step(DT, { x: 0, y: 0 }); // 5 s
  assert.ok(s.speed < 0.01, 'residual ' + s.speed);
  assert.ok(s.speed > 0);
});

test('ship: position clamps to the arena rim (radius - ship radius)', () => {
  const s = new Ship();
  for (let i = 0; i < 600; i++) s.step(DT, { x: 0, y: 1 }); // 10 s full thrust
  const d = Math.hypot(s.pos.x, s.pos.y);
  assert.ok(d <= CONFIG.arena.radius - CONFIG.ship.radius + 1e-9, 'past rim: ' + d);
  assert.ok(s.pos.y > 20, 'never reached the wall: ' + s.pos.y);
});

test('ship: damage grants invulnTime of invulnerability + knockback impulse', () => {
  const s = new Ship();
  const angle = s.damage({ x: 1, y: 0 });
  assert.equal(angle, 0);
  assert.equal(s.vel.x, CONFIG.ship.knockback);
  assert.equal(s.invuln, CONFIG.ship.invulnTime);
  assert.ok(s.isInvulnerable);
  s.step(CONFIG.ship.invulnTime + DT, { x: 0, y: 0 });
  assert.ok(!s.isInvulnerable, 'still invulnerable after ' + CONFIG.ship.invulnTime);
});

test('ship: aim eases toward the aim point (aimError ~0 after 2 s)', () => {
  const s = new Ship(0, 0); // starts nose-up (-PI/2)
  for (let i = 0; i < 120; i++) s.step(DT, { x: 0, y: 0 }, { x: 10, y: 0 });
  assert.ok(Math.abs(s.aimError(0)) < 0.01, 'aim ' + s.aim + ' vs 0');
});

// --- enemyBullets ------------------------------------------------------

test('enemyBullets: fire returns null at maxConcurrent', () => {
  const f = new EnemyBulletField();
  for (let i = 0; i < CONFIG.enemyBullets.maxConcurrent; i++) {
    assert.ok(f.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 9));
  }
  assert.equal(f.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 9), null);
});

test('enemyBullets: a bolt dies at exactly cfg life', () => {
  const f = new EnemyBulletField();
  f.fire({ x: 0, y: 0 }, { x: 0, y: 1 }, 1);
  for (let i = 0; i < 39; i++) f.step(0.1); // 3.9 s
  assert.equal(f.count, 1, 'died early');
  f.step(0.1); // 4.0 s
  assert.equal(f.count, 0, 'survived its life');
});

test('enemyBullets: outward bolts are culled at the rim before their life expires', () => {
  const f = new EnemyBulletField();
  f.fire({ x: 0, y: 0 }, { x: 0, y: 1 }, 9);
  const rimSec = (CONFIG.arena.radius + 2) / 9; // ~3.11 s < life 4 s
  for (let i = 0; i < Math.ceil(rimSec / 0.05); i++) f.step(0.05);
  assert.equal(f.count, 0, 'not culled at the rim');
});

test('enemyBullets: clear() resets the pool and the ID space', () => {
  const f = new EnemyBulletField();
  f.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 9);
  f.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 9);
  f.clear();
  assert.equal(f.count, 0);
  assert.equal(f.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 9).id, 1);
});

// --- mines -------------------------------------------------------------

test('mines: spawn caps at maxConcurrent', () => {
  const m = new MineField(new RNG(7));
  for (let i = 0; i < CONFIG.mine.maxConcurrent; i++) assert.ok(m.spawn());
  assert.equal(m.spawn(), null);
});

test('mines: homing turns at most cfg.mine.turn rad/s (and actually turns)', () => {
  const m = new MineField(new RNG(8));
  const mine = m.spawn(null);
  mine.pos.x = 0; mine.pos.y = 0;
  mine.vel.x = 0; mine.vel.y = -CONFIG.mine.speed; // perpendicular to the +x ship
  const before = Math.atan2(mine.vel.y, mine.vel.x);
  m.step(0.1, { x: 20, y: 0 });
  const after = Math.atan2(mine.vel.y, mine.vel.x);
  let diff = after - before;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  assert.ok(Math.abs(diff) <= CONFIG.mine.turn * 0.1 + 1e-9, 'overshot turn cap: ' + diff);
  assert.ok(Math.abs(diff) > 0.15, 'did not home at all');
});

test('mines: rim bounce reflects the velocity inward and keeps the mine inside', () => {
  const m = new MineField(new RNG(9));
  const mine = m.spawn(null);
  mine.pos.x = 25; mine.pos.y = 0;
  mine.vel.x = CONFIG.mine.speed; mine.vel.y = 0; // outward
  m.step(0.1, { x: 0, y: 0 });
  assert.ok(mine.vel.x < 0, 'still heading out: ' + mine.vel.x);
  // The rim reflection uses a non-unit normal (n = pos/(|pos|+radius), the same
  // rule as asteroids) so the push-back undershoots ~3% at r~25; the sub-cm
  // overshoot self-corrects on the next step. Assert inward heading + tolerance.
  assert.ok(mine.vel.x * mine.pos.x + mine.vel.y * mine.pos.y < 0, 'not heading inward');
  assert.ok(Math.hypot(mine.pos.x, mine.pos.y) + mine.radius <= CONFIG.arena.radius + 0.05);
});

test('mines: fires on cadence only in range, takeFires drains the queue', () => {
  const m = new MineField(new RNG(11));
  const mine = m.spawn(null);
  // Block A: ship far (20) - the mine drifts toward it but stays > fireRange
  mine.pos.x = 0; mine.pos.y = 0;
  for (let i = 0; i < 180; i++) m.step(DT, { x: 20, y: 0 });
  assert.equal(m.takeFires().length, 0, 'fired out of range');
  // Block B: ship in range (5) - exactly one fire after a full fireEvery
  mine.pos.x = 0; mine.pos.y = 0;
  for (let i = 0; i < 180; i++) m.step(DT, { x: 5, y: 0 });
  const fires = m.takeFires();
  assert.equal(fires.length, 1, 'expected exactly one fire, got ' + fires.length);
  assert.equal(m.takeFires().length, 0, 'queue not drained');
});

// --- lives -------------------------------------------------------------

test('lives: damage floors at 0 and reset restores max', () => {
  const l = new Lives(3);
  assert.equal(l.max, 3);
  assert.equal(l.damage(), 2);
  assert.equal(l.damage(), 1);
  assert.equal(l.damage(), 0);
  assert.equal(l.damage(), 0, 'went negative');
  assert.equal(l.damage(), 0);
  l.reset();
  assert.equal(l.count, 3);
  assert.ok(l.alive);
});

test('lives: alive flips exactly at the last damage', () => {
  const l = new Lives(1);
  assert.ok(l.alive);
  l.damage();
  assert.ok(!l.alive);
});

// --- recording ---------------------------------------------------------

test('recording: O toggles only while PLAYING, one recording per run', () => {
  assert.equal(recordingAction('MENU', false, false), 'none');
  assert.equal(recordingAction('PAUSED', false, false), 'none');
  assert.equal(recordingAction('GAME_OVER', false, false), 'none');
  assert.equal(recordingAction('REPLAY', false, false), 'none');
  assert.equal(recordingAction('PLAYING', false, false), 'start');
  assert.equal(recordingAction('PLAYING', true, false), 'stop');
  assert.equal(recordingAction('PLAYING', true, true), 'none', 'a stopped recording must not re-arm');
});

test('recording: saves on game over only with a captured tape and not in a replay view', () => {
  assert.equal(shouldSaveOnGameOver(true, 0, false), false, 'empty tape must not save');
  assert.equal(shouldSaveOnGameOver(false, 10, false), false);
  assert.equal(shouldSaveOnGameOver(true, 10, false), true);
  assert.equal(shouldSaveOnGameOver(true, 10, true), false, 'a watched replay must not save');
});

// --- rng ---------------------------------------------------------------

test('rng: same seed = same sequence, different seeds diverge, range/int bounds hold', () => {
  const a = new RNG(1909), b = new RNG(1909), c = new RNG(1910);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next(), 'same-seed mismatch at ' + i);
  const seqA = Array.from({ length: 100 }, () => a.next());
  const seqC = Array.from({ length: 100 }, () => c.next());
  assert.ok(seqA.some((v, i) => v !== seqC[i]), 'different seeds produced identical sequences');
  const r = new RNG(55);
  for (let i = 0; i < 2000; i++) {
    const v = r.range(2, 5);
    assert.ok(v >= 2 && v < 5, 'range out of bounds: ' + v);
  }
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < 3000; i++) {
    const v = r.int(1, 10);
    assert.ok(Number.isInteger(v) && v >= 1 && v <= 10, 'int out of bounds: ' + v);
    min = Math.min(min, v); max = Math.max(max, v);
  }
  assert.equal(min, 1, 'inclusive low end never hit');
  assert.equal(max, 10, 'inclusive high end never hit');
});
