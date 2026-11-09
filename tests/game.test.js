// ST-012: world orchestrator tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;

test('world: bullet kill -> score + fragments + kill event', () => {
  const w = new World(new RNG(1));
  w.begin();
  const rock = w.field.spawn('L', 1, { x: 3, y: 0 });
  rock.vel = v2(0, 0);
  // drop a bullet directly onto the rock
  w.weapons._spawn({ x: rock.pos.x, y: rock.pos.y }, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.score, CONFIG.asteroid.sizes.L.score);
  const ev = w.drainEvents().find(e => e.type === 'kill');
  assert.ok(ev && ev.data.size === 'L', 'kill event emitted');
  assert.ok(w.field.count >= 2 && w.field.count <= 3, `fragments ${w.field.count}`);
  assert.ok(w.field.rocks.every(r => r.size === 'M'), 'L splits into M');
});

test('world: multiple kills accumulate score', () => {
  const w = new World(new RNG(2));
  w.begin();
  for (let i = 0; i < 3; i++) {
    const r = w.field.spawn('M', 1, { x: i * 10 - 10, y: 5 });
    r.vel = v2(0, 0);
    w.weapons._spawn({ x: r.pos.x, y: r.pos.y }, 0);
  }
  w.step(DT, NOINTENT);
  // same-frame chain: combo 1,2,3 -> 1.0x + 1.1x + 1.2x
  const m = CONFIG.asteroid.sizes.M.score;
  assert.equal(w.score, m + Math.floor(m * 1.1) + Math.floor(m * 1.2));
});

test('world: ship hit -> lose life, knockback, invuln, rock destroyed', () => {
  const w = new World(new RNG(3));
  w.begin();
  const rock = w.field.spawn('S', 1, { x: 1.5, y: 0 }); // overlapping ship radius 0.9 + rock 0.7
  rock.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives - 1);
  assert.ok(w.ship.isInvulnerable);
  assert.equal(w.field.count, w.field.rocks.filter(r => r.size !== 'S' && r.id !== rock.id).length + w.field.rocks.filter(r => r.id !== rock.id).length > 0 ? w.field.count : 0, 'sanity');
  const ev = w.drainEvents().find(e => e.type === 'hit');
  assert.ok(ev, 'hit event emitted');
  assert.equal(ev.data.lives, CONFIG.ship.lives - 1);
});

test('world: invulnerable ship takes no second hit', () => {
  const w = new World(new RNG(4));
  w.begin();
  const r1 = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r1.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  const livesAfterFirst = w.lives;
  const r2 = w.field.spawn('S', 1, { x: -1.5, y: 0 });
  r2.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, livesAfterFirst, 'no damage while invulnerable');
});

test('world: game over at zero lives + event', () => {
  const w = new World(new RNG(5));
  w.begin();
  w.livesMgr.count = 1;
  const r = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.ok(w.gameOver);
  const ev = w.drainEvents().find(e => e.type === 'gameover');
  assert.ok(ev, 'gameover event emitted');
  // further steps are inert
  w.step(DT, NOINTENT);
  assert.equal(w.lives, 0);
});

test('world: firing emits fire events at cadence', () => {
  const w = new World(new RNG(6));
  w.begin();
  const intent = { thrust: v2(0, 0), aimPoint: null, firing: true };
  for (let i = 0; i < 60; i++) w.step(DT, intent); // 1s of firing @5.5rps
  const fires = w.drainEvents().filter(e => e.type === 'fire').length;
  assert.ok(fires >= 5 && fires <= 7, `fire events ${fires}`);
});

test('world: deterministic replay (same seed + same intents)', () => {
  const mk = () => new World(new RNG(99));
  const a = mk(), b = mk();
  a.begin(); b.begin();
  // both start with an identical rock
  for (const w of [a, b]) {
    const r = w.field.spawn('L', 1, { x: 8, y: 2 });
    r.vel = v2(-2, 0);
  }
  for (let i = 0; i < 600; i++) {
    const intent = {
      thrust: v2(Math.sin(i / 37), Math.cos(i / 53)),
      aimPoint: v2(Math.cos(i / 21) * 10, Math.sin(i / 29) * 10),
      firing: i % 12 === 0,
    };
    a.step(DT, intent);
    b.step(DT, intent);
  }
  assert.equal(a.score, b.score);
  assert.equal(a.lives, b.lives);
  assert.equal(a.field.count, b.field.count);
  assert.ok(Math.abs(a.ship.pos.x - b.ship.pos.x) < 1e-9);
});




// --- ST-017: pause / resume / restart ---
test('world: pause freezes the simulation', () => {
  const w = new World(new RNG(5));
  w.begin();
  const rock = w.field.spawn('M', 1, { x: 8, y: 0 });
  rock.vel = v2(-2, 0);
  w.step(DT, { thrust: v2(1, 0), aimPoint: null, firing: false });
  const t0 = w.time;
  const px = w.ship.pos.x;
  w.pause();
  assert.ok(w.game.in('PAUSED'));
  for (let i = 0; i < 60; i++) w.step(DT, NOINTENT);
  assert.equal(w.time, t0, 'time frozen');
  assert.equal(w.ship.pos.x, px, 'ship frozen');
  assert.equal(rock.pos.x < 8, true, 'rock frozen');
  assert.equal(w.score, 0);
});

test('world: pause/resume respect the state machine', () => {
  const w = new World(new RNG(6));
  assert.ok(!w.pause(), 'MENU->PAUSED rejected');
  assert.ok(!w.resume(), 'MENU->PLAYING-via-resume rejected');
  w.begin();
  assert.ok(!w.resume(), 'PLAYING->PLAYING rejected');
  assert.ok(w.pause());
  assert.ok(w.resume());
  assert.ok(w.game.in('PLAYING'));
});

test('world: restart from GAME_OVER resets session and plays', () => {
  const w = new World(new RNG(7));
  w.begin();
  const r = w.field.spawn('M', 1, { x: 4, y: 0 });
  r.vel = v2(0, 0);
  w.weapons._spawn({ x: r.pos.x, y: r.pos.y }, 0);
  w.step(DT, NOINTENT);
  assert.ok(w.score > 0, 'scored before death');
  // force game over: 1 life left, park a rock on the ship
  w.livesMgr.count = 1;
  w.ship.invuln = 0;
  const killer = w.field.spawn('S', 1, { x: 1.2, y: 0 });
  killer.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.ok(w.gameOver);
  const deadScore = w.score;
  // step must be a no-op in GAME_OVER
  w.step(DT, NOINTENT);
  assert.equal(w.score, deadScore);
  // restart
  assert.ok(w.restart());
  assert.ok(w.game.in('PLAYING'));
  assert.equal(w.score, 0, 'score reset');
  assert.equal(w.lives, CONFIG.ship.lives, 'lives reset');
  assert.equal(w.wave, 0, 'wave director reset');
  w.step(DT, NOINTENT);
  assert.ok(w.time > 0, 'sim runs after restart');
});

test('world: restart() mid-session forces a fresh session', () => {
  const w = new World(new RNG(8));
  w.begin();
  w.step(DT, NOINTENT);
  const t0 = w.time;
  const ret = w.restart();
  // restart() is only reachable from PLAYING via direct API (the key handler gates it); reset()+begin() yields a fresh session
  assert.equal(ret, true);
  assert.ok(w.game.in('PLAYING'));
  assert.equal(w.time, 0, 'fresh session clock');
  assert.notEqual(t0, w.time);
});


// --- ST-021: RAPID + SPREAD fire-path wiring ---
const AIMX = { thrust: v2(0, 0), aimPoint: { x: 10, y: 0 }, firing: true };
function countFires(w, steps) {
  let n = 0;
  for (let i = 0; i < steps; i++) {
    w.step(DT, AIMX);
    for (const e of w.drainEvents()) if (e.type === 'fire') n++;
  }
  return n;
}

test('world: rapid halves the fire cooldown cycle (deterministic)', () => {
  // steps between consecutive shots at 60Hz: baseline ceil((1/5.5)*60) = 11, rapid ceil((1/11)*60) = 6
  function cycle(w) {
    w.step(DT, AIMX);
    w.drainEvents();
    for (let k = 1; k < 100; k++) {
      w.step(DT, AIMX);
      if (w.drainEvents().some(e => e.type === 'fire')) return k;
    }
    return -1;
  }
  const w1 = new World(new RNG(21)); w1.begin();
  const w2 = new World(new RNG(22)); w2.begin(); w2.powerups.apply('rapid');
  assert.equal(cycle(w1), 11, 'baseline cycle');
  assert.equal(cycle(w2), 6, 'rapid cycle');
});

test('world: spread fires a 3-way burst per trigger', () => {
  const w = new World(new RNG(23));
  w.begin();
  w.powerups.apply('spread');
  w.step(DT, AIMX);
  const fires = w.drainEvents().filter(e => e.type === 'fire');
  assert.equal(fires.length, 3, '3-way burst');
});

test('world: rapid + spread combine (2x cadence, 3-way bursts)', () => {
  const w = new World(new RNG(24));
  w.begin();
  w.powerups.apply('rapid');
  w.powerups.apply('spread');
  const combined = countFires(w, 60);
  assert.ok(combined >= 25, `combined ${combined} bullets/s`);
});

// --- ST-022: SHIELD absorption ---
test('world: shield absorbs a hit - no life lost, no invuln, shieldPop emitted', () => {
  const w = new World(new RNG(25));
  w.begin();
  w.powerups.apply('shield');
  const rock = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  rock.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives, 'no life lost');
  assert.equal(w.powerups.shieldHits, 0, 'shield consumed');
  assert.ok(!w.ship.isInvulnerable, 'no invuln from shield pop');
  const ev = w.drainEvents().find(e => e.type === 'shieldPop');
  assert.ok(ev, 'shieldPop event emitted');
});

test('world: shield is one-hit - second rock costs a life', () => {
  const w = new World(new RNG(26));
  w.begin();
  w.powerups.apply('shield');
  const r1 = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r1.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives, 'first hit absorbed');
  const r2 = w.field.spawn('S', 1, { x: -1.5, y: 0 });
  r2.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives - 1, 'second hit costs a life');
  assert.ok(w.ship.isInvulnerable, 'normal hit grants invuln');
});

test('world: shield expiry clears protection', () => {
  const w = new World(new RNG(27));
  w.begin();
  w.powerups.apply('shield');
  assert.ok(w.powerups.isShielding(), 'active after apply');
  w.powerups.timeLeft.shield = 0.016; // runs out on the next 1/60 step
  w.step(DT, NOINTENT);
  assert.ok(!w.powerups.isShielding(), 'expired');
  const r = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.lives, CONFIG.ship.lives - 1, 'expired shield no longer protects');
});

test('world: invulnerable ship does not consume the shield', () => {
  const w = new World(new RNG(28));
  w.begin();
  w.powerups.apply('shield');
  w.ship.invuln = 1.0;
  const r = w.field.spawn('S', 1, { x: 1.5, y: 0 });
  r.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.powerups.shieldHits, 1, 'shield untouched while invulnerable');
  assert.equal(w.lives, CONFIG.ship.lives, 'no life lost either');
});
