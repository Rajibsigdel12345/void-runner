// ST-448 (E63): SENTRY - a mid-range aimed shooter (wave 11+, never on boss waves).
// Config rungs, juice rungs, wave gates, rim spawn, charge -> burst timing (exactly 3
// bolts, telegraph floor, burst gaps), 3-hit kill (+350, feeds combo), contact (life,
// no score), the once-per-run spawn toast, self-destruct, event kinds, and full
// field determinism (same seed + same inputs -> bit-identical event stream).
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { SentryField } from '../src/core/sentry.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;
const EPS = 1e-9;

test('sentry: config sanity', () => {
  const s = CONFIG.sentry;
  assert.equal(s.firstWave, 11, 'gate is wave 11');
  assert.equal(s.perWave, 2, 'two per wave');
  assert.equal(s.maxConcurrent, 2, 'cap two concurrent');
  assert.equal(s.hp, 3, 'three hits to kill');
  assert.equal(s.telegraph, 0.8, '0.8 s charge telegraph');
  assert.ok(s.telegraph >= 0.7, 'telegraph holds the F3 reaction floor');
  assert.equal(s.burstCount, 3, 'three bolts per burst');
  assert.equal(s.burstGap, 0.18, '0.18 s between bolts');
  assert.equal(s.boltSpeed, CONFIG.enemyBullets.speed, 'bolt speed matches the enemy bolt pool');
  assert.ok(s.prefRMin < s.prefRMax, 'orbit band sane');
  assert.ok(s.holdMin > 0 && s.holdMin < s.holdMax, 'hold window sane');
  assert.ok(s.fireMin > 0 && s.fireMin < s.fireMax, 'cooldown window sane');
  assert.equal(s.rimDist, 15, 'rim spawn 15 u from the ship');
  assert.equal(s.score, 350, 'kill reward 350');
  assert.ok(CONFIG.hunter.score < s.score && s.score < CONFIG.warden.score, '300 < 350 < 400 score rung');
});

test('sentry: juice rungs (shake 0.7, killPunch 0.28, shockwave 2.8)', () => {
  assert.equal(CONFIG.fx.shakeTable.sentryDeath, 0.7, 'shake rung 0.7');
  assert.ok(CONFIG.fx.shakeTable.flyerDeath < 0.7 && 0.7 < CONFIG.fx.shakeTable.wardenDeath, '0.65 < 0.7 < 0.8 ordering');
  assert.equal(CONFIG.fx.killPunch.sentry, 0.28, 'killPunch rung 0.28');
  assert.ok(CONFIG.fx.killPunch.flyer < 0.28 && 0.28 < CONFIG.fx.killPunch.gunship, '0.25 < 0.28 < 0.3 ordering');
  assert.equal(killPunchEnergy('sentry', false, CONFIG.fx.killPunch), 0.28, 'unboosted sentry punch');
  assert.equal(killPunchEnergy('sentry', true, CONFIG.fx.killPunch), CONFIG.fx.killPunch.max, 'overdrive 0.42 capped at the 0.3 max');
  assert.equal(CONFIG.fx.shockwave.classes.sentry, 2.8, 'shockwave class 2.8');
  assert.ok(CONFIG.fx.shockwave.classes.hunter < 2.8 && 2.8 < CONFIG.fx.shockwave.classes.warden, '2.2 < 2.8 < 3.0 ordering');
});

test('sentry: wave gates (none W10, two W11, cap holds W12, none on boss W15)', () => {
  const w = new World(new RNG(4811));
  w.begin();
  w.spawnSentryForWave(10);
  assert.equal(w.sentries.count, 0, 'no sentries at wave 10');
  w.spawnSentryForWave(11);
  assert.equal(w.sentries.count, 2, 'two sentries at wave 11');
  w.spawnSentryForWave(12);
  assert.equal(w.sentries.count, 2, 'cap 2 holds at wave 12 (deferred)');
  w.spawnSentryForWave(15);
  assert.equal(w.sentries.count, 2, 'boss wave 15 excluded');
});

test('sentry: rim spawn stays at least 15 u from the ship', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    const f = new SentryField(new RNG(seed));
    const shipPos = { x: 20, y: 0 };
    for (let i = 0; i < CONFIG.sentry.maxConcurrent; i++) {
      const q = f.spawn(shipPos);
      const d = Math.hypot(q.pos.x - shipPos.x, q.pos.y - shipPos.y);
      assert.ok(d >= CONFIG.sentry.rimDist - 1e-6, 'seed ' + seed + ' spawn ' + i + ' at ' + d.toFixed(3) + ' u');
    }
  }
});

/** Drive one sentry (ship parked at the origin) and record the charge + fire times. */
function runBurst(seed) {
  const f = new SentryField(new RNG(seed));
  const ship = { x: 0, y: 0 };
  f.spawn(ship);
  let t = 0;
  let chargeT = null;
  const fires = [];
  for (let i = 0; i < 60 * 60; i++) {
    t += DT;
    f.step(DT, ship);
    for (const e of f.drainEvents()) {
      if (e.kind === 'charge' && chargeT === null) chargeT = t;
      if (e.kind === 'fire') fires.push({ t, dir: { x: e.dir.x, y: e.dir.y }, pos: { x: e.pos.x, y: e.pos.y } });
    }
  }
  return { chargeT, fires };
}

test('sentry: charge then EXACTLY a 3-bolt burst (telegraph floor + gaps + dead-aimed middle)', () => {
  for (const seed of [1, 7, 42]) {
    const s = CONFIG.sentry;
    const { chargeT, fires } = runBurst(seed);
    assert.ok(chargeT !== null, 'seed ' + seed + ' charged');
    assert.ok(fires.length >= 3, 'seed ' + seed + ' fired at least the burst');
    assert.equal(fires[0].t - chargeT >= s.telegraph - 2 * DT - EPS, true, 'first bolt leaves after the full telegraph');
    assert.ok(Math.abs((fires[1].t - fires[0].t) - s.burstGap) <= 2 * DT + EPS, 'seed ' + seed + ' gap 1 ~ 0.18 s');
    assert.ok(Math.abs((fires[2].t - fires[1].t) - s.burstGap) <= 2 * DT + EPS, 'seed ' + seed + ' gap 2 ~ 0.18 s');
    // The third bolt of the burst is the last one: the next fire is a NEW burst after the cooldown.
    assert.ok(fires.length === 3 || fires[3].t - fires[2].t >= s.fireMin - 2 * DT, 'seed ' + seed + ' no fourth bolt in the same burst');
    // Middle bolt dead-aims at the ship (ship at the origin; the sentry is frozen while bursting).
    const mid = fires[1];
    const want = Math.atan2(-mid.pos.y, -mid.pos.x);
    const got = Math.atan2(mid.dir.y, mid.dir.x);
    let d = Math.abs(got - want);
    if (d > Math.PI) d = 2 * Math.PI - d;
    assert.ok(d < 0.02, 'seed ' + seed + ' middle bolt dead-aims at the ship');
  }
});

test('sentry: three hits to kill (two hit events, lethal is silent, field compacts)', () => {
  const f = new SentryField(new RNG(5));
  const q = f.spawn({ x: 0, y: 0 });
  f.step(DT, { x: 0, y: 0 });
  const h1 = f.hit(q.id);
  assert.ok(!h1.dead, 'survives hit 1');
  const h2 = f.hit(q.id);
  assert.ok(!h2.dead, 'survives hit 2');
  assert.equal(f.drainEvents().filter(e => e.kind === 'hit').length, 2, 'two hit events');
  const h3 = f.hit(q.id);
  assert.ok(h3.dead, 'dead on hit 3');
  assert.equal(f.drainEvents().filter(e => e.kind === 'hit').length, 0, 'the lethal hit emits no hit event');
  assert.equal(f.count, 0, 'field compacted');
});

test('sentry: world kill pays +350, feeds the combo, emits sentryDeath', () => {
  const w = new World(new RNG(4812));
  w.begin();
  w.spawnSentryForWave(11);
  const q = w.sentries.sentries[0];
  q.pos.x = 5; q.pos.y = 0;
  for (let i = 0; i < CONFIG.sentry.hp; i++) {
    w.weapons.bullets.push({ id: 9300 + i, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  }
  w.resolveBulletSentries();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'sentry', 'kill class sentry');
  assert.equal(kills[0].data.points, 350, '+350');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.equal(kills[0].data.multiplier, 1, 'fresh combo, x1');
  assert.ok(ev.some(e => e.type === 'sentryDeath' && e.data.self === false), 'sentryDeath (bullet kill)');
  assert.equal(ev.filter(e => e.type === 'sentryHit').length, 2, 'two sentryHit FX events');
  assert.equal(w.sentries.count, 1, 'the other sentry survives');
});

test('sentry: contact costs a life, no score, sentry destroyed', () => {
  const w = new World(new RNG(4813));
  w.begin();
  w.spawnSentryForWave(11);
  const q = w.sentries.sentries[0];
  q.pos.x = 0; q.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipSentries();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'sentryDeath' && e.data.self === false), 'sentryDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.sentries.count, 1, 'contact sentry destroyed, the other survives');
});

test('sentry: first spawn toasts once, later spawns stay quiet', () => {
  const w = new World(new RNG(4814));
  w.begin();
  w.spawnSentryForWave(11);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'sentrySpawn'), 'first spawn toasts');
  w.spawnSentryForWave(12);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'sentrySpawn'), 'second spawn is quiet');
});

test('sentry: maxAge self-destruct emits death(self) and leaves the field', () => {
  const f = new SentryField(new RNG(11));
  const q = f.spawn({ x: 0, y: 0 });
  q.age = CONFIG.sentry.maxAge - DT;
  f.step(DT, { x: 0, y: 0 });
  const ev = f.drainEvents();
  assert.ok(ev.some(e => e.kind === 'death' && e.self === true), 'self death event');
  assert.equal(f.count, 0, 'field empty');
});

test('sentry: field events are only hit/charge/fire/death', () => {
  const f = new SentryField(new RNG(9));
  f.spawn({ x: 0, y: 0 });
  const kinds = new Set();
  for (let i = 0; i < 900; i++) {
    f.step(DT, { x: 0, y: 0 });
    for (const e of f.drainEvents()) kinds.add(e.kind);
  }
  for (const k of kinds) assert.ok(['hit', 'charge', 'fire', 'death'].includes(k), 'unexpected kind ' + k);
  assert.ok(kinds.has('charge') && kinds.has('fire'), 'saw a charge and a fire in 15 s');
});

test('sentry: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const shipAt = (t) => ({ x: 5 * Math.sin(0.7 * t), y: 5 * Math.cos(0.5 * t) });
  const run = (seed) => {
    const f = new SentryField(new RNG(seed));
    let t = 0;
    f.spawn(shipAt(0));
    const out = [];
    for (let i = 0; i < 2400; i++) {
      t += DT;
      f.step(DT, shipAt(t));
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f.count)]);
    }
    return out;
  };
  const a = run(4815);
  const b = run(4815);
  assert.ok(a.length > 0, 'events actually occur in the window');
  assert.deepEqual(a, b, 'bit-identical event stream');
});
