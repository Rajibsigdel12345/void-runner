// ST-484 (E69): PHANTOM - the flank-ambush cloaker (wave 13+). Invisible entry
// to an 11-u flank ring, then an 8.2 s cycle: orbit 3.5 s (opacity 1.0) ->
// cloak 1.2 s (1.0 -> 0.12) -> drift 1.0 s (0.12) -> strike 2.5 s (0.5 s
// uncloak, charge cue, 3-bolt spread aimed at the ship AT FIRE TIME) -> orbit.
// Targetable ONLY while opacity > 0.5 (bullets pass through the cloak with no
// feedback); contact costs a life regardless of cloak. 2 hits (+250, the
// stinger rung; bolt 15 u/s under the 1.15x F2 cap). No RNG in step().
// Covers: config rungs, juice rungs, the opacity cycle, the untargetable
// fraction, the strike burst geometry, wave gates, the cap, world kill, cloak
// pass-through, cloaked contact, toast-once, determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { PhantomField } from '../src/core/phantom.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const DT = 1 / 60;
const EPS = 1e-9;

test('phantom: config sanity (gate 13, 2 hits, +250, the 8.2 s cycle, F2 bolt cap)', () => {
  const s = CONFIG.phantom;
  assert.equal(s.firstWave, 13, 'gate is wave 13');
  assert.equal(s.perWave, 1, 'one cloaker per wave');
  assert.equal(s.maxConcurrent, 2, 'cap two');
  assert.equal(s.hp, 2, 'two hits');
  assert.equal(s.radius, 0.5, 'small hitbox');
  assert.equal(s.score, 250, 'kill reward 250');
  assert.equal(s.score, CONFIG.stinger.score, '250 = the stinger rung');
  assert.ok(s.score < CONFIG.hunter.score, '250 < 300 (below the stalker rung)');
  assert.ok(s.boltSpeed < 16, 'absolute dodgeability ceiling');
  assert.ok(s.boltSpeed <= 1.15 * CONFIG.ship.maxSpeed + EPS, 'under the 1.15x ship F2 cap');
  assert.ok(Math.abs(s.orbitDur + s.cloakDur + s.driftDur + s.strikeDur - 8.2) < 1e-9, '8.2 s cycle exact');
  assert.equal(s.orbitR, 15, 'flank ring radius (I521/ST-487: 11 -> 15)');
  assert.ok(s.cloakOpacity < s.targetOpacity, 'cloak floor below the targetable line');
  assert.ok(s.enterDur > 0 && s.uncloakDur < s.strikeDur, 'entry + uncloak windows sane');
});

test('phantom: juice rungs (shake 0.35, killPunch 0.11, shockwave 1.5)', () => {
  assert.equal(CONFIG.fx.shakeTable.phantomDeath, 0.35, 'shake rung 0.35');
  assert.ok(0.3 < CONFIG.fx.shakeTable.phantomDeath && CONFIG.fx.shakeTable.phantomDeath < 0.4, '0.3 < 0.35 < 0.4');
  assert.equal(CONFIG.fx.killPunch.phantom, 0.11, 'killPunch rung 0.11');
  assert.ok(0.10 < CONFIG.fx.killPunch.phantom && CONFIG.fx.killPunch.phantom < 0.12, '0.10 wasp < 0.11 < 0.12 m');
  assert.equal(killPunchEnergy('phantom', false, CONFIG.fx.killPunch), 0.11, 'unboosted phantom punch');
  assert.ok(Math.abs(killPunchEnergy('phantom', true, CONFIG.fx.killPunch) - 0.165) < 1e-12, 'overdrive x1.5 = 0.165 (under the 0.3 cap)');
  assert.equal(CONFIG.fx.shockwave.classes.phantom, 1.5, 'shockwave class 1.5');
  assert.ok(1.4 < CONFIG.fx.shockwave.classes.phantom && CONFIG.fx.shockwave.classes.phantom < 1.6, 'wasp 1.4 < 1.5 < S 1.6');
});

test('phantom: the opacity cycle walks enter -> orbit -> cloak -> drift -> strike -> orbit', () => {
  const f = new PhantomField(new RNG(4841));
  const ship = { x: 0, y: 0 };
  const p = f.spawn(ship);
  assert.equal(p.opacity, 0, 'spawns invisible');
  const seen = [];
  let prev = p.state;
  for (let i = 0; i < 700 && seen.length < 5; i++) {
    f.step(DT, ship);
    if (p.state !== prev) { seen.push(p.state); prev = p.state; }
    if (p.state === 'cloak' && p.opacity >= 1.0) assert.ok(p.t <= DT * 2 + EPS, 'cloak starts at full opacity');
    if (p.state === 'drift') assert.ok(Math.abs(p.opacity - CONFIG.phantom.cloakOpacity) < EPS, 'drift holds the cloak floor');
  }
  assert.deepEqual(seen.slice(0, 5), ['orbit', 'cloak', 'drift', 'strike', 'orbit'], 'full cycle order');
  assert.ok(p.opacity === 1.0, 'back at full opacity on the next orbit');
});

test('phantom: the untargetable fraction of the 8.2 s cycle stays in [0.15, 0.35]', () => {
  const f = new PhantomField(new RNG(4842));
  const ship = { x: 0, y: 0 };
  const p = f.spawn(ship);
  // Skip the entry to the first orbit.
  let i = 0;
  while (p.state !== 'orbit') { f.step(DT, ship); i++; assert.ok(i < 200, 'entered the orbit'); }
  let untargetable = 0;
  const frames = 492; // 8.2 s exactly
  for (let k = 0; k < frames; k++) {
    if (!(p.opacity > CONFIG.phantom.targetOpacity)) untargetable++;
    f.step(DT, ship);
  }
  const frac = (untargetable * DT) / 8.2;
  assert.ok(frac >= 0.15 && frac <= 0.35, 'the cloak is a real read: ' + frac.toFixed(3));
});

test('phantom: the strike fires a charge then a 3-bolt spread at fire time (seeds 4843-45)', () => {
  for (const seed of [4843, 4844, 4845]) {
    const f = new PhantomField(new RNG(seed));
    const ship = { x: 3, y: -2 };
    const p = f.spawn(ship);
    let i = 0;
    while (p.state !== 'strike') { f.step(DT, ship); i++; assert.ok(i < 600, 'seed ' + seed + ' reached the strike (first strike is 6.9 s = 415 steps: enter 1.2 + orbit 3.5 + cloak 1.2 + drift 1.0)'); }
    const fires = [];
    let charge = null;
    i = 0;
    while (p.state === 'strike' && i < 200) {
      i++;
      f.step(DT, ship);
      for (const e of f.drainEvents()) {
        const t = i * DT;
        if (e.kind === 'charge') charge = { t, pos: { x: e.pos.x, y: e.pos.y } };
        if (e.kind === 'fire') fires.push({ t, pos: { x: e.pos.x, y: e.pos.y }, dir: { x: e.dir.x, y: e.dir.y } });
      }
    }
    assert.equal(fires.length, 3, 'seed ' + seed + ' three bolts');
    assert.ok(charge !== null, 'seed ' + seed + ' charge cue');
    assert.ok(charge.t < fires[0].t, 'seed ' + seed + ' charge precedes the burst');
    assert.ok(Math.abs(fires[0].t - 0.85) <= DT, 'seed ' + seed + ' first bolt at 0.5 uncloak + 0.35 charge');
    assert.ok(Math.abs(fires[1].t - fires[0].t - 0.3) <= DT, 'seed ' + seed + ' gap 0.3');
    assert.ok(Math.abs(fires[2].t - fires[1].t - 0.3) <= DT, 'seed ' + seed + ' gap 0.3');
    for (const fo of fires) {
      assert.ok(Math.abs(Math.hypot(fo.dir.x, fo.dir.y) - 1) < 1e-9, 'seed ' + seed + ' bolt dir is unit');
    }
    // The middle bolt dead-aims at the (stationary) ship.
    const md = fires[1];
    const dx = ship.x - md.pos.x, dy = ship.y - md.pos.y;
    const l = Math.hypot(dx, dy);
    assert.ok(Math.abs(md.dir.x - dx / l) < EPS && Math.abs(md.dir.y - dy / l) < EPS, 'seed ' + seed + ' middle bolt dead-aims');
  }
});

test('phantom: wave gates (none W12, one W13, none on boss W15/W20)', () => {
  const w = new World(new RNG(4846));
  w.begin();
  w.spawnPhantomForWave(12);
  assert.equal(w.phantoms.count, 0, 'no phantoms at wave 12');
  w.spawnPhantomForWave(13);
  assert.equal(w.phantoms.count, 1, 'one cloaker at wave 13');
  w.phantoms.clear();
  w.spawnPhantomForWave(15);
  assert.equal(w.phantoms.count, 0, 'boss wave 15 excluded');
  w.spawnPhantomForWave(20);
  assert.equal(w.phantoms.count, 0, 'boss wave 20 excluded');
});

test('phantom: the cap defers the third cloaker', () => {
  const f = new PhantomField(new RNG(4847));
  assert.ok(f.spawn(null) !== null, 'first');
  assert.ok(f.spawn(null) !== null, 'second');
  assert.equal(f.spawn(null), null, 'third deferred at the cap of 2');
  assert.equal(f.count, 2, 'nothing extra spawned');
});

test('phantom: world kill pays +250, feeds the combo, emits phantomDeath', () => {
  const w = new World(new RNG(4848));
  w.begin();
  w.spawnPhantomForWave(13);
  const target = w.phantoms.phantoms[0];
  target.state = 'orbit';
  target.opacity = 1.0;
  target.pos.x = 5; target.pos.y = 0;
  w.weapons.bullets.push({ id: 9700, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  w.weapons.bullets.push({ id: 9701, pos: { x: 5, y: 0 }, radius: 2, dead: false }); // hp 2
  w.resolveBulletPhantoms();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'phantom', 'kill class phantom');
  assert.equal(kills[0].data.points, 250, '+250');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'phantomHit'), 'non-lethal phantomHit fired');
  assert.ok(ev.some(e => e.type === 'phantomDeath' && e.data.self === false), 'phantomDeath (bullet kill)');
  assert.equal(w.phantoms.count, 0, 'cloaker gone');
});

test('phantom: bullets pass through the cloak with no feedback', () => {
  const w = new World(new RNG(4850));
  w.begin();
  w.spawnPhantomForWave(13);
  const target = w.phantoms.phantoms[0];
  target.state = 'drift';
  target.opacity = 0.12;
  target.pos.x = 5; target.pos.y = 0;
  const hpBefore = target.hp;
  w.weapons.bullets.push({ id: 9702, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  w.resolveBulletPhantoms();
  const ev = w.drainEvents();
  assert.equal(target.hp, hpBefore, 'no damage through the cloak');
  assert.ok(!ev.some(e => e.type === 'phantomHit'), 'no phantomHit');
  assert.ok(!ev.some(e => e.type === 'kill'), 'no kill');
  assert.equal(w.weapons.bullets[0].dead, false, 'the bullet is not consumed');
  assert.equal(w.phantoms.count, 1, 'the cloaker survives');
});

test('phantom: contact costs a life even while cloaked (no score)', () => {
  const w = new World(new RNG(4851));
  w.begin();
  w.spawnPhantomForWave(13);
  const target = w.phantoms.phantoms[0];
  target.state = 'drift';
  target.opacity = 0.12;
  target.pos.x = 0; target.pos.y = 0; // onto the ship, cloaked
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipPhantoms();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'phantomDeath' && e.data.self === false), 'phantomDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.phantoms.count, 0, 'cloaker destroyed');
});

test('phantom: first spawn toasts once, later waves stay quiet', () => {
  const w = new World(new RNG(4852));
  w.begin();
  w.spawnPhantomForWave(13);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'phantomSpawn'), 'first cloaker toasts');
  w.phantoms.clear(); // make room so the next wave is not just a silent deferral
  w.spawnPhantomForWave(14);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'phantomSpawn'), 'second cloaker is quiet');
});

test('phantom: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const shipAt = (t) => ({ x: 4 * Math.cos(0.6 * t), y: 4 * Math.sin(0.9 * t) });
  const run = (seed) => {
    const f = new PhantomField(new RNG(seed));
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
  const a = run(4853);
  const b = run(4853);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
