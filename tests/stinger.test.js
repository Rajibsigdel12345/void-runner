// ST-229: STINGER charger - telegraphed line-of-sight dash rammer (wave 7+)
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { StingerField } from '../src/core/stinger.js';
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

test('stinger: config sanity', () => {
  const s = CONFIG.stinger;
  assert.equal(s.firstWave, 7, 'gate is wave 7 (one after the W6 breather)');
  assert.ok(s.firstWave > CONFIG.drone.firstWave === false, 'earlier than seekers (wave 8)');
  assert.equal(s.perWave, 1, 'one per wave');
  assert.equal(s.maxConcurrent, 2, 'cap 2 concurrent');
  assert.ok(s.radius > 0 && s.score > 0, 'radius/score');
  assert.ok(s.cruiseSpeed < CONFIG.ship.maxSpeed, 'cruise dodgeable');
  assert.ok(s.chargeSpeed < CONFIG.ship.maxSpeed, 'charge dodgeable with an early read');
  assert.ok(s.chargeSpeed > s.cruiseSpeed, 'charge is the fast part');
  assert.equal(s.telegraph, 0.8, 'telegraph 0.8 s');
  assert.equal(s.chargeDur, 1.4, 'charge 1.4 s');
  assert.equal(s.recover, 1.2, 'recover 1.2 s');
  assert.equal(s.maxCharges, 6, 'six-charge lifetime');
  assert.equal(s.rimDist, 15, 'rim spawn 15 u from the ship');
  assert.ok(s.cruiseMin > 0 && s.cruiseMin < s.cruiseMax, 'cruise window sane');
  assert.ok(CONFIG.drone.score < s.score && s.score < CONFIG.warden.score, '200 < 250 < 400 score rung');
});

test('stinger: juice rungs (shake 0.6 rung + killPunch 0.2 rung)', () => {
  assert.equal(CONFIG.fx.shakeTable.stingerDeath, 0.6, 'shake rung 0.6');
  assert.ok(CONFIG.fx.shakeTable.wardenSpawn < 0.6 && 0.6 < CONFIG.fx.shakeTable.wardenDeath, '0.5 < 0.6 < 0.8 ordering');
  assert.equal(CONFIG.fx.killPunch.stinger, 0.2, 'killPunch rung 0.2');
  assert.ok(CONFIG.fx.killPunch.l < 0.2, 'L 0.18 < 0.2');
  assert.ok(0.2 < CONFIG.fx.shakeTable.droneExplode, '0.2 < the 0.35 drone shake rung');
  assert.equal(killPunchEnergy('stinger', false, CONFIG.fx.killPunch), 0.2, 'unboosted stinger punch');
  assert.equal(killPunchEnergy('stinger', true, CONFIG.fx.killPunch), Math.min(CONFIG.fx.killPunch.max, 0.2 * 1.5), 'overdrive boost stays under the cap');
  assert.equal(killPunchEnergy('L', false, CONFIG.fx.killPunch), 0.18, 'L rung unchanged');
  assert.equal(killPunchEnergy('drone', false, CONFIG.fx.killPunch), 0, 'unknown sizes still map to 0');
});

test('stinger: none before wave 7, one per eligible wave, cap 2', () => {
  const w = new World(new RNG(71));
  w.begin();
  w.spawnStingersForWave(6);
  assert.equal(w.stingers.count, 0, 'no stingers at wave 6');
  w.spawnStingersForWave(7);
  assert.equal(w.stingers.count, 1, 'one stinger at wave 7');
  w.spawnStingersForWave(8);
  assert.equal(w.stingers.count, 2, 'two at wave 8');
  w.spawnStingersForWave(9);
  assert.equal(w.stingers.count, 2, 'cap 2 holds at wave 9');
  const w2 = new World(new RNG(71));
  startWave(w2, 7);
  assert.equal(w2.stingers.count, 1, 'director start at wave 7 spawns a stinger');
});

test('stinger: rim spawn stays at least 15 u from the ship', () => {
  const field = new StingerField(new RNG(72));
  const shipPos = { x: 20, y: 0 }; // near the rim (arena 26): the 15 u ring actually bites
  for (let i = 0; i < 5; i++) {
    field.clear();
    const st = field.spawn(shipPos);
    assert.ok(st, 'spawn succeeded');
    const d = Math.hypot(st.pos.x - shipPos.x, st.pos.y - shipPos.y);
    assert.ok(d >= 15 - 1e-6, 'spawn ' + i + ' is ' + d.toFixed(2) + ' u from the ship');
  }
});

test('stinger: lifecycle timing (cruise -> telegraph 0.8s -> charge 1.4s -> recover 1.2s)', () => {
  const field = new StingerField(new RNG(73));
  field.spawn({ x: 30, y: 30 }); // ship far away: no rim clip, aim never degenerates
  const st = field.stingers[0];
  const runs = []; // [state, length]
  let prev = null, len = 0;
  for (let i = 0; i < 700; i++) {
    field.step(DT, { x: 30, y: 30 });
    const cur = st.state;
    if (cur === prev) len++;
    else { if (prev !== null) runs.push([prev, len]); prev = cur; len = 1; }
  }
  runs.push([prev, len]);
  assert.equal(runs[0][0], 'cruise', 'starts in cruise');
  assert.ok(runs[0][1] >= 89 && runs[0][1] <= 181, 'cruise window 1.5-3.0 s (' + runs[0][1] + ' ticks)');
  assert.equal(runs[1][0], 'telegraph', 'telegraph second');
  assert.ok(runs[1][1] === 48 || runs[1][1] === 49, 'telegraph 0.8 s (' + runs[1][1] + ' ticks)');
  assert.equal(runs[2][0], 'charge', 'charge third');
  assert.ok(runs[2][1] === 84 || runs[2][1] === 85, 'charge 1.4 s (' + runs[2][1] + ' ticks)');
  assert.equal(runs[3][0], 'recover', 'recover fourth');
  assert.ok(runs[3][1] === 72 || runs[3][1] === 73, 'recover 1.2 s (' + runs[3][1] + ' ticks)');
  assert.equal(runs[4][0], 'cruise', 'cycles back to cruise');
});

test('stinger: charge aims at the ship position at telegraph start (no re-aim)', () => {
  const field = new StingerField(new RNG(74));
  field.spawn({ x: 40, y: 0 });
  const st = field.stingers[0];
  st.pos.x = 12; st.pos.y = 4;
  st.state = 'cruise'; st.t = st.cruiseDur; // force the next step into the telegraph
  field.step(DT, { x: 5, y: 3 }); // ship here at telegraph start
  assert.equal(st.state, 'telegraph', 'telegraph started');
  const aim = { x: st.aim.x, y: st.aim.y };
  const lockPos = { x: st.pos.x, y: st.pos.y }; // the aim locks at this position (post final cruise tick)
  for (let i = 0; i < 60; i++) field.step(DT, { x: -10, y: -10 }); // through the telegraph and into the charge: aim must NOT follow
  assert.deepEqual(st.aim, aim, 'aim locked at telegraph start');
  assert.ok(st.state === 'charge' || st.state === 'recover', 'charge has started');
  const want = Math.atan2(aim.y - lockPos.y, aim.x - lockPos.x); // direction at lock time
  const got = Math.atan2(st.vel.y, st.vel.x);
  let da = Math.abs(want - got) % (2 * Math.PI);
  if (da > Math.PI) da = 2 * Math.PI - da;
  assert.ok(da < 1e-9, 'charge direction == locked aim (' + da.toFixed(4) + ' rad off)');
});

test('stinger: six-charge lifetime then fizzle (frees the slot)', () => {
  const field = new StingerField(new RNG(75));
  field.spawn({ x: 30, y: 30 });
  const st = field.stingers[0];
  const kinds = [];
  for (let i = 0; i < 3000 && field.count > 0; i++) {
    field.step(DT, { x: 30, y: 30 });
    for (const e of field.drainEvents()) kinds.push(e.kind);
  }
  assert.equal(field.count, 0, 'stinger fizzled out');
  assert.equal(st.chargesUsed, 6, 'exactly six charges');
  const charges = kinds.filter(k => k === 'charge').length;
  const fizzles = kinds.filter(k => k === 'fizzle').length;
  assert.equal(charges, 6, 'six charge events');
  assert.equal(fizzles, 1, 'one fizzle event');
  const again = field.spawn({ x: 30, y: 30 });
  assert.ok(again, 'fizzle frees the slot');
});

test('stinger: world - bullet kill pays +250 and feeds the combo', () => {
  const w = new World(new RNG(76));
  w.begin();
  w.ship.invuln = 1e9;
  w.spawnStingersForWave(7);
  assert.equal(w.stingers.count, 1, 'spawned');
  const st = w.stingers.stingers[0];
  st.pos.x = 1; st.pos.y = 0;
  w.weapons.bullets.push({ id: 9100, pos: { x: 1, y: 0 }, radius: 2, dead: false });
  w.resolveBulletStingers();
  const evs = w.drainEvents();
  assert.equal(w.stingers.count, 0, 'stinger destroyed');
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'stinger', 'size stinger');
  assert.equal(kill.data.points, 250, '250 base points');
  assert.equal(kill.data.combo, 1, 'feeds the combo');
  assert.ok(evs.find(e => e.type === 'stingerDeath'), 'stingerDeath FX event');
});

test('stinger: world - contact costs a life, NO score', () => {
  const w = new World(new RNG(77));
  w.begin();
  w.ship.invuln = 0;
  const scoreBefore = w.score;
  w.spawnStingersForWave(7);
  const st = w.stingers.stingers[0];
  st.pos.x = 0; st.pos.y = 0; // on top of the ship
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.stingers.count, 0, 'stinger destroyed on contact');
  assert.equal(w.lives, 2, 'life cost');
  assert.equal(w.score, scoreBefore, 'no score for contact');
  assert.ok(!evs.find(e => e.type === 'kill'), 'no kill event');
  const hit = evs.find(e => e.type === 'hit');
  assert.ok(hit, 'hit event');
  assert.equal(hit.data.lives, 2, 'hit event carries the life count');
});

test('stinger: world - first spawn of a run emits stingerSpawn (toast), later spawns stay quiet', () => {
  const w = new World(new RNG(78));
  startWave(w, 7);
  const evs7 = w.drainEvents();
  assert.ok(evs7.find(e => e.type === 'stingerSpawn'), 'first spawn emits stingerSpawn');
  w.step(DT, NEUTRAL); // clear the intermission into wave 8
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = 7;
  w.step(DT, NEUTRAL);
  const evs8 = w.drainEvents();
  assert.equal(w.stingers.count, 2, 'second wave spawns a second stinger');
  assert.ok(!evs8.find(e => e.type === 'stingerSpawn'), 'no repeat callout in the same run');
});

test('stinger: determinism - same seed, same timeline (two field runs)', () => {
  const f1 = new StingerField(new RNG(79));
  const f2 = new StingerField(new RNG(79));
  f1.spawn({ x: 1, y: 2 });
  f2.spawn({ x: 1, y: 2 });
  const e1 = [], e2 = [];
  for (let i = 0; i < 2400; i++) {
    f1.step(DT, { x: 0, y: 0 });
    f2.step(DT, { x: 0, y: 0 });
    for (const e of f1.drainEvents()) e1.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f1.count)]);
    for (const e of f2.drainEvents()) e2.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f2.count)]);
  }
  assert.deepEqual(e1, e2, 'identical event timelines');
  assert.ok(e1.length > 0 && e1.some(e => e[0] === 'fizzle'), 'timeline reaches the fizzle');
});