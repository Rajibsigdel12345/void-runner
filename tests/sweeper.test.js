// ST-518 (E75): SWEEPER - the arc triangle (wave 18+). Rim spawn, homes to a
// 12-u hover ring, then sweeps a 120-degree arc at 0.9 rad/s firing a FAN of
// 4 bolts every 0.6 s (0.4-rad sub-arc centered on the CURRENT facing) with a
// 0.7 s reaim between arcs. 3 hits (+225, between the drone and stinger
// rungs); fan bolts 8 u/s under the 1.15x F2 cap. No RNG in step().
// Covers: config rungs, juice rungs, the state walk, the fan geometry (3
// seeds), the cap, self-expiry, world kill, contact, wave gates, toast-once,
// determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { SweeperField } from '../src/core/sweeper.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const DT = 1 / 60;
const EPS = 1e-9;

test('sweeper: config sanity (gate 18, 3 hits, +225 rung, the 120-degree arc, F2 bolt cap)', () => {
  const s = CONFIG.sweeper;
  assert.equal(s.firstWave, 18, 'gate is wave 18');
  assert.equal(s.perWave, 1, 'one sweeper per wave');
  assert.equal(s.maxConcurrent, 2, 'cap two');
  assert.equal(s.hp, 3, 'three hits');
  assert.equal(s.radius, 0.9, 'arc hitbox');
  assert.equal(s.score, 225, 'kill reward 225');
  assert.ok(s.score > CONFIG.drone.score, '225 > 200 (above the drone rung)');
  assert.ok(s.score < CONFIG.stinger.score, '225 < 250 (below the stinger rung)');
  assert.ok(Math.abs(s.arcSpan - (2 * Math.PI / 3)) < 0.001, 'the sweep arc is 120 degrees');
  assert.ok(s.boltSpeed < 16, 'absolute dodgeability ceiling');
  assert.ok(s.boltSpeed <= 1.15 * CONFIG.ship.maxSpeed + EPS, 'under the 1.15x ship F2 cap');
  assert.equal(s.fanBolts, 4, 'fan of 4 bolts');
  assert.ok(s.fanSubArc < s.arcSpan, 'the fan is a slice of the sweep arc');
  assert.equal(18 % CONFIG.boss.everyWave, 3, 'the gate is not a boss wave');
  assert.ok(s.hoverDist > 0 && s.cadence > 0 && s.reaimDur > 0 && s.enterDur > 0, 'tunables sane');
});

test('sweeper: juice rungs (shake 0.45, killPunch 0.19, shockwave 2.2, no flash entry)', () => {
  assert.equal(CONFIG.fx.shakeTable.sweeperDeath, 0.45, 'shake rung 0.45');
  assert.ok(0.4 < CONFIG.fx.shakeTable.sweeperDeath && CONFIG.fx.shakeTable.sweeperDeath < 0.55, '0.4 mine < 0.45 < 0.55 hunter');
  assert.equal(CONFIG.fx.killPunch.sweeper, 0.19, 'killPunch rung 0.19');
  assert.ok(0.18 < CONFIG.fx.killPunch.sweeper && CONFIG.fx.killPunch.sweeper < 0.2, '0.18 l < 0.19 < 0.2 stinger');
  assert.equal(killPunchEnergy('sweeper', false, CONFIG.fx.killPunch), 0.19, 'unboosted sweeper punch');
  assert.ok(Math.abs(killPunchEnergy('sweeper', true, CONFIG.fx.killPunch) - 0.285) < 1e-12, 'overdrive x1.5 = 0.285 (under the 0.3 cap)');
  assert.equal(CONFIG.fx.shockwave.classes.sweeper, 2.2, 'shockwave class 2.2');
  assert.ok(2.0 < CONFIG.fx.shockwave.classes.sweeper && CONFIG.fx.shockwave.classes.sweeper <= 2.4, 'stinger 2.0 < 2.2 <= M-rock 2.4');
  assert.ok(!('sweeperDeath' in CONFIG.fx.flashTable), 'no flashTable entry (sentry/wasp/phantom/hauler/bulwark precedent)');
});

test('sweeper: the state machine walks enter -> approach -> sweep -> reaim -> sweep (seed 5181)', () => {
  const f = new SweeperField(new RNG(5181));
  const ship = { x: 0, y: 0 };
  const p = f.spawn(ship);
  assert.equal(p.state, 'enter', 'materialize window first');
  const seen = [];
  let prev = p.state;
  for (let i = 0; i < 900 && seen.length < 4; i++) {
    f.step(DT, ship);
    if (p.state !== prev) { seen.push(p.state); prev = p.state; }
  }
  assert.deepEqual(seen, ['approach', 'sweep', 'reaim', 'sweep'], 'full walk order');
});

test('sweeper: the sweep fires fans of 4 bolts over the sub-arc, centered on the facing (seeds 5182-5184)', () => {
  const s = CONFIG.sweeper;
  const gap = s.fanSubArc / (s.fanBolts - 1);
  for (const seed of [5182, 5183, 5184]) {
    const f = new SweeperField(new RNG(seed));
    const ship = { x: 0, y: 0 };
    const p = f.spawn(ship);
    const fans = [];
    for (let i = 0; i < 900 && fans.length < 3; i++) {
      const wasSweep = p.state === 'sweep';
      f.step(DT, ship);
      const fires = f.drainEvents().filter(e => e.kind === 'fire');
      if (fires.length === 0) continue;
      assert.equal(fires.length, 4, 'seed ' + seed + ' a step fires the full fan (one fan per step)');
      const a0 = Math.atan2(fires[0].dir.y, fires[0].dir.x);
      const a3 = Math.atan2(fires[3].dir.y, fires[3].dir.x);
      const rel3 = Math.atan2(Math.sin(a3 - a0), Math.cos(a3 - a0));
      fans.push({
        step: i + 1,
        pos: { x: fires[0].pos.x, y: fires[0].pos.y },
        dirs: fires.map(e => ({ x: e.dir.x, y: e.dir.y })),
        facingAfter: p.facing,
        endedSweep: wasSweep && p.state !== 'sweep', // sweep ended on this step (facing was reset)
        center: a0 + rel3 / 2,
      });
      for (const e of fires) {
        assert.ok(Math.abs(e.pos.x - fans[fans.length - 1].pos.x) < EPS && Math.abs(e.pos.y - fans[fans.length - 1].pos.y) < EPS, 'seed ' + seed + ' the fan bolts share the emitter');
      }
    }
    assert.equal(fans.length, 3, 'seed ' + seed + ' three fans in the window');
    for (const fan of fans) {
      for (const d of fan.dirs) assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-9, 'seed ' + seed + ' fan bolt dir is unit');
      const rel = fan.dirs.map(d => {
        const a = Math.atan2(d.y, d.x);
        return Math.atan2(Math.sin(a - Math.atan2(fan.dirs[0].y, fan.dirs[0].x)), Math.cos(a - Math.atan2(fan.dirs[0].y, fan.dirs[0].x)));
      });
      for (let k = 1; k < 4; k++) {
        assert.ok(Math.abs((rel[k] - rel[k - 1]) - gap) < EPS, 'seed ' + seed + ' consecutive bolts gap exactly the sub-arc gap');
      }
      if (!fan.endedSweep) {
        const dC = Math.atan2(Math.sin(fan.facingAfter - fan.center), Math.cos(fan.facingAfter - fan.center));
        assert.ok(Math.abs(dC) <= s.fanSubArc / 2 + 1e-6, 'seed ' + seed + ' the fan is centered on the current facing');
      }
    }
    for (let k = 1; k < fans.length; k++) {
      const dSteps = fans[k].step - fans[k - 1].step;
      assert.ok(Math.abs(dSteps * DT - s.cadence) <= DT, 'seed ' + seed + ' fan cadence ' + s.cadence + ' s (+/- 1 frame)');
    }
  }
});

test('sweeper: the cap defers the third arc triangle (seed 5185)', () => {
  const f = new SweeperField(new RNG(5185));
  assert.ok(f.spawn(null) !== null, 'first');
  assert.ok(f.spawn(null) !== null, 'second');
  assert.equal(f.spawn(null), null, 'third deferred at the cap of 2');
  assert.equal(f.count, 2, 'nothing extra spawned');
});

test('sweeper: self-expiry after maxAge (death self:true, field empty, seed 5186)', () => {
  const f = new SweeperField(new RNG(5186));
  const p = f.spawn(null);
  const frames = Math.ceil(CONFIG.sweeper.maxAge / DT) + 60;
  for (let i = 0; i < frames; i++) f.step(DT, { x: 0, y: 0 });
  assert.ok(p.dead, 'expired');
  assert.equal(f.count, 0, 'field empty');
  const evs = f.drainEvents();
  assert.ok(evs.some(e => e.kind === 'death' && e.self === true), 'self death event');
});

test('sweeper: world kill pays +225, feeds the combo, emits sweeperDeath (seed 5187)', () => {
  const w = new World(new RNG(5187));
  w.begin();
  w.spawnSweeperForWave(18);
  const target = w.sweepers.sweepers[0];
  target.pos.x = 5; target.pos.y = 0;
  w.weapons.bullets.push({ id: 9800, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  w.weapons.bullets.push({ id: 9801, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  w.weapons.bullets.push({ id: 9802, pos: { x: 5, y: 0 }, radius: 2, dead: false }); // hp 3
  w.resolveBulletSweepers();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'sweeper', 'kill class sweeper');
  assert.equal(kills[0].data.points, 225, '+225');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'sweeperHit'), 'non-lethal sweeperHit fired');
  assert.ok(ev.some(e => e.type === 'sweeperDeath' && e.data.self === false), 'sweeperDeath (bullet kill)');
  assert.equal(w.sweepers.count, 0, 'arc triangle gone');
});

test('sweeper: contact costs a life (no score, seed 5188)', () => {
  const w = new World(new RNG(5188));
  w.begin();
  w.spawnSweeperForWave(18);
  const target = w.sweepers.sweepers[0];
  target.pos.x = 0; target.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipSweepers();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'sweeperDeath' && e.data.self === false), 'sweeperDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.sweepers.count, 0, 'sweeper destroyed');
});

test('sweeper: wave gates (none W17, one W18, none on boss W20/W25, seed 5189)', () => {
  const w = new World(new RNG(5189));
  w.begin();
  w.spawnSweeperForWave(17);
  assert.equal(w.sweepers.count, 0, 'no sweepers at wave 17');
  w.spawnSweeperForWave(18);
  assert.equal(w.sweepers.count, 1, 'one at wave 18');
  w.sweepers.clear();
  w.spawnSweeperForWave(20);
  assert.equal(w.sweepers.count, 0, 'boss wave 20 excluded');
  w.spawnSweeperForWave(25);
  assert.equal(w.sweepers.count, 0, 'boss wave 25 excluded');
});

test('sweeper: first spawn toasts once, later waves stay quiet (seed 5190)', () => {
  const w = new World(new RNG(5190));
  w.begin();
  w.spawnSweeperForWave(18);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'sweeperSpawn'), 'first sweeper toasts');
  w.sweepers.clear(); // make room so the next wave is not just a silent deferral
  w.spawnSweeperForWave(19);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'sweeperSpawn'), 'second sweeper is quiet');
});

test('sweeper: field is deterministic (same seed + inputs -> identical event stream, seed 5191)', () => {
  const shipAt = (t) => ({ x: 4 * Math.cos(0.6 * t), y: 4 * Math.sin(0.9 * t) });
  const run = (seed) => {
    const f = new SweeperField(new RNG(seed));
    let t = 0;
    f.spawn(shipAt(0));
    const out = [];
    for (let i = 0; i < 1800; i++) {
      t += DT;
      f.step(DT, shipAt(t));
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), e.dir ? e.dir.x.toFixed(4) + ',' + e.dir.y.toFixed(4) : '', String(f.count)]);
    }
    return out;
  };
  const a = run(5191);
  const b = run(5191);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
