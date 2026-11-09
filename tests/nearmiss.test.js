// ST-053: near-miss bonus - graze = flat points + swish, once per approach, no combo
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const NM = CONFIG.nearMiss;
const DT = 1 / 60;
// steps needed for spawn immunity (0.3s) to expire
const SETTLE = Math.ceil((NM.spawnImmunity + 0.05) / DT);

/** Parked M rock at (2.3, 0): no collision (2.3 > 0.9+1.3) but inside the graze ring. */
function grazeRock(w) {
  const r = w.field.spawn('M', 1, { x: 2.3, y: 0 });
  r.vel.x = 0; r.vel.y = 0; r.spin = 0;
  return r;
}

test('nearmiss: config sanity (seed 50)', () => {
  assert.ok(NM.radius > 1.5 && NM.radius < 5, 'radius sane');
  assert.ok(NM.points > 0, 'points > 0');
  assert.ok(NM.rearmMult > 1, 'rearmMult > 1');
  assert.ok(NM.spawnImmunity > 0, 'spawnImmunity > 0');
});

test('nearmiss: graze pays flat bonus, no damage, no combo (seed 50)', () => {
  const w = new World(new RNG(50));
  w.begin();
  const rock = grazeRock(w);
  let evs = [];
  for (let i = 0; i < SETTLE; i++) {
    w.step(DT, NEUTRAL);
    evs = evs.concat(w.drainEvents());
  }
  const nm = evs.filter(e => e.type === 'nearmiss');
  assert.equal(nm.length, 1, 'one nearmiss event');
  assert.equal(nm[0].data.points, NM.points, 'flat points');
  assert.equal(w.score, NM.points, 'score raised');
  assert.equal(w.scoreKeeper.combo, 0, 'combo untouched');
  assert.equal(w.lives, CONFIG.ship.lives, 'no life lost');
  assert.ok(!rock.dead, 'rock survives');
  assert.equal(evs.filter(e => e.type === 'hit').length, 0, 'no hit event');
});

test('nearmiss: exactly one award per approach (seed 50)', () => {
  const w = new World(new RNG(50));
  w.begin();
  grazeRock(w);
  let count = 0;
  for (let i = 0; i < SETTLE + 20; i++) {
    w.step(DT, NEUTRAL);
    count += w.drainEvents().filter(e => e.type === 'nearmiss').length;
  }
  assert.equal(count, 1, 'single award while parked in the ring');
  assert.equal(w.score, NM.points, 'no repeated points');
});

test('nearmiss: rock re-arms after leaving the extended ring (seed 51)', () => {
  const w = new World(new RNG(51));
  w.begin();
  const rock = grazeRock(w);
  for (let i = 0; i < SETTLE; i++) w.step(DT, NEUTRAL);
  w.drainEvents();
  assert.equal(w.score, NM.points, 'first graze');
  // walk the rock out beyond radius * rearmMult and back in
  rock.pos.x = 8; rock.pos.y = 0;
  for (let i = 0; i < 3; i++) w.step(DT, NEUTRAL);
  w.drainEvents();
  rock.pos.x = 2.3;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(evs.filter(e => e.type === 'nearmiss').length, 1, 'second approach scores');
  assert.equal(w.score, NM.points * 2, 'double bonus');
});

test('nearmiss: suppressed while invulnerable (seed 52)', () => {
  const w = new World(new RNG(52));
  w.begin();
  w.ship.damage(v2(1, 0)); // grants the full invuln window (1.6s)
  assert.ok(w.ship.isInvulnerable, 'invuln set');
  const rock = grazeRock(w);
  // park in the ring through the whole invuln window (96 frames > SETTLE)
  for (let i = 0; i < CONFIG.ship.invulnTime / DT + 5; i++) w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(evs.filter(e => e.type === 'nearmiss').length, 0, 'no graze award under invuln');
  assert.equal(w.score, 0, 'no points');
  assert.ok(!rock.nearHot, 'rock did not latch the approach (no silent loss)');
});

test('nearmiss: bonus does not extend a live combo chain (seed 52)', () => {
  const w = new World(new RNG(52));
  w.begin();
  // kill an S at range first: combo 1
  w.field.spawn('S', 1, { x: 10, y: 0 });
  w.weapons.bullets.push({ id: 99999, pos: { x: 10, y: 0 }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
  w.step(DT, NEUTRAL);
  w.drainEvents();
  assert.equal(w.scoreKeeper.combo, 1, 'combo from the kill');
  const before = w.score;
  grazeRock(w);
  for (let i = 0; i < SETTLE; i++) w.step(DT, NEUTRAL);
  w.drainEvents();
  assert.equal(w.score - before, NM.points, 'flat bonus');
  assert.equal(w.scoreKeeper.combo, 1, 'combo unchanged by graze');
});
