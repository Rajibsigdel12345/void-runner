// I185 (ST-185): memory audit - entity-store bounds the earlier soaks left open.
// ST-077 (soak-pools) covers rocks/bullets/eb/mines/drops caps over a 10-minute
// soak; ST-138 (belt.test) covers the belt cap; I129 (droneMaxAge.test) covers the
// drone battery; I144 (splicer.test) covers Splicer bolt steady-state vs the
// enemyBullets cap. This file pins the REMAINING invariants:
//   - mine cap hammer + pendingFires drain discipline (transient queue)
//   - Splicer._pending per-tick bound (one spiral burst per step) + drain-to-empty
//   - World event double buffer: both buffers empty after two drains (ST-074)
//   - rocks+belt combined ceiling = the asteroidRenderer pool size (24 + 5)
//   - powerup render-pool contract (powerupMesh.js hardcodes pool = 4)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { MineField } from '../src/core/mines.js';
import { Splicer } from '../src/core/splicer.js';

test('mines: spawn hammer - field never exceeds maxConcurrent, over-cap returns null', () => {
  const mf = new MineField(new RNG(3));
  let nulls = 0;
  for (let i = 0; i < 100; i++) {
    const m = mf.spawn({ x: 0, y: 0 });
    if (!m) nulls++;
    assert.ok(mf.mines.length <= CONFIG.mine.maxConcurrent,
      'mines ' + mf.mines.length + ' > cap ' + CONFIG.mine.maxConcurrent + ' after spawn ' + i);
  }
  assert.equal(mf.mines.length, CONFIG.mine.maxConcurrent, 'at the cap');
  assert.equal(nulls, 100 - CONFIG.mine.maxConcurrent, 'exactly the over-cap attempts returned null');
});

test('mines: pendingFires is a per-tick transient - always empty after takeFires', () => {
  const mf = new MineField(new RNG(9));
  const ship = { x: 0, y: 0 };
  for (let i = 0; i < CONFIG.mine.maxConcurrent; i++) mf.spawn(ship);
  for (const m of mf.mines) { m.pos.x = ship.x; m.pos.y = ship.y; m.fireTimer = 0.0001; } // park in range, armed
  let drained = 0;
  for (let i = 0; i < 300; i++) {
    mf.step(1 / 60, ship);
    const fires = mf.takeFires();
    assert.ok(fires.length <= CONFIG.mine.maxConcurrent, 'one frame never fires more than the field holds');
    drained += fires.length;
    assert.equal(mf.pendingFires.length, 0, 'queue must be empty right after the drain');
  }
  assert.ok(drained > 0, 'soak actually produced fires (test is not vacuous)');
});

test('splicer: _pending holds at most one spiral burst per tick and drains to empty', () => {
  const s = new Splicer(new RNG(5), CONFIG, { x: 10, y: 0 }, 100);
  const arms = CONFIG.splicer.arms;
  let maxBetweenDrains = 0;
  for (let i = 0; i < 600; i++) {
    s.step(1 / 60);
    maxBetweenDrains = Math.max(maxBetweenDrains, s._pending.length);
    s.drainBolts();
    assert.equal(s._pending.length, 0, 'queue must be empty right after the drain');
  }
  assert.ok(maxBetweenDrains <= arms, 'one tick queues at most one burst (arms=' + arms + '), saw ' + maxBetweenDrains);
  assert.ok(maxBetweenDrains > 0, 'spiral actually fired after the entrance (test is not vacuous)');
});

test('world: event double buffer - both buffers empty after two consecutive drains', () => {
  const w = new World(new RNG(11));
  for (let i = 0; i < 500; i++) w.emit('mem', { i });
  const batch = w.drainEvents();
  assert.equal(batch.length, 500, 'first drain returns the batch');
  w.drainEvents(); // second cycle clears the parked buffer (ST-074)
  assert.equal(w.events.length, 0, 'live buffer empty');
  assert.equal(w._eventSpare.length, 0, 'spare buffer empty - steady state holds 2 frames of events, no more');
});

test('rocks+belt: combined count never exceeds the asteroidRenderer pool ceiling (maxConcurrent + belt.max)', () => {
  const w = new World(new RNG(13), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = 'idle';
  while (w.field.count < CONFIG.asteroid.maxConcurrent) w.field.spawn('S', 1, { x: 1, y: 1 });
  assert.equal(w.field.count, CONFIG.asteroid.maxConcurrent, 'normal rocks at the cap');
  for (let wave = 8; wave <= 30; wave++) w.spawnBeltForWave(wave);
  const ceiling = CONFIG.asteroid.maxConcurrent + CONFIG.belt.max; // pool size in render/asteroidRenderer.js
  assert.equal(w.field.count, ceiling, 'total = cap + belt max, exactly the render pool ceiling');
  assert.ok(w.field.count <= ceiling, 'render pool can hold every live rock');
});

test('render pool contract: powerup mesh pool (4, powerupMesh.js) covers the configured maxActiveDrops', () => {
  // render/powerupMesh.js L47 hardcodes the pool size; a config bump above it would
  // push drops past the pool index. Pin the cross-module contract here.
  const RENDER_POOL = 4;
  assert.ok(CONFIG.powerup.maxActiveDrops <= RENDER_POOL,
    'maxActiveDrops ' + CONFIG.powerup.maxActiveDrops + ' must fit the hardcoded render pool of ' + RENDER_POOL);
});
