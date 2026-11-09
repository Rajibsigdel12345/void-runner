// ST-011: collision tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { circlesHit, bulletHitRock, shipHitRock } from '../src/core/collision.js';
import { v2 } from '../src/core/math.js';

const rock = (x, y, radius, dead = false, id = 1) => ({ id, pos: v2(x, y), radius, dead });

test('collision: hit when overlapping', () => {
  assert.ok(circlesHit(0, 0, 1, 1.5, 0, 1));
});

test('collision: miss when apart', () => {
  assert.ok(!circlesHit(0, 0, 1, 3, 0, 1));
});

test('collision: exact touch counts as hit', () => {
  assert.ok(circlesHit(0, 0, 1, 2, 0, 1));
  assert.ok(!circlesHit(0, 0, 1, 2.0001, 0, 1));
});

test('collision: zero-radius point vs circle', () => {
  assert.ok(circlesHit(0, 0, 0, 0.5, 0, 1));
  assert.ok(!circlesHit(0, 0, 0, 2, 0, 1));
});

test('bulletHitRock: returns first hit id, skips dead', () => {
  const rocks = [rock(5, 0, 1, true, 7), rock(10, 0, 1, false, 9)];
  assert.equal(bulletHitRock(9.5, 0, 0.2, rocks), 9);
  assert.equal(bulletHitRock(0, 0, 0.2, rocks), null);
});

test('shipHitRock: returns knock direction away from rock', () => {
  const rocks = [rock(-5, 0, 1)];
  const hit = shipHitRock(-4, 0, 0.9, rocks);
  assert.ok(hit);
  assert.ok(Math.abs(hit.nx - 1) < 1e-9 && Math.abs(hit.ny) < 1e-9, `knock ${hit.nx},${hit.ny}`);
  assert.equal(shipHitRock(0, 0, 0.9, rocks), null);
});
