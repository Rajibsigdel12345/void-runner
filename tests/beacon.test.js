// ST-518 (E75): BEACON - the signal island (wave 19+). Mid-arena spawn 6-10 u
// from the ship, stationary: enter 1.0 s -> idle 0.8 s -> charge 1.5 s (the
// lamp brightens - the telegraph) -> release (2 drones rim-spawned via the
// drone field; a full field drops silently) -> idle; spent after 3 releases
// (+750, the new top non-boss rung; 8 hits). No RNG in step().
// Covers: config rungs, juice rungs, the full charge/release cycle (exact
// event order + dead-aim bearings), charge timing, the cap, the maxAge hard
// cap, world kill, contact, wave gates, toast-once, determinism, and the
// World-level silent drop with a full drone field.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { BeaconField } from '../src/core/beacon.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const DT = 1 / 60;
const EPS = 1e-9;

test('beacon: config sanity (gate 19, 8 hits, +750 top non-boss rung, stationary)', () => {
  const s = CONFIG.beacon;
  assert.equal(s.firstWave, 19, 'gate is wave 19');
  assert.equal(s.perWave, 1, 'one beacon per wave');
  assert.equal(s.maxConcurrent, 1, 'cap one');
  assert.equal(s.hp, 8, 'eight hits (the sturdiest non-boss)');
  assert.equal(s.radius, 1.4, 'island hitbox');
  assert.equal(s.score, 750, 'kill reward 750');
  assert.ok(s.score > CONFIG.gunship.score, '750 > 600 (above the gunship rung)');
  assert.ok(s.score < CONFIG.boss.score, '750 < 1000 (below the monolith rung)');
  assert.equal(s.speed, 0, 'stationary by shape');
  assert.equal(s.spawnOffMin, 6, 'mid-arena offset min');
  assert.equal(s.spawnOffMax, 10, 'mid-arena offset max');
  assert.equal(s.releaseCap, 3, 'three releases then spent');
  assert.equal(s.escortCount, 2, 'two drones per release');
  assert.ok(s.chargeTime > s.idleTime, 'the telegraph outlasts the idle tick');
  assert.ok(s.enterDur > 0 && s.maxAge > 0, 'tunables sane');
  assert.equal(19 % CONFIG.boss.everyWave, 4, 'the gate is not a boss wave');
});

test('beacon: juice rungs (shake 0.9, flash 0.4, killPunch 0.3 max, shockwave 3.6)', () => {
  assert.equal(CONFIG.fx.shakeTable.beaconDeath, 0.9, 'shake rung 0.9');
  assert.ok(0.85 < CONFIG.fx.shakeTable.beaconDeath && CONFIG.fx.shakeTable.beaconDeath < 1.0, '0.85 gunship < 0.9 < 1.0 boss');
  assert.equal(CONFIG.fx.flashTable.beaconDeath, 0.4, 'flash rung 0.4 (shared warden/gunship/pod rung)');
  assert.equal(CONFIG.fx.killPunch.beacon, 0.3, 'killPunch rung 0.3 (the max)');
  assert.ok(killPunchEnergy('beacon', false, CONFIG.fx.killPunch) <= 0.3 + EPS, 'unboosted punch at the cap');
  assert.ok(killPunchEnergy('beacon', true, CONFIG.fx.killPunch) <= 0.3 + EPS, 'overdrive cannot exceed the 0.3 cap');
  assert.equal(CONFIG.fx.shockwave.classes.beacon, 3.6, 'shockwave class 3.6');
  assert.ok(3.0 < CONFIG.fx.shockwave.classes.beacon && CONFIG.fx.shockwave.classes.beacon <= 3.6, 'above the pod rung, at the gunship rung');
});

test('beacon: the cycle is charge -> release x3 -> spent, exact order, dead-aim bearings (seed 5193)', () => {
  const f = new BeaconField(new RNG(5193));
  const ship = { x: 2, y: -1 };
  const p = f.spawn(ship);
  const kinds = [];
  let i = 0;
  for (; i < 2000 && !p.dead; i++) {
    f.step(DT, ship);
    for (const e of f.drainEvents()) kinds.push(e.kind);
  }
  assert.ok(i < 2000, 'spent well inside the window (~9 s max)');
  assert.ok(p.dead, 'the beacon is spent');
  assert.equal(f.count, 0, 'field empty');
  assert.equal(p.releases, 3, 'three releases');
  assert.deepEqual(kinds, ['charge', 'release', 'charge', 'release', 'charge', 'release', 'death'], 'exact cycle order');
  // The beacon never moves: every release dead-aims the (stationary) ship.
  const f2 = new BeaconField(new RNG(5193));
  const p2 = f2.spawn(ship);
  const home = { x: p2.pos.x, y: p2.pos.y };
  i = 0;
  let releases = 0;
  while (i < 2000 && releases < 3) {
    i++;
    f2.step(DT, ship);
    for (const e of f2.drainEvents()) {
      if (e.kind === 'release') {
        releases++;
        assert.ok(Math.abs(p2.pos.x - home.x) < EPS && Math.abs(p2.pos.y - home.y) < EPS, 'the beacon never moves');
        const want = Math.atan2(ship.y - p2.pos.y, ship.x - p2.pos.x);
        const d = Math.atan2(Math.sin(e.bearing - want), Math.cos(e.bearing - want));
        assert.ok(Math.abs(d) < EPS, 'release bearing dead-aims the ship');
      }
    }
  }
  assert.equal(releases, 3, 'all three releases observed');
});

test('beacon: charge -> release gap is exactly chargeTime (seed 5194)', () => {
  const f = new BeaconField(new RNG(5194));
  const ship = { x: 0, y: 0 };
  const p = f.spawn(ship);
  let chargeT = -1, releaseT = -1;
  let i = 0;
  for (; i < 600; i++) {
    f.step(DT, ship);
    const t = (i + 1) * DT;
    for (const e of f.drainEvents()) {
      if (e.kind === 'charge' && chargeT < 0) chargeT = t;
      if (e.kind === 'release' && releaseT < 0) releaseT = t;
    }
    if (releaseT >= 0) break;
  }
  assert.ok(chargeT >= 0 && releaseT >= 0, 'both cues fired');
  assert.ok(Math.abs((releaseT - chargeT) - CONFIG.beacon.chargeTime) <= DT, 'gap = chargeTime (+/- 1 frame): ' + (releaseT - chargeT));
});

test('beacon: the cap defers a second island (seed 5195)', () => {
  const f = new BeaconField(new RNG(5195));
  assert.ok(f.spawn(null) !== null, 'first');
  assert.equal(f.spawn(null), null, 'second deferred at the cap of 1');
  assert.equal(f.count, 1, 'nothing extra spawned');
});

test('beacon: the maxAge hard cap self-expires (releaseCap lifted, seed 5196)', () => {
  const cfg = { beacon: Object.assign({}, CONFIG.beacon, { releaseCap: 99 }) };
  const f = new BeaconField(new RNG(5196), cfg);
  const p = f.spawn(null);
  const frames = Math.ceil(CONFIG.beacon.maxAge / DT) + 60;
  for (let i = 0; i < frames; i++) f.step(DT, { x: 0, y: 0 });
  assert.ok(p.dead, 'hard cap expired');
  assert.ok(p.releases < cfg.beacon.releaseCap, 'never hit the release cap - the age cap killed it');
  assert.equal(f.count, 0, 'field empty');
  const evs = f.drainEvents();
  assert.ok(evs.some(e => e.kind === 'death' && e.self === true), 'self death event');
});

test('beacon: world kill pays +750, feeds the combo, emits beaconDeath (seed 5197)', () => {
  const w = new World(new RNG(5197));
  w.begin();
  w.spawnBeaconForWave(19);
  const target = w.beacons.beacons[0];
  target.pos.x = 5; target.pos.y = 0;
  for (let k = 0; k < 8; k++) w.weapons.bullets.push({ id: 9900 + k, pos: { x: 5, y: 0 }, radius: 2, dead: false }); // hp 8
  w.resolveBulletBeacons();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'beacon', 'kill class beacon');
  assert.equal(kills[0].data.points, 750, '+750');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'beaconHit'), 'non-lethal beaconHit fired');
  assert.ok(ev.some(e => e.type === 'beaconDeath' && e.data.self === false), 'beaconDeath (bullet kill)');
  assert.equal(w.beacons.count, 0, 'island gone');
});

test('beacon: contact costs a life (no score, seed 5198)', () => {
  const w = new World(new RNG(5198));
  w.begin();
  w.spawnBeaconForWave(19);
  const target = w.beacons.beacons[0];
  target.pos.x = 0; target.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipBeacons();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'beaconDeath' && e.data.self === false), 'beaconDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.beacons.count, 0, 'beacon destroyed');
});

test('beacon: wave gates (none W18, one W19, none on boss W20, seed 5199)', () => {
  const w = new World(new RNG(5199));
  w.begin();
  w.spawnBeaconForWave(18);
  assert.equal(w.beacons.count, 0, 'no beacons at wave 18');
  w.spawnBeaconForWave(19);
  assert.equal(w.beacons.count, 1, 'one at wave 19');
  w.beacons.clear();
  w.spawnBeaconForWave(20);
  assert.equal(w.beacons.count, 0, 'boss wave 20 excluded');
});

test('beacon: first spawn toasts once, later waves stay quiet (seed 5200)', () => {
  const w = new World(new RNG(5200));
  w.begin();
  w.spawnBeaconForWave(19);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'beaconSpawn'), 'first beacon toasts');
  w.beacons.clear(); // make room so the next wave is not just a silent deferral
  w.spawnBeaconForWave(21);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'beaconSpawn'), 'later beacon is quiet');
});

test('beacon: field is deterministic (same seed + inputs -> identical event stream, seed 5201)', () => {
  const shipAt = (t) => ({ x: 3 * Math.cos(0.4 * t), y: 3 * Math.sin(0.7 * t) });
  const run = (seed) => {
    const f = new BeaconField(new RNG(seed));
    let t = 0;
    f.spawn(shipAt(0));
    const out = [];
    for (let i = 0; i < 600; i++) {
      t += DT;
      f.step(DT, shipAt(t));
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), e.bearing !== undefined ? e.bearing.toFixed(4) : '', String(f.count)]);
    }
    return out;
  };
  const a = run(5201);
  const b = run(5201);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});

test('beacon: a release into a full drone field drops silently at World level (seed 5202)', () => {
  const w = new World(new RNG(5202));
  w.begin();
  w.spawnBeaconForWave(19);
  const p = w.beacons.beacons[0];
  // Fill the shared drone field to its cap with real rim spawns.
  let guard = 0;
  while (w.drones.spawn(w.ship.pos) !== null && guard++ < 50) {}
  assert.equal(w.drones.count, w.cfg.drone.maxConcurrent, 'drone field full');
  w.ship.invuln = 999; // raw countdown (isInvulnerable is getter-only) - no contact side-effects
  let sawCharge = false;
  let i = 0;
  for (; i < 900 && !p.dead; i++) {
    w.step(DT);
    if (p.state === 'charge') sawCharge = true;
  }
  assert.ok(sawCharge, 'the beacon actually reached the charge');
  assert.equal(p.releases, 3, 'all three releases happened (dropped, not lost)');
  const ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'beaconRelease'), 'no beaconRelease (the escorts dropped silently)');
  assert.equal(w.drones.count, w.cfg.drone.maxConcurrent, 'drone field still capped');
});
