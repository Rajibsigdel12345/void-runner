// ST-448 (E63): WASP - a popcorn dasher (wave 12+). Spawns as an atomic V-pack of 3 at
// the rim; each corkscrews at the ship for 1.0-1.2 s (the F2 anticipation floor) then
// DASHES at the ship's position as predicted at dash start (15.5 u/s = 1.107x the ship's
// 14 - under the 1.15x F2 cap; the 7.75 u dash stays dodgeable against the 21 u of ship
// evasion over 1.5 s). One shot to kill (+100). Contact costs a life, no score.
// Covers: config rungs, juice rungs, wave gates, the V-pack geometry, the non-split cap
// (split children excluded), the render-pool audit (6 + 4 = 10), rim-clamped spawnAt,
// the anticipation floor + dash aim, world kill, contact, determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { WaspField } from '../src/core/wasp.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;
const EPS = 1e-9;

test('wasp: config sanity', () => {
  const s = CONFIG.wasp;
  assert.equal(s.firstWave, 12, 'gate is wave 12');
  assert.equal(s.perWave, 3, 'a V-pack of 3 per wave');
  assert.equal(s.maxConcurrent, 6, 'cap six non-split wasps');
  assert.equal(s.hp, 1, 'one shot to kill');
  assert.equal(s.radius, 0.45, 'small hitbox');
  assert.equal(s.dashSpeed, 15.5, 'dash 15.5 u/s');
  assert.ok(s.dashSpeed < 16, 'absolute dodgeability ceiling');
  assert.ok(s.dashSpeed <= 1.15 * CONFIG.ship.maxSpeed + EPS, 'under the 1.15x ship F2 cap');
  assert.equal(s.corkscrewDurMin, 1.0, 'anticipation floor 1.0 s');
  assert.ok(s.corkscrewDurMin < s.corkscrewDurMax, 'corkscrew band sane');
  assert.equal(s.packSpread, 0.22, 'V-pack bearing offset');
  assert.equal(s.rimDist, 15, 'rim spawn 15 u from the ship');
  assert.equal(s.score, 100, 'kill reward 100');
  assert.ok(s.score < CONFIG.hunter.score, '100 < 300 (below the stalker rung)');
});

test('wasp: juice rungs (shake 0.3, killPunch 0.10, shockwave 1.4)', () => {
  assert.equal(CONFIG.fx.shakeTable.waspDeath, 0.3, 'shake rung 0.3');
  assert.ok(0.3 < CONFIG.fx.shakeTable.droneExplode, '0.3 < 0.35 (lightest dasher shake)');
  assert.equal(CONFIG.fx.killPunch.wasp, 0.10, 'killPunch rung 0.10');
  assert.ok(CONFIG.fx.killPunch.s < 0.10 && 0.10 < CONFIG.fx.killPunch.m, '0.08 < 0.10 < 0.12 ordering');
  assert.equal(killPunchEnergy('wasp', false, CONFIG.fx.killPunch), 0.10, 'unboosted wasp punch');
  assert.ok(Math.abs(killPunchEnergy('wasp', true, CONFIG.fx.killPunch) - 0.15) < 1e-12, 'overdrive x1.5 ~ 0.15 (under the 0.3 cap)');
  assert.equal(CONFIG.fx.shockwave.classes.wasp, 1.4, 'shockwave class 1.4');
  assert.ok(1.4 < CONFIG.fx.shockwave.classes.S, 'smallest ring rung (1.4 < 1.6)');
});

test('wasp: the dash is dodgeable (7.75 u dash < 21 u of ship evasion over 1.5 s)', () => {
  const s = CONFIG.wasp;
  const dashDistance = s.dashSpeed * s.dashDur;
  const shipEvasion = CONFIG.ship.maxSpeed * 1.5;
  assert.ok(dashDistance < shipEvasion, dashDistance + ' < ' + shipEvasion);
});

test('wasp: corkscrew duration stays in the 1.0-1.2 s band across seeds 1..64', () => {
  for (let seed = 1; seed <= 64; seed++) {
    const f = new WaspField(new RNG(seed));
    const pack = f.spawn(null);
    for (const w of pack) {
      assert.ok(w.corkscrewDur >= CONFIG.wasp.corkscrewDurMin - EPS, 'seed ' + seed + ' lower bound');
      assert.ok(w.corkscrewDur <= CONFIG.wasp.corkscrewDurMax + EPS, 'seed ' + seed + ' upper bound');
    }
  }
});

test('wasp: the V-pack is atomic (3 wasps, same radius, bearings within +/-packSpread)', () => {
  const f = new WaspField(new RNG(4821));
  const pack = f.spawn(null);
  assert.equal(pack.length, 3, 'a pack of three');
  assert.equal(f.count, 3, 'all three are live');
  const s = CONFIG.wasp;
  for (const w of pack) {
    assert.equal(w.radius, s.radius, 'same hitbox');
    assert.equal(w.splitChild, false, 'pack members are not split children');
    assert.ok(w.t === 0 && w.state === 'corkscrew', 'pack members start corkscrewing at t=0');
  }
  const mid = Math.atan2(pack[1].pos.y, pack[1].pos.x);
  for (const w of pack) {
    let d = Math.abs(Math.atan2(w.pos.y, w.pos.x) - mid);
    if (d > Math.PI) d = 2 * Math.PI - d;
    assert.ok(d <= s.packSpread + 1e-9, 'bearing within the pack spread');
  }
});

test('wasp: wave gates (none W11, a pack W12, none on boss W15)', () => {
  const w = new World(new RNG(4822));
  w.begin();
  w.spawnWaspForWave(11);
  assert.equal(w.wasps.count, 0, 'no wasps at wave 11');
  w.spawnWaspForWave(12);
  assert.equal(w.wasps.count, 3, 'a V-pack at wave 12');
  w.spawnWaspForWave(15);
  assert.equal(w.wasps.count, 3, 'boss wave 15 excluded');
});

test('wasp: the non-split cap defers whole packs (5 live -> pack deferred)', () => {
  const f = new WaspField(new RNG(4823));
  for (let i = 0; i < 5; i++) f.spawnAt({ x: 5, y: 5 }, false); // ungated, non-split
  assert.equal(f.nonSplitCount(), 5, 'five non-split wasps live');
  assert.equal(f.spawn(null), null, 'a sixth pack would overflow the cap of 6 - deferred');
  assert.equal(f.count, 5, 'nothing spawned');
});

test('wasp: render pool audit (6 non-split + 4 split children = 10, then deferral)', () => {
  const f = new WaspField(new RNG(4824));
  assert.ok(f.spawn(null) !== null, 'pack 1');
  assert.ok(f.spawn(null) !== null, 'pack 2 (cap of 6 reached)');
  assert.equal(f.spawn(null), null, 'pack 3 deferred at the cap');
  for (let i = 0; i < 4; i++) f.spawnAt({ x: -5, y: -5 }, true); // split children are ungated
  assert.equal(f.count, 10, '6 non-split + 4 split children = the pool of 10');
  assert.equal(f.nonSplitCount(), 6, 'the cap still counts only non-split');
  assert.equal(f.spawn(null), null, 'still deferred for pack members');
});

test('wasp: spawnAt is rim-clamped to the arena', () => {
  const f = new WaspField(new RNG(4825));
  const w = f.spawnAt({ x: 50, y: 0 }, false); // far outside (arena radius 26)
  const r = CONFIG.arena.radius - CONFIG.wasp.radius;
  const d = Math.hypot(w.pos.x, w.pos.y);
  assert.ok(d <= r + 1e-9, 'clamped inside the rim');
  assert.ok(Math.abs(d - r) < 1e-9, 'clamped exactly to the rim');
});

test('wasp: the first dash never starts before 1.0 s and aims at the ship', () => {
  for (const seed of [1, 2, 3]) {
    const f = new WaspField(new RNG(seed));
    const ship = { x: 0, y: 0 };
    f.spawnAt({ x: 10, y: 0 }, false);
    let t = 0;
    let dash = null;
    for (let i = 0; i < 600 && dash === null; i++) {
      t += DT;
      f.step(DT, ship);
      for (const e of f.drainEvents()) if (e.kind === 'dash') dash = { t, pos: { x: e.pos.x, y: e.pos.y } };
    }
    assert.ok(dash !== null, 'seed ' + seed + ' dashed');
    assert.ok(dash.t >= CONFIG.wasp.corkscrewDurMin - 1e-9, 'seed ' + seed + ' anticipation floor honored (' + dash.t.toFixed(4) + ' s)');
    const w = f.wasps[0];
    const want = Math.atan2(ship.y - dash.pos.y, ship.x - dash.pos.x);
    const got = Math.atan2(w.vel.y, w.vel.x);
    let d = Math.abs(got - want);
    if (d > Math.PI) d = 2 * Math.PI - d;
    assert.ok(d < 0.05, 'seed ' + seed + ' dash aims at the ship');
    assert.ok(Math.hypot(w.vel.x, w.vel.y) === CONFIG.wasp.dashSpeed || Math.abs(Math.hypot(w.vel.x, w.vel.y) - CONFIG.wasp.dashSpeed) < 1e-9, 'dash speed exact');
  }
});

test('wasp: world kill pays +100, feeds the combo, emits waspDeath', () => {
  const w = new World(new RNG(4826));
  w.begin();
  w.spawnWaspForWave(12);
  const target = w.wasps.wasps[0];
  target.pos.x = 5; target.pos.y = 0;
  w.weapons.bullets.push({ id: 9600, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  w.resolveBulletWasps();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'wasp', 'kill class wasp');
  assert.equal(kills[0].data.points, 100, '+100');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'waspDeath' && e.data.self === false), 'waspDeath (bullet kill)');
  assert.equal(w.wasps.count, 2, 'pack survivors keep running');
});

test('wasp: contact costs a life, no score, wasp destroyed', () => {
  const w = new World(new RNG(4827));
  w.begin();
  w.spawnWaspForWave(12);
  const target = w.wasps.wasps[0];
  target.pos.x = 0; target.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipWasps();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'waspDeath' && e.data.self === false), 'waspDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.wasps.count, 2, 'contact wasp destroyed, the rest survive');
});

test('wasp: split children are ungated, start at t=0, and count against the pool only', () => {
  const f = new WaspField(new RNG(4828));
  f.spawn(null);
  f.spawn(null); // 6 non-split = cap
  const child = f.spawnAt({ x: 20, y: 0 }, true); // ungated even at the cap
  assert.ok(child !== null, 'split child spawns at the cap');
  assert.equal(child.splitChild, true, 'flagged as a split child');
  assert.equal(child.t, 0, 'starts its own corkscrew clock at 0');
  assert.equal(f.nonSplitCount(), 6, 'the cap counts non-split only');
});

test('wasp: first spawn toasts once, later packs stay quiet', () => {
  const w = new World(new RNG(4829));
  w.begin();
  w.spawnWaspForWave(12);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'waspSpawn'), 'first pack toasts');
  w.wasps.clear(); // make room so the next wave is not just a silent deferral
  w.spawnWaspForWave(13);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'waspSpawn'), 'second pack is quiet');
});

test('wasp: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const shipAt = (t) => ({ x: 4 * Math.cos(0.6 * t), y: 4 * Math.sin(0.9 * t) });
  const run = (seed) => {
    const f = new WaspField(new RNG(seed));
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
  const a = run(4830);
  const b = run(4830);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
