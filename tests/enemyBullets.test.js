// ST-056: enemy bolts - separate pool, aimed fire, contact costs a life, determinism
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** World parked in intermission (no wave content) with a fresh boss. */
function worldWithBoss(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.spawnBossForWave(5);
  w.boss.entered = 1; // ST-135: skip the entrance (mechanism tests)
  assert.ok(w.boss, 'boss spawned');
  return w;
}

function parkedWorld(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  return w;
}

test('eBullets: config sanity (seed 59)', () => {
  const e = CONFIG.enemyBullets;
  assert.ok(e.speed < CONFIG.ship.maxSpeed, 'boss bolt dodgeable');
  assert.ok(e.mineSpeed < CONFIG.ship.maxSpeed, 'mine bolt dodgeable');
  assert.ok(e.radius > 0 && e.life > 0 && e.maxConcurrent >= 8, 'sane values');
  assert.ok(CONFIG.boss.fireEvery >= 1.5, 'boss cadence not a stinger');
  assert.ok(CONFIG.mine.fireRange > 0 && CONFIG.mine.fireEvery >= 2, 'mine cadence sane');
});

test('eBullets: boss fires aimed bolts at the ship (seed 59)', () => {
  const w = worldWithBoss(59);
  w.boss.pos.x = 10; w.boss.pos.y = 0; w.boss._vel = null;
  const frames = Math.ceil(CONFIG.boss.fireEvery / DT) + 2;
  for (let i = 0; i < frames; i++) w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  const fires = evs.filter(e => e.type === 'bossFire');
  assert.ok(fires.length >= 1, 'at least one boss bolt');
  assert.ok(w.enemyBullets.count >= 1, 'bolt in flight');
  const b = w.enemyBullets.bullets[0];
  const fp = fires[0].data.pos;
  assert.ok(b.vel.x * fp.x + b.vel.y * fp.y < 0, 'bolt velocity points at the ship (origin)');
});

test('eBullets: mines fire only in range, not beyond (seed 60)', () => {
  const w = parkedWorld(60);
  const near = w.mines.spawn();
  near.pos.x = 5; near.pos.y = 0; near.vel.x = 0; near.vel.y = 0; // inside fireRange 7
  const far = w.mines.spawn();
  far.pos.x = 15; far.pos.y = 0; far.vel.x = 0; far.vel.y = 0;   // well outside
  const frames = Math.ceil(CONFIG.mine.fireEvery / DT) + 2;
  for (let i = 0; i < frames; i++) {
    // park each mine in place: pinned position + heading aimed at the ship (no turn, no drift)
    near.pos.x = 5; near.pos.y = 0; near.vel.x = -CONFIG.mine.speed; near.vel.y = 0;
    far.pos.x = 15; far.pos.y = 0; far.vel.x = -CONFIG.mine.speed; far.vel.y = 0;
    w.step(DT, NEUTRAL);
  }
  const evs = w.drainEvents();
  const fires = evs.filter(e => e.type === 'mineFire');
  assert.ok(fires.length >= 1, 'near mine fires');
  for (const f of fires) {
    assert.ok(Math.hypot(f.data.pos.x - 5, f.data.pos.y) < 0.5, 'fired from the parked near mine');
  }
});

test('eBullets: bolt contact costs a life and consumes the bolt (seed 60)', () => {
  const w = parkedWorld(60);
  w.enemyBullets.fire({ x: 1.0, y: 0 }, { x: -1, y: 0 }, CONFIG.enemyBullets.speed);
  const livesBefore = w.lives;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.lives, livesBefore - 1, 'life lost');
  assert.ok(w.ship.isInvulnerable, 'invuln granted');
  assert.equal(w.enemyBullets.count, 0, 'bolt consumed');
  assert.ok(evs.find(e => e.type === 'hit'), 'hit event');
});

test('eBullets: deterministic trajectory for a pinned seed (seed 61)', () => {
  const run = () => {
    const w = worldWithBoss(61);
    w.boss.pos.x = 0; w.boss.pos.y = 15; w.boss._vel = null;
    w.livesMgr.count = 999;
    for (let i = 0; i < 300; i++) w.step(DT, NEUTRAL);
    return {
      boss: [+w.boss.pos.x.toFixed(3), +w.boss.pos.y.toFixed(3)],
      bolts: w.enemyBullets.bullets.map(b => [+b.pos.x.toFixed(3), +b.pos.y.toFixed(3)]),
    };
  };
  assert.deepEqual(run(), run());
});
