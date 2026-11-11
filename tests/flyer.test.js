// ST-232: FLYER evasive enemy - the Asteroids-UFO skill target (wave 9+)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { FlyerField } from '../src/core/flyer.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** Start a world and advance the wave director to wave (one step past intermission). */
function startWave(w, wave) {
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = wave - 1;
  w.step(DT, NEUTRAL);
  assert.equal(w.waves.wave, wave, 'director on wave ' + wave);
}

test('flyer: config sanity', () => {
  const s = CONFIG.flyer;
  assert.equal(s.firstWave, 9, 'gate is wave 9 (after the W8 seekers)');
  assert.ok(s.firstWave > CONFIG.drone.firstWave, 'later than seekers (wave 8)');
  assert.equal(s.perWave, 1, 'one per wave');
  assert.equal(s.maxConcurrent, 2, 'cap 2 concurrent');
  assert.ok(s.radius > 0 && s.score > 0, 'radius/score');
  assert.ok(s.cruiseSpeed < CONFIG.ship.maxSpeed, 'cruise slower than the ship');
  assert.ok(s.weaveAmp > 0 && s.weavePeriod > 0, 'weave params sane');
  assert.ok(s.lifetimeMin > 0 && s.lifetimeMin < s.lifetimeMax, 'lifetime window sane');
  assert.equal(s.hitsToKill, 2, 'two hits to kill');
  assert.equal(s.rimDist, 15, 'rim spawn 15 u from the ship');
  assert.ok(s.rmAmpScale > 0 && s.rmAmpScale < 1, 'RM reduces (never freezes) the weave');
  assert.ok(CONFIG.stinger.score < s.score, 'stinger 250 < flyer 400');
  assert.equal(s.score, CONFIG.warden.score, 'flyer sits at the warden 400 high-value rung');
});

test('flyer: juice rungs (shake 0.65 rung + killPunch 0.25 rung)', () => {
  assert.equal(CONFIG.fx.shakeTable.flyerDeath, 0.65, 'shake rung 0.65');
  assert.ok(CONFIG.fx.shakeTable.stingerDeath < 0.65 && 0.65 < CONFIG.fx.shakeTable.wardenDeath, '0.6 < 0.65 < 0.8 ordering');
  assert.equal(CONFIG.fx.killPunch.flyer, 0.25, 'killPunch rung 0.25');
  assert.ok(CONFIG.fx.killPunch.stinger < 0.25, 'stinger 0.2 < 0.25');
  assert.equal(killPunchEnergy('flyer', false, CONFIG.fx.killPunch), 0.25, 'unboosted flyer punch');
  assert.equal(killPunchEnergy('flyer', true, CONFIG.fx.killPunch), Math.min(CONFIG.fx.killPunch.max, 0.25 * 1.5), 'overdrive boost stays under the cap');
  assert.equal(killPunchEnergy('stinger', false, CONFIG.fx.killPunch), 0.2, 'stinger rung unchanged');
});

test('flyer: none before wave 9, one per eligible wave, cap 2', () => {
  const w = new World(new RNG(91));
  w.begin();
  w.spawnFlyersForWave(8);
  assert.equal(w.flyers.count, 0, 'no flyers at wave 8');
  w.spawnFlyersForWave(9);
  assert.equal(w.flyers.count, 1, 'one flyer at wave 9');
  w.spawnFlyersForWave(10);
  assert.equal(w.flyers.count, 2, 'two at wave 10');
  w.spawnFlyersForWave(11);
  assert.equal(w.flyers.count, 2, 'cap 2 holds at wave 11');
  const w2 = new World(new RNG(91));
  startWave(w2, 9);
  assert.equal(w2.flyers.count, 1, 'director start at wave 9 spawns a flyer');
});

test('flyer: rim spawn stays at least 15 u from the ship', () => {
  const field = new FlyerField(new RNG(92));
  for (let i = 0; i < 40; i++) {
    const fl = field.spawn({ x: 0, y: 0 });
    assert.ok(fl, 'spawned');
    assert.ok(Math.hypot(fl.pos.x, fl.pos.y) >= CONFIG.flyer.rimDist - 1e-9, 'rim 15 u: ' + Math.hypot(fl.pos.x, fl.pos.y).toFixed(3));
    field.clear();
  }
});

test('flyer: weave - bounded lateral oscillation over the full lifetime window', () => {
  const field = new FlyerField(new RNG(93));
  const fl = field.spawn({ x: 0, y: 0 });
  const s = CONFIG.flyer;
  let signChanges = 0, prevV = fl.weaveVel, maxOff = 0;
  for (let i = 0; i < Math.round(12 / DT) && field.count > 0; i++) {
    field.step(DT);
    const f = field.flyers[0];
    if (!f) break;
    if (f.weaveVel * prevV < 0) signChanges++;
    prevV = f.weaveVel;
    maxOff = Math.max(maxOff, Math.abs(f.weaveOff));
  }
  assert.ok(maxOff <= s.weaveAmp * 1.1, 'lateral stays within ~1 amplitude (no drift): ' + maxOff.toFixed(3));
  assert.ok(signChanges >= 6, 'weave oscillates through the window: ' + signChanges + ' sign changes');
});

test('flyer: cruise line is exact - longitudinal = speed x t, lateral = the weave state', () => {
  const f2 = new FlyerField(new RNG(94));
  const fl2 = f2.spawn({ x: 0, y: 0 });
  for (let i = 0; i < 180; i++) f2.step(DT); // 3 s
  const f = f2.flyers[0];
  const s = CONFIG.flyer;
  const dx = f.pos.x - fl2.entry.x, dy = f.pos.y - fl2.entry.y;
  const along = dx * f.dir.x + dy * f.dir.y;
  const lat = -dx * f.dir.y + dy * f.dir.x;
  assert.ok(Math.abs(along - s.cruiseSpeed * 3) < 1e-9, 'longitudinal is exact cruise: ' + along.toFixed(6));
  assert.ok(Math.abs(lat - f.weaveOff) < 1e-9, 'lateral equals the weave state: ' + lat.toFixed(6));
});

test('flyer: weave returns to its start after one period (pinned-time check)', () => {
  const f3 = new FlyerField(new RNG(95));
  const fl3 = f3.spawn({ x: 0, y: 0 });
  const off0 = fl3.weaveOff, v0 = fl3.weaveVel;
  const N = Math.round(CONFIG.flyer.weavePeriod / DT); // 0.9 s
  for (let i = 0; i < N; i++) f3.step(DT);
  const f = f3.flyers[0];
  assert.ok(Math.abs(f.weaveOff - off0) < 0.05, 'lateral offset returns: ' + (f.weaveOff - off0).toFixed(4));
  assert.ok(Math.abs(f.weaveVel - v0) < 0.3, 'lateral velocity returns: ' + (f.weaveVel - v0).toFixed(4));
});

test('flyer: reduced motion - amplitude reduced, motion kept, mid-run toggle continuous', () => {
  const s = CONFIG.flyer;
  const a = new FlyerField(new RNG(96));
  a.ampScale = s.rmAmpScale;
  const fa = a.spawn({ x: 0, y: 0 });
  const b = new FlyerField(new RNG(96));
  const fb = b.spawn({ x: 0, y: 0 });
  assert.equal(fa.lifetime, fb.lifetime, 'same seed: RM does not re-roll the lifetime');
  assert.equal(fa.hits, fb.hits, 'same seed: same flyer except the amplitude');
  let signsA = 0, prev = fa.weaveVel, maxOffA = 0, maxOffB = 0;
  for (let i = 0; i < 540 && a.count > 0 && b.count > 0; i++) { // 9 s
    a.step(DT);
    b.step(DT);
    const x = a.flyers[0], y = b.flyers[0];
    if (x && y) {
      if (x.weaveVel * prev < 0) signsA++;
      prev = x.weaveVel;
      maxOffA = Math.max(maxOffA, Math.abs(x.weaveOff));
      maxOffB = Math.max(maxOffB, Math.abs(y.weaveOff));
    }
  }
  assert.ok(maxOffA <= s.weaveAmp * s.rmAmpScale * 1.1, 'RM amplitude reduced: ' + maxOffA.toFixed(3));
  assert.ok(maxOffB > maxOffA * 1.5, 'full weave visibly bigger: ' + maxOffB.toFixed(3));
  assert.ok(signsA >= 6, 'RM keeps the motion (identity): ' + signsA + ' sign changes');
  // mid-run toggle: a single step after the ampScale change moves the flyer only ~a normal step
  const c = new FlyerField(new RNG(97));
  c.spawn({ x: 0, y: 0 });
  for (let i = 0; i < 180; i++) c.step(DT);
  const before = { x: c.flyers[0].pos.x, y: c.flyers[0].pos.y };
  c.ampScale = s.rmAmpScale;
  c.step(DT);
  const stepLen = Math.hypot(c.flyers[0].pos.x - before.x, c.flyers[0].pos.y - before.y);
  assert.ok(stepLen < 0.3, 'ampScale toggle is a small continuous step: ' + stepLen.toFixed(4));
});

test('flyer: lifetime exit (no score event) frees the slot', () => {
  const field = new FlyerField(new RNG(98));
  const fl = field.spawn({ x: 0, y: 0 });
  fl.lifetime = 0.5; // force a fast exit
  let exits = 0;
  while (field.count > 0) {
    field.step(DT);
    for (const e of field.drainEvents()) if (e.kind === 'exit') exits++;
  }
  assert.equal(exits, 1, 'one exit event');
  const again = field.spawn({ x: 30, y: 30 });
  assert.ok(again, 'exit frees the slot');
});

test('flyer: rim exit when it crosses out (no score event)', () => {
  const field = new FlyerField(new RNG(99));
  const fl = field.spawn({ x: 0, y: 0 });
  fl.lifetime = 1e9;
  const d = Math.hypot(fl.pos.x, fl.pos.y);
  fl.dir = { x: fl.pos.x / d, y: fl.pos.y / d }; // aim straight out through the rim
  fl.weaveOff = 0; fl.weaveVel = 0; // clean radial exit
  let exits = 0;
  while (field.count > 0) {
    field.step(DT);
    for (const e of field.drainEvents()) if (e.kind === 'exit') exits++;
  }
  assert.equal(exits, 1, 'rim exit event');
});

test('flyer: world - two hits to kill; first hit is a flash, second pays +400 and feeds the combo', () => {
  const w = new World(new RNG(100));
  w.begin();
  w.ship.invuln = 1e9;
  w.spawnFlyersForWave(9);
  assert.equal(w.flyers.count, 1, 'spawned');
  const fl = w.flyers.flyers[0];
  fl.pos.x = 1; fl.pos.y = 0;
  w.weapons.bullets.push({ id: 9200, pos: { x: 1, y: 0 }, radius: 2, dead: false });
  w.resolveBulletFlyers();
  const evs1 = w.drainEvents();
  assert.equal(w.flyers.count, 1, 'first hit: flyer survives (2 hp)');
  assert.ok(evs1.find(e => e.type === 'flyerHit'), 'flyerHit FX event on the first hit');
  assert.ok(!evs1.find(e => e.type === 'kill'), 'no kill on the first hit');
  w.weapons.bullets.push({ id: 9201, pos: { x: 1, y: 0 }, radius: 2, dead: false });
  w.resolveBulletFlyers();
  const evs = w.drainEvents();
  assert.equal(w.flyers.count, 0, 'second hit: destroyed');
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'flyer', 'size flyer');
  assert.equal(kill.data.points, 400, '400 base points');
  assert.equal(kill.data.combo, 1, 'feeds the combo');
  assert.ok(evs.find(e => e.type === 'flyerDeath'), 'flyerDeath FX event');
});

test('flyer: world - NO contact lethality (passing through is harmless)', () => {
  const w = new World(new RNG(101));
  w.begin();
  w.ship.invuln = 0;
  const scoreBefore = w.score;
  w.spawnFlyersForWave(9);
  const fl = w.flyers.flyers[0];
  fl.pos.x = 0; fl.pos.y = 0; // on top of the ship
  fl.lifetime = 1e9;
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.flyers.count, 1, 'flyer untouched by contact');
  assert.equal(w.lives, 3, 'no life cost');
  assert.equal(w.score, scoreBefore, 'no score from contact');
  assert.ok(!evs.find(e => e.type === 'hit'), 'no hit event');
  assert.ok(!evs.find(e => e.type === 'kill'), 'no kill event');
});

test('flyer: world - first spawn of a run emits flyerSpawn (toast), later spawns stay quiet', () => {
  const w = new World(new RNG(102));
  startWave(w, 9);
  const evs9 = w.drainEvents();
  assert.ok(evs9.find(e => e.type === 'flyerSpawn'), 'first spawn emits flyerSpawn');
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = 9;
  w.step(DT, NEUTRAL); // into wave 10
  const evs10 = w.drainEvents();
  assert.equal(w.flyers.count, 2, 'second wave spawns a second flyer');
  assert.ok(!evs10.find(e => e.type === 'flyerSpawn'), 'no repeat callout in the same run');
});

test('flyer: determinism - same seed, same timeline (two field runs)', () => {
  const f1 = new FlyerField(new RNG(103));
  const f2 = new FlyerField(new RNG(103));
  f1.spawn({ x: 1, y: 2 });
  f2.spawn({ x: 1, y: 2 });
  const t1 = [], t2 = [];
  for (let i = 0; i < 2400; i++) {
    f1.step(DT);
    f2.step(DT);
    t1.push(f1.count + ':' + f1.flyers.map(f => f.pos.x.toFixed(6) + ',' + f.pos.y.toFixed(6)).join(';') + '#' + f1.drainEvents().map(e => e.kind).join(''));
    t2.push(f2.count + ':' + f2.flyers.map(f => f.pos.x.toFixed(6) + ',' + f.pos.y.toFixed(6)).join(';') + '#' + f2.drainEvents().map(e => e.kind).join(''));
  }
  assert.deepEqual(t1, t2, 'identical timelines');
  assert.ok(t1.some(x => x.includes('#exit')), 'timeline reaches an exit');
});
