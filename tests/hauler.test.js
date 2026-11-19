// ST-484 (E69): HAULER - the slow ore truck (spec wave 15+; wave 15 is a boss
// wave so the standard gate makes its effective debut wave 16 - ST-487
// adjudicates). Frozen target ahead of and to one side of the ship; 2.0 s
// home-in, then a CLOSED-FORM plod (3.5 u/s + 1.2 Hz +/-0.5 u wobble) with rim
// ping-pong. Every 4.0 s it drops a mine (0.4 s telegraph first) flying
// opposite its current travel. Never shoots. 12 hits (+400, the flyer rung).
// No RNG in step(). Covers: config rungs, juice rungs, spawn-target geometry,
// the mine cadence, closed-form exactness, the rim ping-pong, wave gates, the
// cap, pending-drop cancel on death, world kill, contact, toast-once,
// determinism.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { HaulerField } from '../src/core/hauler.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const DT = 1 / 60;
const EPS = 1e-9;

test('hauler: config sanity (spec W15 = boss wave -> effective W16, 12 hits, +400)', () => {
  const s = CONFIG.hauler;
  assert.equal(s.firstWave, 16, 'spec gate 15 is a boss wave -> pinned to effective debut 16 (I521/ST-487)');
  assert.equal(15 % CONFIG.boss.everyWave, 0, 'wave 15 IS a boss wave (effective debut 16; ST-487 adjudicates)');
  assert.equal(s.perWave, 1, 'one truck per wave');
  assert.equal(s.maxConcurrent, 1, 'cap one');
  assert.equal(s.hp, 12, '12 hits');
  assert.equal(s.radius, 1.1, 'truck hitbox');
  assert.equal(s.score, 400, 'kill reward 400');
  assert.equal(s.score, CONFIG.flyer.score, '400 = the flyer rung');
  assert.ok(s.score < CONFIG.splicer.score, '400 < 600 (below the 600 rung)');
  assert.equal(s.speed, 3.5, 'plod speed');
  assert.equal(s.mineEvery, 4.0, 'mine cadence');
  assert.ok(s.dropTelegraph < s.mineEvery, 'telegraph inside the cadence');
});

test('hauler: juice rungs (shake 0.7, killPunch 0.29, shockwave 3.2)', () => {
  assert.equal(CONFIG.fx.shakeTable.haulerDeath, 0.7, 'shake rung 0.7');
  assert.ok(0.65 < CONFIG.fx.shakeTable.haulerDeath && CONFIG.fx.shakeTable.haulerDeath < 0.75, '0.65 flyerDeath < 0.7 < 0.75 podDeath');
  assert.equal(CONFIG.fx.killPunch.hauler, 0.29, 'killPunch rung 0.29');
  assert.ok(0.28 < CONFIG.fx.killPunch.hauler && CONFIG.fx.killPunch.hauler < 0.3, '0.28 sentry < 0.29 < 0.3 gunship');
  assert.equal(killPunchEnergy('hauler', false, CONFIG.fx.killPunch), 0.29, 'unboosted hauler punch');
  assert.equal(killPunchEnergy('hauler', true, CONFIG.fx.killPunch), 0.3, 'overdrive 0.435 -> the 0.3 cap');
  assert.equal(CONFIG.fx.shockwave.classes.hauler, 3.2, 'shockwave class 3.2');
  assert.ok(3.0 < CONFIG.fx.shockwave.classes.hauler && CONFIG.fx.shockwave.classes.hauler < 3.4, 'pod 3.0 < 3.2 < L 3.4');
});

test('hauler: the frozen target sits ahead of and to one side of the ship (seeds 1..64)', () => {
  const s = CONFIG.hauler;
  for (let seed = 1; seed <= 64; seed++) {
    const f = new HaulerField(new RNG(seed));
    const ship = { x: 6, y: -4 };
    const h = f.spawn(ship, 0.9);
    const fx = Math.cos(0.9), fy = Math.sin(0.9);
    const px = -fy, py = fx; // perpendicular
    const rx = h.target.x - ship.x, ry = h.target.y - ship.y;
    const fOff = rx * fx + ry * fy;
    const lOff = rx * px + ry * py;
    assert.ok(fOff >= s.forwardOffMin - 1e-6 && fOff <= s.forwardOffMax + 1e-6, 'seed ' + seed + ' forward offset in band');
    assert.ok(Math.abs(lOff) >= s.lateralOffMin - 1e-6 && Math.abs(lOff) <= s.lateralOffMax + 1e-6, 'seed ' + seed + ' lateral offset in band');
    assert.ok(Math.hypot(h.target.x, h.target.y) <= CONFIG.arena.radius - s.radius + 1e-9, 'seed ' + seed + ' target inside the rim');
  }
});

test('hauler: the mine cadence is 4.0 s with a 0.4 s telegraph, drops fly behind the travel', () => {
  const f = new HaulerField(new RNG(4855));
  const h = f.spawn({ x: 0, y: 0 }, 0);
  const drops = [];
  const tels = [];
  let t = 0;
  for (let i = 0; i < 2400; i++) {
    t += DT;
    f.step(DT);
    for (const e of f.drainEvents()) {
      if (e.kind === 'mineDrop') drops.push({ t, pos: { x: e.pos.x, y: e.pos.y }, dir: { x: e.dir.x, y: e.dir.y }, heading: { x: h.headingVec.x, y: h.headingVec.y } });
      if (e.kind === 'telegraph') tels.push({ t, pos: { x: e.pos.x, y: e.pos.y } });
    }
  }
  assert.ok(drops.length >= 4, 'at least 4 drops in 40 s');
  for (let i = 1; i < drops.length; i++) {
    assert.ok(Math.abs(drops[i].t - drops[i - 1].t - 4.0) <= DT, 'gap 4.0 s (drop ' + i + ')');
  }
  assert.equal(tels.length, drops.length, 'one telegraph per drop');
  for (let i = 0; i < drops.length; i++) {
    assert.ok(tels[i].t < drops[i].t, 'telegraph precedes its drop');
    assert.ok(Math.abs(drops[i].t - tels[i].t - 0.4) <= DT, 'telegraph 0.4 s before the drop');
  }
  for (const d of drops) {
    assert.ok(Math.abs(Math.hypot(d.dir.x, d.dir.y) - 1) < 1e-9, 'drop dir is unit');
    const dot = d.dir.x * d.heading.x + d.dir.y * d.heading.y;
    assert.ok(Math.abs(dot + 1) < 1e-9, 'the mine flies behind the current travel (after any same-frame reversal)');
  }
});

test('hauler: the plod position is exact closed form (no drift)', () => {
  const s = CONFIG.hauler;
  const f = new HaulerField(new RNG(4856));
  const h = f.spawn({ x: 0, y: 0 }, 1.2);
  for (let i = 0; i < 240; i++) f.step(DT);
  assert.equal(h.state, 'plod', 'plod by 4 s (first rim hit is ~9.7 s away)');
  const wob = Math.sin(s.wobbleFreq * h.t + h.wobblePhase) * s.wobbleAmp;
  const ex = h.plodOrigin.x + h.headingVec.x * s.speed * h.t + h.perpVec.x * wob;
  const ey = h.plodOrigin.y + h.headingVec.y * s.speed * h.t + h.perpVec.y * wob;
  assert.ok(Math.abs(h.pos.x - ex) < 1e-9, 'closed-form x matches');
  assert.ok(Math.abs(h.pos.y - ey) < 1e-9, 'closed-form y matches');
});

test('hauler: the rim ping-pong never leaves the arena (60 s)', () => {
  const f = new HaulerField(new RNG(4857));
  const h = f.spawn({ x: 0, y: 0 }, 0.4);
  let flips = 0;
  const drops = [];
  let prev = { x: h.headingVec.x, y: h.headingVec.y };
  for (let i = 0; i < 3600; i++) {
    f.step(DT);
    assert.ok(Math.hypot(h.pos.x, h.pos.y) + h.radius <= 26 + 1e-9, 'inside the rim every frame');
    const dot = prev.x * h.headingVec.x + prev.y * h.headingVec.y;
    if (dot < 0) flips++;
    prev = { x: h.headingVec.x, y: h.headingVec.y };
    for (const e of f.drainEvents()) if (e.kind === 'mineDrop') drops.push(e);
  }
  assert.ok(flips >= 1, 'at least one heading reversal');
  assert.ok(drops.length >= 7, 'the ping-pong keeps dropping mines');
});

test('hauler: wave gates (none W14, none on boss W15, one W16)', () => {
  const w = new World(new RNG(4858));
  w.begin();
  w.spawnHaulerForWave(14);
  assert.equal(w.haulers.count, 0, 'no hauler at wave 14');
  w.spawnHaulerForWave(15);
  assert.equal(w.haulers.count, 0, 'boss wave 15 excluded (effective debut 16)');
  w.spawnHaulerForWave(16);
  assert.equal(w.haulers.count, 1, 'one truck at wave 16');
});

test('hauler: the cap defers the second truck', () => {
  const f = new HaulerField(new RNG(4859));
  assert.ok(f.spawn({ x: 0, y: 0 }, 0) !== null, 'first');
  assert.equal(f.spawn({ x: 0, y: 0 }, 0), null, 'second deferred at the cap of 1');
  assert.equal(f.count, 1, 'nothing extra spawned');
});

test('hauler: a pending drop auto-cancels on death (field level)', () => {
  const f = new HaulerField(new RNG(4861));
  const h = f.spawn({ x: 0, y: 0 }, 0);
  for (let i = 0; i < 120; i++) f.step(DT); // 2.0 s -> plod
  h.mineTimer = 0.2; // a drop is 0.2 s away
  f.destroy(h.id);
  for (let i = 0; i < 240; i++) f.step(DT);
  assert.equal(f.drainEvents().filter(e => e.kind === 'mineDrop').length, 0, 'the pending drop is gone');
  assert.equal(f.count, 0, 'truck gone');
});

test('hauler: world kill pays +400, feeds the combo, emits haulerDeath', () => {
  const w = new World(new RNG(4860));
  w.begin();
  w.spawnHaulerForWave(16);
  const target = w.haulers.haulers[0];
  target.pos.x = 5; target.pos.y = 0;
  for (let i = 0; i < 12; i++) w.weapons.bullets.push({ id: 9800 + i, pos: { x: 5, y: 0 }, radius: 2, dead: false }); // hp 12
  w.resolveBulletHaulers();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'hauler', 'kill class hauler');
  assert.equal(kills[0].data.points, 400, '+400');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.ok(ev.some(e => e.type === 'haulerDeath' && e.data.self === false), 'haulerDeath (bullet kill)');
  assert.equal(w.haulers.count, 0, 'truck gone');
});

test('hauler: contact costs a life, no score, truck destroyed', () => {
  const w = new World(new RNG(4862));
  w.begin();
  w.spawnHaulerForWave(16);
  const target = w.haulers.haulers[0];
  target.pos.x = 0; target.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipHaulers();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'haulerDeath' && e.data.self === false), 'haulerDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.haulers.count, 0, 'truck destroyed');
});

test('hauler: first spawn toasts once, later waves stay quiet', () => {
  const w = new World(new RNG(4864));
  w.begin();
  w.spawnHaulerForWave(16);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'haulerSpawn'), 'first truck toasts');
  w.haulers.clear(); // make room so the next wave is not just a silent deferral
  w.spawnHaulerForWave(17);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'haulerSpawn'), 'second truck is quiet');
});

test('hauler: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const run = (seed) => {
    const f = new HaulerField(new RNG(seed));
    let t = 0;
    f.spawn({ x: 0, y: 0 }, 0.4);
    const out = [];
    for (let i = 0; i < 1800; i++) {
      t += DT;
      f.step(DT);
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f.count)]);
    }
    return out;
  };
  const a = run(4863);
  const b = run(4863);
  assert.ok(a.length > 0, 'drops actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
