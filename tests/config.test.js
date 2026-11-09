import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';

test('config: schema sanity - required sections exist', () => {
  for (const key of ['arena', 'ship', 'weapon', 'asteroid', 'wave', 'combo', 'powerup', 'fx', 'storage']) {
    assert.ok(CONFIG[key], `missing section: ${key}`);
  }
});

test('config: numeric tunables are positive finite', () => {
  const check = (v, name) => {
    assert.ok(Number.isFinite(v) && v > 0, `${name} must be positive finite, got ${v}`);
  };
  check(CONFIG.arena.radius, 'arena.radius');
  check(CONFIG.ship.accel, 'ship.accel');
  check(CONFIG.ship.maxSpeed, 'ship.maxSpeed');
  check(CONFIG.ship.damping, 'ship.damping');
  check(CONFIG.ship.invulnTime, 'ship.invulnTime');
  assert.ok(CONFIG.ship.lives >= 1, 'ship.lives');
  check(CONFIG.weapon.fireInterval, 'weapon.fireInterval');
  check(CONFIG.weapon.bulletSpeed, 'weapon.bulletSpeed');
  check(CONFIG.weapon.bulletLife, 'weapon.bulletLife');
  assert.ok(CONFIG.weapon.maxBullets >= 1, 'weapon.maxBullets');
  check(CONFIG.combo.window, 'combo.window');
  assert.ok(CONFIG.combo.cap >= 1, 'combo.cap');
  assert.ok(CONFIG.combo.step > 0, 'combo.step');
  assert.ok(CONFIG.powerup.dropChance >= 0 && CONFIG.powerup.dropChance <= 1, 'powerup.dropChance in [0,1]');
  check(CONFIG.powerup.magnetAccel, 'powerup.magnetAccel');
});

test('config: asteroid size chain L->M->S with decreasing radius', () => {
  const s = CONFIG.asteroid.sizes;
  assert.ok(s.L.radius > s.M.radius && s.M.radius > s.S.radius, 'radii decrease down the chain');
  assert.equal(s.L.child, 'M');
  assert.equal(s.M.child, 'S');
  assert.equal(s.S.child, null);
  assert.deepEqual(s.S.splits, [], 'small rocks do not split');
  for (const size of Object.values(s)) {
    assert.ok(size.speed[0] > 0 && size.speed[1] >= size.speed[0], `${size} speed range valid`);
    assert.ok(size.score > 0, 'score positive');
  }
  // GDD: smaller rocks score more
  assert.ok(s.S.score > s.M.score && s.M.score > s.L.score, 'score increases as size decreases');
});

test('config: wave ramp values per GDD', () => {
  const w = CONFIG.wave;
  assert.ok(w.base >= 2, 'wave.base');
  assert.ok(w.speedPerWave > 0, 'wave.speedPerWave');
  assert.ok(w.speedCap >= 1, 'wave.speedCap');
  assert.ok(w.maxConcurrentCap >= w.base, 'wave caps consistent');
  assert.ok(w.intermission > 0, 'wave.intermission');
});

test('config: powerup types complete with durations', () => {
  const types = CONFIG.powerup.types;
  for (const t of ['rapid', 'spread', 'shield', 'bomb', 'magnet']) {
    assert.ok(types[t], `missing powerup type: ${t}`);
  }
  assert.ok(types.spread.count >= 2, 'spread needs >=2 shots');
  assert.ok(types.spread.arc > 0, 'spread arc');
});

test('config: fx.bloom values are sane (I35)', () => {
  const b = CONFIG.fx.bloom;
  assert.ok(Number.isFinite(b.strength) && b.strength > 0, 'strength positive finite');
  assert.ok(Number.isFinite(b.radius) && b.radius > 0, 'radius positive finite');
  assert.ok(b.threshold >= 0 && b.threshold <= 1, 'threshold in [0,1]');
});
