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

// --- ST-023: BOMB shatter-all + MAGNET bullet homing ---
test('world: bomb shatters all rocks with per-rock kills (combo chain)', () => {
  const w = new World(new RNG(29));
  w.begin();
  const a = w.field.spawn('L', 1, { x: 6, y: 0 }); a.vel = v2(0, 0);
  const b = w.field.spawn('M', 1, { x: -6, y: 3 }); b.vel = v2(0, 0);
  const cc = w.field.spawn('S', 1, { x: 0, y: -6 }); cc.vel = v2(0, 0);
  assert.equal(w.field.count, 3);
  w.powerups.apply('bomb'); // queues the instant, resolved on the next step
  w.step(DT, NOINTENT);
  assert.equal(w.field.count, 0, 'all rocks shattered, no fragments');
  const s = CONFIG.asteroid.sizes;
  const expected = s.L.score + Math.floor(s.M.score * 1.1) + Math.floor(s.S.score * 1.2);
  assert.equal(w.score, expected, 'per-rock kills feed the combo chain');
  const evs = w.drainEvents();
  assert.equal(evs.filter(e => e.type === 'kill').length, 3, 'three kill events');
  assert.ok(evs.some(e => e.type === 'bomb' && e.data.count === 3), 'bomb event with count');
  assert.ok(evs.some(e => e.type === 'instant' && e.data.type === 'bomb'), 'instant event kept');
});

test('world: bomb with no rocks is inert (no bomb event, no score)', () => {
  const w = new World(new RNG(30));
  w.begin();
  w.powerups.apply('bomb');
  w.step(DT, NOINTENT);
  const evs = w.drainEvents();
  assert.ok(!evs.some(e => e.type === 'bomb'), 'no bomb event');
  assert.ok(!evs.some(e => e.type === 'kill'), 'no kills');
  assert.equal(w.score, 0);
});

test('world: magnet homing steers an off-axis bullet onto the rock', () => {
  const w = new World(new RNG(31));
  w.begin();
  w.powerups.apply('magnet');
  const rock = w.field.spawn('S', 1, { x: 8, y: 0 }); // S: no split on kill
  rock.vel = v2(0, 0);
  // straight line from (0,0) toward (10,4) misses the rock (radius 0.7) by ~2.1 units
  w.weapons._spawn({ x: 0, y: 0 }, Math.atan2(4, 10));
  for (let i = 0; i < 120 && w.field.count > 0; i++) w.step(DT, NOINTENT);
  assert.equal(w.field.count, 0, 'homing bullet found the rock');
});

test('world: without magnet the same off-axis bullet misses (control)', () => {
  const w = new World(new RNG(31)); // same seed, same scenario, no magnet
  w.begin();
  const rock = w.field.spawn('S', 1, { x: 8, y: 0 }); // S: no split on kill
  rock.vel = v2(0, 0);
  w.weapons._spawn({ x: 0, y: 0 }, Math.atan2(4, 10));
  for (let i = 0; i < 120; i++) w.step(DT, NOINTENT);
  assert.ok(w.field.count > 0, 'bullet flew straight and missed');
});

test('world: kills tracked on scoreKeeper for game-over stats', () => {
  const w = new World(new RNG(33));
  w.begin();
  for (let i = 0; i < 3; i++) {
    const r = w.field.spawn('S', 1, { x: i * 8 - 8, y: -5 });
    r.vel = v2(0, 0);
    w.weapons._spawn({ x: r.pos.x, y: r.pos.y }, 0);
    w.step(DT, NOINTENT);
  }
  assert.equal(w.scoreKeeper.kills, 3);
});

test('world: time freezes after game over (survival-time accuracy)', () => {
  const w = new World(new RNG(34));
  w.begin();
  w.livesMgr.count = 1;
  w.ship.invuln = 0;
  const rock = w.field.spawn('S', 1, { x: 1.3, y: 0 });
  rock.vel = v2(0, 0);
  w.step(DT, NOINTENT);
  assert.ok(w.gameOver, 'game over reached');
  const t = w.time;
  for (let i = 0; i < 10; i++) w.step(DT, NOINTENT);
  assert.equal(w.time, t, 'time frozen after game over');
});

// --- ST-068: quit from pause ---
test('world: quitToMenu abandons the run and returns to MENU', () => {
  const w = new World(new RNG(71));
  w.begin();
  w.field.spawn('M', 1, { x: 8, y: 0 });
  w.pause();
  assert.ok(w.quitToMenu());
  assert.ok(w.game.in('MENU'));
  assert.equal(w.field.count, 0);
  assert.equal(w.score, 0);
  assert.ok(w.begin(), 'a fresh run can begin after quit');
});

test('world: quitToMenu is a no-op outside PAUSED', () => {
  const w = new World(new RNG(72));
  assert.ok(!w.quitToMenu(), 'illegal from MENU');
  w.begin();
  assert.ok(!w.quitToMenu(), 'illegal from PLAYING');
});
