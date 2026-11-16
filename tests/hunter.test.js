// ST-418: HUNTER - rear-approach stalker (wave 6+). Telegraphed rear dash; 1 bullet kills (+300).
// Pairs with the I445/I446 camera work: the arena stays visible behind the ship, so the rear
// approach is always readable. Mirrors the StingerField lifecycle (orbit -> telegraph -> dash
// -> recover), re-targeted to a REAR anchor behind the ship's nose. DOM-free, three-free.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { HunterField } from '../src/core/hunter.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;
const SHIP_AIM = -Math.PI / 2; // nose-up (the ship's default)

/** Start a world and advance the wave director to wave (one step past intermission). */
function startWave(w, wave) {
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = wave - 1;
  w.step(DT, NEUTRAL);
  assert.equal(w.waves.wave, wave, 'director on wave ' + wave);
}

test('hunter: config sanity', () => {
  const s = CONFIG.hunter;
  assert.equal(s.firstWave, 6, 'gate is wave 6 (one before the W7 stinger)');
  assert.ok(s.firstWave < CONFIG.stinger.firstWave, 'earlier than the stinger (wave 7)');
  assert.equal(s.perWave, 1, 'one per wave');
  assert.equal(s.maxConcurrent, 2, 'cap 2 concurrent');
  assert.ok(s.radius > 0 && s.score > 0, 'radius/score');
  assert.equal(s.telegraph, 0.85, 'telegraph 0.85 s');
  assert.ok(s.telegraph >= 0.7, 'telegraph leaves a reaction floor');
  assert.equal(s.dashSpeed, 9.5, 'dash 9.5 u/s');
  assert.ok(s.dashSpeed < CONFIG.ship.maxSpeed, 'dash dodgeable with a read');
  assert.equal(s.dashDur, 1, 'dash 1.0 s');
  assert.equal(s.recover, 1, 'recover 1.0 s');
  assert.equal(s.maxCharges, 5, 'five-dash lifetime');
  assert.equal(s.rimDist, 14, 'rim spawn 14 u from the ship');
  assert.ok(s.orbitDurMin > 0 && s.orbitDurMin < s.orbitDurMax, 'orbit window sane');
  assert.ok(s.orbitR > 0 && s.orbitSpeed > 0 && s.orbitTurn > 0, 'orbit params sane');
  assert.ok(CONFIG.stinger.score < s.score && s.score < CONFIG.flyer.score, '250 < 300 < 400 score rung');
});

test('hunter: juice rungs (shake 0.55 rung + killPunch 0.22 rung)', () => {
  assert.equal(CONFIG.fx.shakeTable.hunterDeath, 0.55, 'shake rung 0.55');
  assert.ok(CONFIG.fx.shakeTable.droneExplode < 0.55 && 0.55 < CONFIG.fx.shakeTable.stingerDeath, '0.35 < 0.55 < 0.6 ordering');
  assert.equal(CONFIG.fx.killPunch.hunter, 0.22, 'killPunch rung 0.22');
  assert.ok(CONFIG.fx.killPunch.stinger < 0.22 && 0.22 < CONFIG.fx.killPunch.flyer, '0.2 < 0.22 < 0.25 ordering');
  assert.equal(killPunchEnergy('hunter', false, CONFIG.fx.killPunch), 0.22, 'unboosted hunter punch');
  assert.equal(killPunchEnergy('hunter', true, CONFIG.fx.killPunch), Math.min(CONFIG.fx.killPunch.max, 0.22 * 1.5), 'overdrive boost stays under the cap');
  assert.equal(CONFIG.fx.shockwave.classes.hunter, 2.2, 'shockwave class 2.2');
  assert.ok(CONFIG.fx.shockwave.classes.stinger < 2.2 && 2.2 < CONFIG.fx.shockwave.classes.warden, '2 < 2.2 < 3 ordering');
});

test('hunter: none before wave 6, one per eligible wave, cap 2', () => {
  const w = new World(new RNG(111));
  w.begin();
  w.spawnHunterForWave(5);
  assert.equal(w.hunters.count, 0, 'no hunters at wave 5');
  w.spawnHunterForWave(6);
  assert.equal(w.hunters.count, 1, 'one hunter at wave 6');
  w.spawnHunterForWave(7);
  assert.equal(w.hunters.count, 2, 'two at wave 7');
  w.spawnHunterForWave(8);
  assert.equal(w.hunters.count, 2, 'cap 2 holds at wave 8');
  const w2 = new World(new RNG(111));
  startWave(w2, 6);
  assert.equal(w2.hunters.count, 1, 'director start at wave 6 spawns a hunter');
});

test('hunter: rim spawn stays at least 14 u from the ship', () => {
  const field = new HunterField(new RNG(112));
  const shipPos = { x: 20, y: 0 }; // near the rim (arena 26): the 14 u ring actually bites
  for (let i = 0; i < 5; i++) {
    field.clear();
    const h = field.spawn(shipPos);
    assert.ok(h, 'spawn succeeded');
    const d = Math.hypot(h.pos.x - shipPos.x, h.pos.y - shipPos.y);
    assert.ok(d >= 14 - 1e-6, 'spawn ' + i + ' is ' + d.toFixed(2) + ' u from the ship');
  }
});

test('hunter: rear anchor sits behind the ship nose by orbitR', () => {
  const s = CONFIG.hunter;
  const field = new HunterField(new RNG(113));
  const nose = 0; // nose pointing +x
  const a1 = field.rearAnchor({ x: 3, y: 4 }, nose, s);
  assert.ok(Math.abs(a1.x - (3 - s.orbitR)) < 1e-9, 'anchor x = ship.x - orbitR');
  assert.ok(Math.abs(a1.y - 4) < 1e-9, 'anchor y = ship.y');
  const noseUp = -Math.PI / 2; // nose pointing -y
  const a2 = field.rearAnchor({ x: 0, y: 0 }, noseUp, s);
  assert.ok(Math.abs(a2.x) < 1e-9, 'anchor x ~ 0');
  assert.ok(Math.abs(a2.y - s.orbitR) < 1e-9, 'anchor y = +orbitR (behind a -y nose)');
});

test('hunter: lifecycle reaches orbit -> telegraph -> dash -> recover (telegraphed)', () => {
  const field = new HunterField(new RNG(114));
  field.spawn({ x: 30, y: 30 });
  const h = field.hunters[0];
  const seen = [];
  let telegraphed = false;
  for (let i = 0; i < 1500 && field.count > 0; i++) {
    field.step(DT, { x: 30, y: 30 }, SHIP_AIM);
    for (const e of field.drainEvents()) if (e.kind === 'telegraph') telegraphed = true;
    if (seen[seen.length - 1] !== h.state) seen.push(h.state);
  }
  assert.equal(seen[0], 'orbit', 'starts in orbit');
  assert.ok(seen.indexOf('telegraph') > 0, 'telegraph phase reached');
  assert.ok(seen.indexOf('dash') > seen.indexOf('telegraph'), 'dash after telegraph');
  assert.ok(seen.indexOf('recover') > seen.indexOf('dash'), 'recover after dash');
  assert.ok(telegraphed, 'a telegraph event fired');
});

test('hunter: dash aims at the ship position at telegraph start (no re-aim)', () => {
  const field = new HunterField(new RNG(115));
  field.spawn({ x: 40, y: 0 });
  const h = field.hunters[0];
  h.pos.x = 12; h.pos.y = 4;
  h.state = 'orbit'; h.t = h.orbitDur; // force the next step into the telegraph
  const shipPos = { x: 5, y: 3 };
  field.step(DT, shipPos, SHIP_AIM);
  assert.equal(h.state, 'telegraph', 'telegraph started');
  assert.deepEqual(h.aim, shipPos, 'aim locked to the ship position');
  const aimDir = { x: h.aimDir.x, y: h.aimDir.y };
  for (let i = 0; i < 55; i++) field.step(DT, { x: -10, y: -10 }, SHIP_AIM); // through the telegraph into the dash
  assert.equal(h.state, 'dash', 'dash has started');
  const want = Math.atan2(aimDir.y, aimDir.x);
  const got = Math.atan2(h.vel.y, h.vel.x);
  let da = Math.abs(want - got) % (2 * Math.PI);
  if (da > Math.PI) da = 2 * Math.PI - da;
  assert.ok(da < 1e-9, 'dash direction == locked aimDir (' + da.toFixed(4) + ' rad off)');
});

test('hunter: dash is a straight line (collinear path over the dash)', () => {
  const field = new HunterField(new RNG(116));
  field.spawn({ x: 40, y: 0 });
  const h = field.hunters[0];
  h.pos.x = 12; h.pos.y = 4;
  h.state = 'orbit'; h.t = h.orbitDur;
  field.step(DT, { x: 5, y: 3 }, SHIP_AIM); // into the telegraph
  const pts = [];
  for (let i = 0; i < 55 && field.count > 0; i++) {
    field.step(DT, { x: 5, y: 3 }, SHIP_AIM);
    if (h.state === 'dash') pts.push({ x: h.pos.x, y: h.pos.y });
  }
  assert.ok(pts.length >= 3, 'captured at least 3 dash points');
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i].x - pts[0].x, ay = pts[i].y - pts[0].y;
    const bx = pts[i - 1].x - pts[0].x, by = pts[i - 1].y - pts[0].y;
    const cross = ax * by - ay * bx;
    assert.ok(Math.abs(cross) < 1e-6, 'dash is collinear at i=' + i + ' (cross ' + cross + ')');
  }
});

test('hunter: five-dash lifetime then fizzle (frees the slot)', () => {
  const field = new HunterField(new RNG(117));
  field.spawn({ x: 30, y: 30 });
  const h = field.hunters[0];
  const kinds = [];
  for (let i = 0; i < 4000 && field.count > 0; i++) {
    field.step(DT, { x: 30, y: 30 }, SHIP_AIM);
    for (const e of field.drainEvents()) kinds.push(e.kind);
  }
  assert.equal(field.count, 0, 'hunter fizzled out');
  assert.equal(h.chargesUsed, 5, 'exactly five dashes');
  assert.equal(kinds.filter(k => k === 'dash').length, 5, 'five dash events');
  assert.equal(kinds.filter(k => k === 'fizzle').length, 1, 'one fizzle event');
  const again = field.spawn({ x: 30, y: 30 });
  assert.ok(again, 'fizzle frees the slot');
});

test('hunter: world - bullet kill pays +300 and feeds the combo', () => {
  const w = new World(new RNG(118));
  w.begin();
  w.ship.invuln = 1e9;
  w.spawnHunterForWave(6);
  assert.equal(w.hunters.count, 1, 'spawned');
  const h = w.hunters.hunters[0];
  h.pos.x = 1; h.pos.y = 0;
  w.weapons.bullets.push({ id: 9300, pos: { x: 1, y: 0 }, radius: 2, dead: false });
  w.resolveBulletHunters();
  const evs = w.drainEvents();
  assert.equal(w.hunters.count, 0, 'hunter destroyed');
  const kill = evs.find(e => e.type === 'kill');
  assert.ok(kill, 'kill event');
  assert.equal(kill.data.size, 'hunter', 'size hunter');
  assert.equal(kill.data.points, 300, '300 base points');
  assert.equal(kill.data.combo, 1, 'feeds the combo');
  assert.ok(evs.find(e => e.type === 'hunterDeath'), 'hunterDeath FX event');
});

test('hunter: world - contact costs a life, NO score', () => {
  const w = new World(new RNG(119));
  w.begin();
  w.ship.invuln = 0;
  const scoreBefore = w.score;
  w.spawnHunterForWave(6);
  const h = w.hunters.hunters[0];
  h.pos.x = 0; h.pos.y = 0; // on top of the ship
  w.step(DT, NEUTRAL);
  const evs = w.drainEvents();
  assert.equal(w.hunters.count, 0, 'hunter destroyed on contact');
  assert.equal(w.lives, 2, 'life cost');
  assert.equal(w.score, scoreBefore, 'no score for contact');
  assert.ok(!evs.find(e => e.type === 'kill'), 'no kill event');
  const hit = evs.find(e => e.type === 'hit');
  assert.ok(hit, 'hit event');
  assert.equal(hit.data.lives, 2, 'hit event carries the life count');
});

test('hunter: world - first spawn of a run emits hunterSpawn (toast), later spawns stay quiet', () => {
  const w = new World(new RNG(120));
  startWave(w, 6);
  const evs6 = w.drainEvents();
  assert.ok(evs6.find(e => e.type === 'hunterSpawn'), 'first spawn emits hunterSpawn');
  w.waves.state = 'intermission';
  w.waves.intermission = 0.01;
  w.waves.wave = 6;
  w.step(DT, NEUTRAL); // into wave 7
  const evs7 = w.drainEvents();
  assert.equal(w.hunters.count, 2, 'second wave spawns a second hunter');
  assert.ok(!evs7.find(e => e.type === 'hunterSpawn'), 'no repeat callout in the same run');
});

test('hunter: determinism - same seed, same timeline (two field runs)', () => {
  const f1 = new HunterField(new RNG(121));
  const f2 = new HunterField(new RNG(121));
  f1.spawn({ x: 1, y: 2 });
  f2.spawn({ x: 1, y: 2 });
  const e1 = [], e2 = [];
  for (let i = 0; i < 2400; i++) {
    f1.step(DT, { x: 0, y: 0 }, SHIP_AIM);
    f2.step(DT, { x: 0, y: 0 }, SHIP_AIM);
    for (const e of f1.drainEvents()) e1.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f1.count)]);
    for (const e of f2.drainEvents()) e2.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f2.count)]);
  }
  assert.deepEqual(e1, e2, 'identical event timelines');
  assert.ok(e1.length > 0 && e1.some(e => e[0] === 'fizzle'), 'timeline reaches the fizzle');
});
