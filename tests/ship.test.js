// ST-005: ship core movement tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Ship } from '../src/core/ship.js';
import { v2, v2Len, angDiff } from '../src/core/math.js';
import { CONFIG } from '../src/core/config.js';

const DT = 1 / 60;

function stepMany(ship, n, thrust, aimPoint) {
  for (let i = 0; i < n; i++) ship.step(DT, thrust, aimPoint);
}

test('ship: speed capped at maxSpeed under sustained thrust', () => {
  const ship = new Ship();
  stepMany(ship, 60 * 10, v2(1, 0));
  assert.ok(ship.speed <= CONFIG.ship.maxSpeed + 1e-6, `speed ${ship.speed} exceeds cap`);
});

test('ship: velocity decays to ~0 when coasting', () => {
  const ship = new Ship();
  stepMany(ship, 30, v2(1, 0));
  const boosted = ship.speed;
  assert.ok(boosted > 1);
  stepMany(ship, 60 * 4, v2());
  assert.ok(ship.speed < 0.05, `coast speed ${ship.speed} not decayed`);
});

test('ship: position stays within arena (soft clamp)', () => {
  const ship = new Ship(20, 0);
  ship.vel = v2(14, 0);
  stepMany(ship, 60 * 5, v2(1, 0));
  const limit = CONFIG.arena.radius - CONFIG.ship.radius;
  assert.ok(v2Len(ship.pos) <= limit + 1e-6, `pos dist ${v2Len(ship.pos)} beyond ${limit}`);
});

test('ship: aim eases toward aim point (convergence)', () => {
  const ship = new Ship(0, 0);
  ship.aim = 0;
  stepMany(ship, 60 * 2, v2(), v2(10, 0)); // target angle = 0... pick a different start
  ship.aim = Math.PI; // face opposite
  stepMany(ship, 60 * 2, v2(), v2(10, 0));
  const err = Math.abs(angDiff(ship.aim, 0));
  assert.ok(err < 0.05, `aim error ${err} too large`);
});

test('ship: aim crosses the PI seam via shortest arc', () => {
  const ship = new Ship(0, 0);
  ship.aim = 3.0; // just below +PI
  const aimPoint = v2(10 * Math.cos(-3.0), 10 * Math.sin(-3.0)); // target angle -3.0 (just above -PI)
  const before = Math.abs(angDiff(ship.aim, -3.0));
  stepMany(ship, 60, v2(), aimPoint);
  assert.ok(ship.aim > Math.PI, `aim ${ship.aim} should cross +PI via the seam`);
  assert.ok(Math.abs(angDiff(ship.aim, -3.0)) < before, 'should converge along shortest arc');
});

test('ship: damage grants invulnerability window + knockback', () => {
  const ship = new Ship();
  stepMany(ship, 30, v2(1, 0));
  const before = ship.speed;
  ship.damage(v2(1, 0));
  assert.ok(ship.isInvulnerable);
  assert.ok(ship.speed >= before, 'knockback should not reduce speed when aligned');
  stepMany(ship, Math.ceil(CONFIG.ship.invulnTime / DT) + 2, v2());
  assert.ok(!ship.isInvulnerable, 'invuln should have expired');
});

test('ship: forward() matches aim direction', () => {
  const ship = new Ship();
  ship.aim = 0.7;
  const f = ship.forward(v2());
  assert.ok(Math.abs(f.x - Math.cos(0.7)) < 1e-9);
  assert.ok(Math.abs(f.y - Math.sin(0.7)) < 1e-9);
});

