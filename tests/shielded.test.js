// ST-121: shielded rock tests (core-only)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;
const AT = { x: 10, y: 0 }; // inside the arena, far from the origin ship -> no graze/contact

function freshWorld(seed) { const w = new World(new RNG(seed)); w.begin(); return w; }
// spawn a stationary shielded rock at AT
function spawnShielded(w) {
  const r = w.field.spawn(CONFIG.asteroid.shielded.size, 1, AT, null, false, null, 0, true);
  r.vel = v2(0, 0);
  return r;
}
// place a bullet at the rock center and advance one tick (exactly one armor hit)
function shoot(w, rock) { w.weapons._spawn({ x: rock.pos.x, y: rock.pos.y }, 0); w.step(DT, NOINTENT); }

test('shielded: config is sane', () => {
  const s = CONFIG.asteroid.shielded;
  assert.ok(s.chance >= 0 && s.chance < 1, 'chance in [0,1)');
  assert.ok(s.armor >= 2, 'armor needs more than one hit to be meaningful');
  const maxBase = Math.max(CONFIG.asteroid.sizes.L.score, CONFIG.asteroid.sizes.M.score, CONFIG.asteroid.sizes.S.score);
  assert.ok(s.score > maxBase, 'reward exceeds any single rock');
  assert.ok(CONFIG.asteroid.sizes[s.size], 'size key exists');
  assert.ok(s.minWave >= 1, 'minWave positive');
});

test('shielded: spawn sets the flag + armor; a normal spawn does not', () => {
  const w = freshWorld(101);
  const sh = w.field.spawn('M', 1, AT, null, false, null, 0, true);
  assert.equal(sh.shielded, true, 'shielded true');
  assert.equal(sh.armor, CONFIG.asteroid.shielded.armor, 'armor from config');
  assert.equal(sh.dead, false, 'alive');
  const plain = w.field.spawn('M', 1, { x: -10, y: 0 }, null, false, null, 0);
  assert.ok(!plain.shielded, 'normal rock not shielded');
  assert.equal(plain.armor, 0, 'normal rock armor 0');
});

test('shielded: a hit below exhaustion is absorbed (no destroy, no split)', () => {
  const w = freshWorld(102);
  const sh = spawnShielded(w);
  const before = w.field.count;
  const res = w.field.hit(sh.id);
  assert.equal(res.destroyed, false, 'absorbed');
  assert.equal(res.shielded, true, 'shielded');
  assert.equal(res.armorLeft, CONFIG.asteroid.shielded.armor - 1, 'one armor down');
  assert.equal(w.field.count, before, 'no fragments, rock still present');
  assert.equal(sh.dead, false, 'rock alive');
});

test('shielded: armor exhaustion shatters and NEVER splits', () => {
  const w = freshWorld(103);
  const sh = spawnShielded(w);
  const armor = CONFIG.asteroid.shielded.armor;
  let res;
  for (let i = 0; i < armor; i++) { res = w.field.hit(sh.id); if (i < armor - 1) assert.equal(res.destroyed, false, 'absorbed at ' + i); }
  assert.equal(res.destroyed, true, 'final hit destroys');
  assert.equal(res.shielded, true, 'shielded');
  assert.equal(res.armorLeft, 0, 'exhausted');
  assert.equal(sh.dead, true, 'rock dead');
  assert.equal(w.field.count, 0, 'NO fragments (never splits)');
});

test('shielded: a normal M rock at the same spot DOES split (contrast)', () => {
  const w = freshWorld(104);
  const m = w.field.spawn('M', 1, AT, null, false, null, 0);
  m.vel = v2(0, 0);
  const res = w.field.hit(m.id);
  assert.equal(res.destroyed, true, 'normal rock destroyed');
  assert.equal(res.shielded, false, 'not shielded');
  assert.ok(res.children.length >= 1, 'normal rock splits');
  assert.ok(w.field.count >= 1, 'fragments present');
});

test('shielded: destroy() (the ship-ram / bomb path) also never splits a shielded rock', () => {
  const w = freshWorld(105);
  const sh = spawnShielded(w);
  const children = w.field.destroy(sh.id);
  assert.deepEqual(children, [], 'no children from a direct destroy');
  assert.equal(w.field.count, 0, 'rock gone, no fragments');
});

test('shielded: absorbed hits score nothing + emit rockShieldHit; shatter pays shielded.score', () => {
  const w = freshWorld(106);
  const sh = spawnShielded(w);
  shoot(w, sh); // armor 3 -> 2
  assert.equal(w.score, 0, 'absorbed hit scores nothing');
  let ev = w.drainEvents().find(e => e.type === 'rockShieldHit');
  assert.ok(ev, 'rockShieldHit emitted on absorb');
  assert.equal(ev.data.armorLeft, CONFIG.asteroid.shielded.armor - 1, 'armorLeft carried on the event');
  shoot(w, sh); // armor 2 -> 1
  assert.equal(w.score, 0, 'still no score');
  w.drainEvents();
  shoot(w, sh); // armor 1 -> 0 -> shatter
  assert.equal(w.score, CONFIG.asteroid.shielded.score, 'shatter pays the flat reward');
  const kill = w.drainEvents().find(e => e.type === 'kill');
  assert.ok(kill, 'kill emitted on shatter');
  assert.equal(kill.data.shielded, true, 'kill event flags shielded');
});

test('shielded: bomb shatter of a shielded rock pays shielded.score (not the size score)', () => {
  const w = freshWorld(107);
  const sh = spawnShielded(w);
  w.bombBlast();
  assert.equal(w.field.count, 0, 'rock cleared');
  assert.equal(w.score, CONFIG.asteroid.shielded.score, 'bomb path uses shielded.score');
});
