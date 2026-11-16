// ST-418: GUNSHIP - a slow, high-HP heavy bomber (wave 8+). Enters to a mid-arena hold,
// lingers and fires ARMs -> slow, big aimed bolts. 10 hits to kill; also self-destructs
// after maxAge so it cannot pile onto later waves. Contact costs a life (no score).
// DOM-free, three-free. Mirrors the flyer/stinger world-test conventions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { GunshipField } from '../src/core/gunship.js';
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

test('gunship: config sanity', () => {
  const s = CONFIG.gunship;
  assert.equal(s.firstWave, 8, 'gate is wave 8 (with the seekers)');
  assert.ok(s.firstWave >= CONFIG.drone.firstWave, 'at or after the seekers (wave 8)');
  assert.equal(s.perWave, 1, 'one per wave');
  assert.equal(s.maxConcurrent, 1, 'cap 1 concurrent');
  assert.ok(s.radius > 0 && s.score > 0, 'radius/score');
  assert.equal(s.hp, 10, '10 hits to kill');
  assert.equal(s.boltSpeed, 5.5, 'slow heavy bolt');
  assert.equal(s.boltRadius, 0.5, 'big bolt');
  assert.ok(s.boltSpeed < CONFIG.ship.maxSpeed, 'bolt dodgeable');
  assert.ok(s.boltSpeed < CONFIG.enemyBullets.speed, 'slower than a normal enemy bolt');
  assert.ok(s.boltRadius > CONFIG.enemyBullets.radius, 'bigger than a normal enemy bolt');
  assert.ok(s.maxAge > 0, 'self-destructs after maxAge');
  assert.equal(s.rimDist, 14, 'rim spawn 14 u from the ship');
  assert.ok(s.enterSpeed > 0 && s.holdDist > 0, 'enter params sane');
  assert.ok(s.armDur > 0 && s.fireEvery > s.armDur, 'fire cadence (arm before fire)');
  assert.ok(s.holdRadiusMin > 0 && s.holdRadiusMin < s.holdRadiusMax, 'hold window sane');
  assert.ok(CONFIG.flyer.score < s.score, 'flyer 400 < gunship 600');
  assert.equal(s.score, CONFIG.splicer.score, 'gunship sits at the splicer 600 rung');
});

test('gunship: juice rungs (shake 0.85 rung + killPunch 0.3 rung)', () => {
  assert.equal(CONFIG.fx.shakeTable.gunshipDeath, 0.85, 'shake rung 0.85');
  assert.ok(CONFIG.fx.shakeTable.wardenDeath < 0.85 && 0.85 < CONFIG.fx.shakeTable.bossDeath, '0.8 < 0.85 < 1.0 ordering');
  assert.equal(CONFIG.fx.killPunch.gunship, 0.3, 'killPunch rung 0.3');
  assert.ok(CONFIG.fx.killPunch.flyer < 0.3, 'flyer 0.25 < gunship 0.3');
  assert.equal(killPunchEnergy('gunship', false, CONFIG.fx.killPunch), 0.3, 'unboosted gunship punch');
  assert.equal(killPunchEnergy('gunship', true, CONFIG.fx.killPunch), CONFIG.fx.killPunch.max, 'overdrive boost hits the cap');
  assert.equal(CONFIG.fx.shockwave.classes.gunship, 3.6, 'shockwave class 3.6');
  assert.ok(CONFIG.fx.shockwave.classes.hunter < 3.6, 'hunter 2.2 < gunship 3.6');
  assert.equal(CONFIG.fx.flashTable.gunshipDeath, 0.4, 'screen flash on gunship death');
});

test('gunship: none before wave 8, one per eligible wave, cap 1', () => {
  const w = new World(new RNG(141));
  w.begin();
  w.spawnGunshipForWave(7);
  assert.equal(w.gunships.count, 0, 'no gunships at wave 7');
  w.spawnGunshipForWave(8);
  assert.equal(w.gunships.count, 1, 'one gunship at wave 8');
  w.spawnGunshipForWave(9);
  assert.equal(w.gunships.count, 1, 'cap 1 holds at wave 9');
  const w2 = new World(new RNG(142));
  startWave(w2, 8);
  assert.equal(w2.gunships.count, 1, 'director start at wave 8 spawns a gunship');
});

test('gunship: enters from the rim to a mid-arena hold point', () => {
  const field = new GunshipField(new RNG(143));
  const g = field.spawn({ x: 0, y: 0 });
  assert.ok(g, 'spawned');
  assert.equal(g.state, 'enter', 'starts in enter');
  let reachedHold = false;
  for (let i = 0; i < 900 && field.count > 0; i++) {
    field.step(DT, { x: 0, y: 0 });
    if (g.state === 'hold') { reachedHold = true; break; }
  }
  assert.ok(reachedHold, 'reached the hold state');
  const hr = Math.hypot(g.holdPos.x, g.holdPos.y);
  assert.ok(hr >= CONFIG.gunship.holdRadiusMin * CONFIG.arena.radius - 1e-6, 'hold radius >= min');
  assert.ok(hr <= CONFIG.gunship.holdRadiusMax * CONFIG.arena.radius + 1e-6, 'hold radius <= max (mid-arena)');
  assert.ok(hr >= CONFIG.gunship.rimDist - 1e-6, 'hold point at least rimDist from the ship at origin');
});

test('gunship: 10 hits to kill; 9 are hit events, the 10th is lethal', () => {
  const field = new GunshipField(new RNG(144));
  const g = field.spawn({ x: 0, y: 0 });
  for (let i = 0; i < 9; i++) {
    const r = field.hit(g.id);
    assert.ok(r && !r.dead, 'survives hit ' + (i + 1));
  }
  assert.equal(g.hp, 1, '9 hits leave 1 hp');
  assert.equal(field.count, 1, 'still present after 9 hits');
  assert.equal(field.drainEvents().filter(e => e.kind === 'hit').length, 9, 'nine hit events');
  const r10 = field.hit(g.id);
  assert.ok(r10.dead, '10th hit is lethal');
  assert.equal(field.count, 0, 'compacted to 0');
  assert.equal(field.drainEvents().filter(e => e.kind === 'hit').length, 0, 'no hit event on the lethal blow');
});

test('gunship: world - 9 hits are flashes, the 10th pays +600 and feeds the combo', () => {
  const w = new World(new RNG(145));
  w.begin();
  w.ship.invuln = 1e9;
  w.spawnGunshipForWave(8);
  assert.equal(w.gunships.count, 1, 'spawned');
  const g = w.gunships.gunships[0];
  g.pos.x = 1; g.pos.y = 0;
  for (let i = 0; i < 9; i++) {
    w.weapons.bullets.push({ id: 9400 + i, pos: { x: 1, y: 0 }, radius: 2, dead: false });
    w.resolveBulletGunships();
  }
  const evs9 = w.drainEvents();
  assert.equal(w.gunships.count, 1, 'survives 9 hits');
  assert.equal(evs9.filter(e => e.type === 'gunshipHit').length, 9, 'nine gunshipHit FX events');
  assert.ok(!evs9.find(e => e.type === 'kill'), 'no kill yet');
  w.weapons.bullets.push({ id: 9499, pos: { x: 1, y: 0 }, radius: 2, dead: false });
  w.resolveBulletGunships();
  const evs = w.drainEvents();
  assert.equal(w.gunships.count, 0, 'destroyed on the 10th hit');
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'gunship', 'size gunship');
  assert.equal(kill.data.points, 600, '600 base points');
  assert.equal(kill.data.combo, 1, 'feeds the combo');
  assert.ok(evs.find(e => e.type === 'gunshipDeath'), 'gunshipDeath FX event');
});

test('gunship: self-destructs at maxAge (death event, self flag)', () => {
  const field = new GunshipField(new RNG(146));
  const g = field.spawn({ x: 0, y: 0 });
  g.age = CONFIG.gunship.maxAge - DT; // one step to expiry
  let self = null;
  for (let i = 0; i < 5 && field.count > 0; i++) {
    field.step(DT, { x: 0, y: 0 });
    for (const e of field.drainEvents()) if (e.kind === 'death' && e.self) self = e;
  }
  assert.ok(self, 'self-destruct death event emitted');
  assert.equal(self.self, true, 'self flag set');
  assert.equal(field.count, 0, 'compacted away');
});

test('gunship: arm -> fire emits a unit bolt aimed at the ship', () => {
  const field = new GunshipField(new RNG(147));
  const g = field.spawn({ x: 0, y: 0 });
  for (let i = 0; i < 900 && g.state === 'enter' && field.count > 0; i++) field.step(DT, { x: 20, y: 0 });
  assert.equal(g.state, 'hold', 'reached hold');
  field.drainEvents(); // clear any pending events from the drive
  g.armed = true;
  g.armT = CONFIG.gunship.armDur; // force the next step to fire
  const shipPos = { x: 20, y: 0 };
  field.step(DT, shipPos);
  const fire = field.drainEvents().find(e => e.kind === 'fire');
  assert.ok(fire, 'fire event emitted');
  const len = Math.hypot(fire.dir.x, fire.dir.y);
  assert.ok(Math.abs(len - 1) < 1e-9, 'fire dir is a unit vector');
  const want = Math.atan2(shipPos.y - g.pos.y, shipPos.x - g.pos.x);
  const got = Math.atan2(fire.dir.y, fire.dir.x);
  let da = Math.abs(want - got) % (2 * Math.PI);
  if (da > Math.PI) da = 2 * Math.PI - da;
  assert.ok(da < 1e-6, 'fire dir points at the ship');
});

test('gunship: destroy(id) force-kills (ship contact)', () => {
  const field = new GunshipField(new RNG(148));
  const g = field.spawn({ x: 0, y: 0 });
  assert.equal(field.count, 1);
  const d = field.destroy(g.id);
  assert.ok(d && d.dead, 'destroyed and marked dead');
  assert.equal(field.count, 0, 'compacted to 0');
});

test('gunship: world - contact costs a life, NO score', () => {
  const w = new World(new RNG(149));
  w.begin();
  w.ship.invuln = 0;
  const scoreBefore = w.score;
  w.spawnGunshipForWave(8);
  const g = w.gunships.gunships[0];
  g.pos.x = 0; g.pos.y = 0; // on top of the ship
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.gunships.count, 0, 'gunship destroyed on contact');
  assert.equal(w.lives, 2, 'life cost');
  assert.equal(w.score, scoreBefore, 'no score for contact');
  assert.ok(!evs.find(e => e.type === 'kill'), 'no kill event');
  const hit = evs.find(e => e.type === 'hit');
  assert.ok(hit, 'hit event');
  assert.equal(hit.data.lives, 2, 'hit event carries the life count');
});

test('gunship: world - first spawn of a run emits gunshipSpawn (toast), later spawns stay quiet', () => {
  const w = new World(new RNG(150));
  startWave(w, 8);
  const evs8 = w.drainEvents();
  assert.ok(evs8.find(e => e.type === 'gunshipSpawn'), 'first spawn emits gunshipSpawn');
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = 8;
  w.step(DT, NEUTRAL); // into wave 9 (cap 1: no new gunship)
  const evs9 = w.drainEvents();
  assert.equal(w.gunships.count, 1, 'cap 1: still one gunship');
  assert.ok(!evs9.find(e => e.type === 'gunshipSpawn'), 'no repeat callout in the same run');
});

test('gunship: determinism - same seed, same timeline (two field runs)', () => {
  const f1 = new GunshipField(new RNG(151));
  const f2 = new GunshipField(new RNG(151));
  f1.spawn({ x: 0, y: 0 });
  f2.spawn({ x: 0, y: 0 });
  const t1 = [], t2 = [];
  for (let i = 0; i < 2400; i++) {
    f1.step(DT, { x: 15, y: 0 });
    f2.step(DT, { x: 15, y: 0 });
    t1.push(f1.count + ':' + f1.gunships.map(g => g.pos.x.toFixed(6) + ',' + g.pos.y.toFixed(6) + ',' + g.state).join(';') + '#' + f1.drainEvents().map(e => e.kind).join(''));
    t2.push(f2.count + ':' + f2.gunships.map(g => g.pos.x.toFixed(6) + ',' + g.pos.y.toFixed(6) + ',' + g.state).join(';') + '#' + f2.drainEvents().map(e => e.kind).join(''));
  }
  assert.deepEqual(t1, t2, 'identical timelines');
  assert.ok(t1.some(x => x.includes('#fire')), 'timeline reaches a fire');
  assert.ok(t1.some(x => x.includes('#death')), 'timeline reaches the self-destruct');
});
