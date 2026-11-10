// ST-115: slow-mo power-up - enemy-side time scale on enemies/bullets, ship retains speed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;
const DUR = CONFIG.powerup.types.slowmo.dur;
const SCALE = CONFIG.powerup.types.slowmo.scale;

function runSeconds(w, seconds) {
  const frames = Math.round(seconds / DT);
  for (let i = 0; i < frames; i++) w.step(DT, NOINTENT);
}

test('slowmo: config has positive dur and scale in (0,1)', () => {
  const t = CONFIG.powerup.types.slowmo;
  assert.ok(t.dur > 0, 'dur positive');
  assert.ok(t.scale > 0 && t.scale < 1, 'scale in (0,1)');
});

test('slowmo: enemyScale is 1 with no active power-up', () => {
  const w = new World(new RNG(11));
  w.begin();
  assert.equal(w.enemyScale(), 1);
});

test('slowmo: apply activates the configured scale', () => {
  const w = new World(new RNG(11));
  w.begin();
  w.powerups.apply('slowmo');
  assert.ok(w.powerups.active('slowmo'));
  assert.equal(w.enemyScale(), SCALE);
});

test('slowmo: rocks move ~scale slower than in a normal run', () => {
  const a = new World(new RNG(12));
  a.begin();
  const ra = a.field.spawn('M', 1, { x: -20, y: 0 });
  ra.vel = v2(6, 0);
  runSeconds(a, 1);

  const b = new World(new RNG(12));
  b.begin();
  b.powerups.apply('slowmo');
  const rb = b.field.spawn('M', 1, { x: -20, y: 0 });
  rb.vel = v2(6, 0);
  runSeconds(b, 1);

  const dxA = ra.pos.x - -20;
  const dxB = rb.pos.x - -20;
  assert.ok(dxA > 0, 'reference rock moved');
  assert.ok(dxB > 0, 'scaled rock moved');
  assert.ok(Math.abs(dxB - dxA * SCALE) / dxA < 0.02, 'scaled ' + dxB + ' vs ref ' + dxA + ' x ' + SCALE);
});

test('slowmo: ship retains full speed (identical displacement)', () => {
  const intent = { thrust: v2(1, 0), aimPoint: null, firing: false };
  const a = new World(new RNG(13));
  a.begin();
  for (let i = 0; i < 60; i++) a.step(DT, intent);
  const b = new World(new RNG(13));
  b.begin();
  b.powerups.apply('slowmo');
  for (let i = 0; i < 60; i++) b.step(DT, intent);
  assert.ok(Math.abs(a.ship.pos.x - b.ship.pos.x) < 1e-9, 'ship x identical');
  assert.ok(Math.abs(a.ship.pos.y - b.ship.pos.y) < 1e-9, 'ship y identical');
});

test('slowmo: scale restores after the duration expires', () => {
  const w = new World(new RNG(14));
  w.begin();
  w.powerups.apply('slowmo');
  assert.equal(w.enemyScale(), SCALE);
  runSeconds(w, DUR + 0.2);
  assert.equal(w.powerups.active('slowmo'), false);
  assert.equal(w.enemyScale(), 1);
});

test('slowmo: re-pickup refreshes the timer (no stacking)', () => {
  const w = new World(new RNG(15));
  w.begin();
  w.powerups.apply('slowmo');
  runSeconds(w, 2);
  assert.ok(w.powerups.active('slowmo'));
  w.powerups.apply('slowmo');
  assert.equal(w.powerups.timeLeft.slowmo, DUR);
});
