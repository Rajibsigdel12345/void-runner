// ST-019: power-up field tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { PowerUpField, POWERUP_TYPES } from '../src/core/powerups.js';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2, v2Len } from '../src/core/math.js';

const DT = 1 / 60;
const SHIP = { pos: v2(0, 0) };
function cfgWith(dropChance, extra = {}) {
  return { ...CONFIG, powerup: { ...CONFIG.powerup, dropChance, ...extra } };
}

test('powerups: magnetPull flag true only while magnet active + drop in radius (ST-177)', () => {
  const f = new PowerUpField(new RNG(3), CONFIG);
  const ship = { pos: v2(0, 0) };
  f.drops.push({ id: 900, type: 'rapid', pos: v2(3, 0), vel: v2(0, 0), life: 20, dead: false });
  f.drops.push({ id: 901, type: 'spread', pos: v2(9, 0), vel: v2(0, 0), life: 20, dead: false });
  f.step(DT, ship);
  assert.equal(f.drops[0].magnetPull, false, 'no magnet -> not pulled');
  assert.equal(f.drops[1].magnetPull, false, 'no magnet -> not pulled');
  f.apply('magnet');
  f.step(DT, ship);
  assert.equal(f.drops[0].magnetPull, true, 'magnet active + in radius (3<7) -> pulled');
  assert.equal(f.drops[1].magnetPull, false, 'magnet active + out of radius (9>7) -> not pulled');
});

test('powerups: dropChance gates and caps drops', () => {
  const never = new PowerUpField(new RNG(1), cfgWith(0));
  assert.equal(never.maybeDrop({ x: 3, y: 3 }), null);
  const always = new PowerUpField(new RNG(2), cfgWith(1));
  const d1 = always.maybeDrop({ x: 3, y: 3 });
  assert.ok(d1, 'drop on 100% chance');
  assert.ok(POWERUP_TYPES.includes(d1.type), 'type from the table');
  assert.equal(always.maybeDrop({ x: 4, y: 4 }), null, 'maxActiveDrops=1 blocks a second drop');
  assert.equal(always.count, 1);
});

test('powerups: drop drift velocity has configured magnitude', () => {
  const f = new PowerUpField(new RNG(3), cfgWith(1));
  const d = f.maybeDrop({ x: 1, y: 1 });
  assert.ok(Math.abs(v2Len(d.vel) - CONFIG.powerup.drift) < 1e-9);
});

test('powerups: pickup within radius applies + refreshes (no stacking)', () => {
  const f = new PowerUpField(new RNG(4), cfgWith(1));
  let d = f.maybeDrop({ x: 0.5, y: 0 });
  while (d.type !== 'rapid') { f.drops.length = 0; d = f.maybeDrop({ x: 0.5, y: 0 }); }
  const pk = f.step(DT, SHIP);
  assert.equal(pk.length, 1);
  assert.equal(pk[0].type, 'rapid');
  assert.ok(Math.abs(f.timeLeft.rapid - CONFIG.powerup.types.rapid.dur) < DT, 'timer applied (same-step decay)');
  // re-pickup refreshes to full, not double
  d = f.maybeDrop({ x: 0.5, y: 0 });
  while (d.type !== 'rapid') { f.drops.length = 0; d = f.maybeDrop({ x: 0.5, y: 0 }); }
  f.timeLeft.rapid = 2;
  f.step(DT, SHIP);
  assert.ok(Math.abs(f.timeLeft.rapid - CONFIG.powerup.types.rapid.dur) < DT, 'refreshed, not stacked');
});

test('powerups: magnet pulls a drop into pickup', () => {
  const f = new PowerUpField(new RNG(5), cfgWith(1));
  const d = f.maybeDrop({ x: 6, y: 0 }); // inside magnetRadius 7
  f.apply('magnet');
  assert.equal(f.count, 1);
  let picked = null;
  for (let i = 0; i < 600 && !picked; i++) {
    picked = f.step(DT, SHIP).find(p => p.id === d.id) || null;
    if (f.count === 0) break;
  }
  assert.ok(picked, 'magnetized drop reached the ship within 10s');
});

test('powerups: shield absorbs one hit; expiry clears it', () => {
  const f = new PowerUpField(new RNG(6), cfgWith(1));
  assert.ok(!f.isShielding());
  f.apply('shield');
  assert.ok(f.isShielding());
  assert.ok(f.consumeShieldHit());
  assert.ok(!f.consumeShieldHit(), 'only one hit absorbed');
  // expiry path
  f.apply('shield');
  f.timeLeft.shield = 0.05;
  f.step(0.1, SHIP);
  assert.ok(!f.isShielding(), 'timer expiry clears shield hits');
});

test('powerups: bomb queues an instant effect exactly once', () => {
  const f = new PowerUpField(new RNG(7), cfgWith(1));
  f.apply('bomb');
  assert.equal(f.takeInstant(), 'bomb');
  assert.equal(f.takeInstant(), null, 'consumed');
});

test('world: kills can drop powerups and pickups emit events', () => {
  const w = new World(new RNG(11), cfgWith(1));
  w.begin();
  const rock = w.field.spawn('M', 1, { x: 4, y: 0 });
  rock.vel = v2(0, 0);
  const dropPos = { x: rock.pos.x, y: rock.pos.y };
  w.weapons._spawn({ x: rock.pos.x, y: rock.pos.y }, 0);
  w.step(DT, { thrust: v2(0, 0), aimPoint: null, firing: false });
  assert.equal(w.powerups.count, 1, '100% drop chance -> one drop at the kill');
  // walk the ship onto the drop
  w.ship.pos = v2(w.powerups.drops[0].pos.x, w.powerups.drops[0].pos.y);
  w.step(DT, { thrust: v2(0, 0), aimPoint: null, firing: false });
  const evs = w.drainEvents();
  const pk = evs.find(e => e.type === 'powerup');
  assert.ok(pk, 'powerup event emitted');
  assert.ok(POWERUP_TYPES.includes(pk.data.type));
});

test('world: reset clears powerup state', () => {
  const w = new World(new RNG(12), cfgWith(1));
  w.begin();
  const rock = w.field.spawn('M', 1, { x: 4, y: 0 });
  rock.vel = v2(0, 0);
  w.weapons._spawn({ x: rock.pos.x, y: rock.pos.y }, 0);
  w.step(DT, { thrust: v2(0, 0), aimPoint: null, firing: false });
  w.powerups.apply('rapid');
  assert.ok(w.powerups.active('rapid'));
  w.reset();
  assert.equal(w.powerups.count, 0);
  assert.ok(!w.powerups.active('rapid'));
  assert.equal(w.powerups.shieldHits, 0);
});


test('I44: every timed power-up type has dur > 0 (HUD drain bar divides by dur); bomb is instant', () => {
  const t = CONFIG.powerup.types;
  for (const k of ['rapid', 'spread', 'shield', 'magnet']) assert.ok(t[k].dur > 0, k + ' dur > 0');
  assert.equal(t.bomb.dur, 0);
});
