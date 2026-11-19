// ST-484 (E69): BULWARK - the shield enforcer (wave 17+). Hovers on a 8-10 u
// ring, yaw-slewing (0.5 rad/s) to face the ship. Its frontal shield arc
// (+/- 50 deg) NEGATES bullets: no damage, negations++ - the 6th negation
// overloads the shield (1.5 s stun); frontal damage only lands while stunned.
// Every 6.0 s one slow bolt (0.6 s charge cue; no dir on the event - game.js
// re-aims). Stun does not pause the cadence. 18 hits (+500). No RNG in step().
// Covers: config rungs, juice rungs, frontal negation, stunned frontal damage,
// side damage, the bolt cadence, the yaw slew cap, wave gates, the cap, world
// kill, contact, toast-once, determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { BulwarkField } from '../src/core/bulwark.js';
import { CONFIG } from '../src/core/config.js';
import { angDiff } from '../src/core/math.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const DT = 1 / 60;
const EPS = 1e-9;

test('bulwark: config sanity (gate 17, 18 hits the max, +500, 50 deg arc, 16 u/s cap)', () => {
  const s = CONFIG.bulwark;
  assert.equal(s.firstWave, 17, 'gate is wave 17');
  assert.equal(s.perWave, 1, 'one enforcer per wave');
  assert.equal(s.maxConcurrent, 1, 'cap one');
  const hp18 = s.hp;
  assert.equal(hp18, 18, '18 hits');
  const others = ['gunship', 'sentry', 'wasp', 'pod', 'warden', 'phantom', 'hauler']
    .map(k => CONFIG[k].hp); // drone/stinger/flyer/hunter are one-shot: no hp field
  assert.ok(others.every(h => h < hp18), '18 is the max hp in the roster');
  assert.equal(s.radius, 1.2, 'enforcer hitbox');
  assert.equal(s.score, 500, 'kill reward 500');
  assert.ok(CONFIG.warden.score < 500 && 500 < CONFIG.splicer.score, '400 warden < 500 < 600 splicer');
  assert.ok(Math.abs(s.shieldArc - 50 * Math.PI / 180) < 0.001, 'frontal arc is +/- 50 deg');
  assert.ok(s.boltSpeed <= 16, 'absolute dodgeability ceiling');
  assert.equal(s.shieldHitsToStun, 6, 'six negations overload');
  assert.equal(s.shieldStunDur, 1.5, '1.5 s stun');
  assert.equal(s.boltEvery, 6.0, '6.0 s bolt cadence');
});

test('bulwark: juice rungs (shake 0.8, killPunch 0.3, shockwave 3.4)', () => {
  assert.equal(CONFIG.fx.shakeTable.bulwarkDeath, 0.8, 'shake rung 0.8');
  assert.ok(0.75 < CONFIG.fx.shakeTable.bulwarkDeath && CONFIG.fx.shakeTable.bulwarkDeath < 0.85, '0.75 podDeath < 0.8 < 0.85 gunshipDeath');
  assert.equal(CONFIG.fx.killPunch.bulwark, 0.3, 'killPunch rung 0.3 (the max rung)');
  assert.equal(CONFIG.fx.killPunch.bulwark, CONFIG.fx.killPunch.gunship, '= the gunship rung');
  assert.equal(killPunchEnergy('bulwark', false, CONFIG.fx.killPunch), 0.3, 'unboosted bulwark punch');
  assert.equal(killPunchEnergy('bulwark', true, CONFIG.fx.killPunch), 0.3, 'overdrive 0.45 -> the 0.3 cap');
  assert.equal(CONFIG.fx.shockwave.classes.bulwark, 3.4, 'shockwave class 3.4');
  assert.ok(CONFIG.fx.shockwave.classes.bulwark < CONFIG.fx.shockwave.classes.gunship, '3.4 < 3.6 gunship');
});

test('bulwark: frontal bullets are negated; the 6th overloads the shield', () => {
  const f = new BulwarkField(new RNG(4866));
  const b = f.spawn({ x: 0, y: 0 });
  b.heading = 0;
  const bullet = { x: b.pos.x + 3, y: b.pos.y }; // dead ahead
  let ev = [];
  for (let i = 0; i < 5; i++) {
    const hpBefore = b.hp;
    f.hit(b.id, bullet);
    ev = ev.concat(f.drainEvents());
    assert.equal(b.hp, hpBefore, 'hit ' + (i + 1) + ': no damage through the shield');
  }
  assert.equal(b.negations, 5, 'five negations banked');
  assert.equal(ev.filter(e => e.kind === 'negate').length, 5, 'five negate cues');
  assert.equal(ev.filter(e => e.kind === 'hit').length, 0, 'no damage cues');
  f.hit(b.id, bullet); // the 6th
  ev = f.drainEvents();
  assert.equal(b.negations, 0, 'negations reset on overload');
  assert.ok(b.stunT > 0, 'the shield is stunned');
  assert.ok(ev.some(e => e.kind === 'stun'), 'stun cue fired');
  assert.equal(b.hp, 18, 'still unharmed');
});

test('bulwark: while stunned, frontal damage lands', () => {
  const f = new BulwarkField(new RNG(4867));
  const b = f.spawn({ x: 0, y: 0 });
  b.heading = 0;
  b.stunT = 1.0;
  f.hit(b.id, { x: b.pos.x + 3, y: b.pos.y });
  const ev = f.drainEvents();
  assert.equal(b.hp, 17, 'frontal damage while stunned');
  assert.ok(ev.some(e => e.kind === 'hit'), 'hit cue fired');
  assert.ok(!ev.some(e => e.kind === 'negate'), 'no negation');
});

test('bulwark: off-arc damage lands (no negation)', () => {
  const f = new BulwarkField(new RNG(4868));
  const b = f.spawn({ x: 0, y: 0 });
  b.heading = 0;
  f.hit(b.id, { x: b.pos.x, y: b.pos.y + 3 }); // off the nose
  const ev = f.drainEvents();
  assert.equal(b.hp, 17, 'side damage');
  assert.ok(ev.some(e => e.kind === 'hit'), 'hit cue fired');
  assert.equal(b.negations, 0, 'no negation banked');
});

test('bulwark: exactly one bolt at hover + 6.0 s, charge 0.6 s before, no dir on the event', () => {
  const s = CONFIG.bulwark;
  const f = new BulwarkField(new RNG(4869));
  const ship = { x: 0, y: 0 };
  const b = f.spawn(ship);
  let hoverT = null;
  const fires = [];
  const charges = [];
  let t = 0;
  for (let i = 0; i < 600; i++) {
    t += DT;
    f.step(DT, ship);
    if (hoverT === null && b.state === 'hover') hoverT = t;
    for (const e of f.drainEvents()) {
      if (e.kind === 'fire') fires.push({ t, pos: { x: e.pos.x, y: e.pos.y } });
      if (e.kind === 'charge') charges.push(t);
    }
  }
  assert.ok(hoverT !== null, 'reached the hover');
  assert.equal(fires.length, 1, 'exactly one bolt in 10 s');
  assert.ok(Math.abs(fires[0].t - (hoverT + s.boltEvery)) <= 2 * DT, 'bolt at hover + 6.0 s');
  assert.ok(!('dir' in fires[0]), 'the fire event carries no dir (game.js re-aims)');
  assert.equal(charges.length, 1, 'one charge cue');
  assert.ok(Math.abs(charges[0] - (fires[0].t - s.boltTelegraph)) <= 2 * DT, 'charge 0.6 s before the bolt');
});

test('bulwark: the yaw slew never exceeds 0.5 rad/s', () => {
  const f = new BulwarkField(new RNG(4870));
  const ship = { x: 0, y: 0 };
  const b = f.spawn(ship);
  b.state = 'hover';
  b.pos = { x: -9, y: 0 };
  b.holdR = 9;
  b.orbitR = 9;
  b.orbitA = Math.PI;
  b.heading = Math.PI / 2; // 90 deg off the ship
  let prev = b.heading;
  for (let i = 0; i < 60; i++) {
    f.step(DT, ship);
    const d = Math.abs(angDiff(prev, b.heading));
    assert.ok(d / DT <= CONFIG.bulwark.yawRate + 1e-9, 'frame ' + i + ' slew within the yaw cap');
    prev = b.heading;
  }
});

test('bulwark: wave gates (none W16, one W17, none on boss W20)', () => {
  const w = new World(new RNG(4871));
  w.begin();
  w.spawnBulwarkForWave(16);
  assert.equal(w.bulwarks.count, 0, 'no bulwark at wave 16');
  w.spawnBulwarkForWave(17);
  assert.equal(w.bulwarks.count, 1, 'one enforcer at wave 17');
  w.bulwarks.clear();
  w.spawnBulwarkForWave(20);
  assert.equal(w.bulwarks.count, 0, 'boss wave 20 excluded');
});

test('bulwark: the cap defers the second enforcer', () => {
  const f = new BulwarkField(new RNG(4872));
  assert.ok(f.spawn(null) !== null, 'first');
  assert.equal(f.spawn(null), null, 'second deferred at the cap of 1');
  assert.equal(f.count, 1, 'nothing extra spawned');
});

test('bulwark: world kill pays +500, feeds the combo, emits bulwarkDeath', () => {
  const w = new World(new RNG(4873));
  w.begin();
  w.spawnBulwarkForWave(17);
  const target = w.bulwarks.bulwarks[0];
  target.pos.x = 5; target.pos.y = 0;
  target.heading = 0; // facing +x: the bullets at (4, 0) hit its rear
  for (let i = 0; i < 18; i++) w.weapons.bullets.push({ id: 9900 + i, pos: { x: 4, y: 0 }, radius: 2, dead: false }); // hp 18
  w.resolveBulletBulwarks();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'bulwark', 'kill class bulwark');
  assert.equal(kills[0].data.points, 500, '+500');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'bulwarkHit'), 'rear hits register');
  assert.ok(ev.some(e => e.type === 'bulwarkDeath' && e.data.self === false), 'bulwarkDeath (bullet kill)');
  assert.equal(w.bulwarks.count, 0, 'enforcer gone');
});

test('bulwark: contact costs a life, no score, enforcer destroyed', () => {
  const w = new World(new RNG(4874));
  w.begin();
  w.spawnBulwarkForWave(17);
  const target = w.bulwarks.bulwarks[0];
  target.pos.x = 0; target.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipBulwarks();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'bulwarkDeath' && e.data.self === false), 'bulwarkDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.bulwarks.count, 0, 'enforcer destroyed');
});

test('bulwark: first spawn toasts once, later waves stay quiet', () => {
  const w = new World(new RNG(4875));
  w.begin();
  w.spawnBulwarkForWave(17);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'bulwarkSpawn'), 'first enforcer toasts');
  w.bulwarks.clear(); // make room so the next wave is not just a silent deferral
  w.spawnBulwarkForWave(18);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'bulwarkSpawn'), 'second enforcer is quiet');
});

test('bulwark: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const shipAt = (t) => ({ x: 4 * Math.cos(0.6 * t), y: 4 * Math.sin(0.9 * t) });
  const run = (seed) => {
    const f = new BulwarkField(new RNG(seed));
    let t = 0;
    f.spawn(shipAt(0));
    const out = [];
    for (let i = 0; i < 1800; i++) {
      t += DT;
      f.step(DT, shipAt(t));
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f.count)]);
    }
    return out;
  };
  const a = run(4876);
  const b = run(4876);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
