// ST-074: pool/memory audit regression tests - hot paths keep object identity
// (no per-frame allocations): drops compact in place, drainEvents reuses its buffer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { PowerUpField } from '../src/core/powerups.js';
import { RNG } from '../src/core/rng.js';

test('powerups: dead drops are removed in place (array identity kept)', () => {
  const field = new PowerUpField(new RNG(7));
  field.drops.push({ id: 1, type: "rapid", pos: { x: 10, y: 0 }, vel: { x: 0, y: 0 }, dead: false });
  field.drops.push({ id: 2, type: "spread", pos: { x: 5, y: 0 }, vel: { x: 0, y: 0 }, dead: true });
  const arrBefore = field.drops;
  const ship = { pos: { x: 0, y: 0 } };
  const pickups = field.step(1 / 60, ship);
  assert.equal(pickups.length, 0);
  assert.equal(field.drops, arrBefore); // same array object - no reassignment (ST-074)
  assert.equal(field.drops.length, 1);
  assert.equal(field.drops[0].id, 1);
});

test('powerups: step with no dead drops leaves the array untouched', () => {
  const field = new PowerUpField(new RNG(7));
  field.drops.push({ id: 1, type: "rapid", pos: { x: 10, y: 0 }, vel: { x: 0, y: 0 }, dead: false });
  const arrBefore = field.drops;
  field.step(1 / 60, { pos: { x: 0, y: 0 } });
  field.step(1 / 60, { pos: { x: 0, y: 0 } });
  assert.equal(field.drops, arrBefore);
  assert.equal(field.drops.length, 1);
});

test('drainEvents: returns the collected events and clears the live buffer', () => {
  const w = new World(new RNG(42));
  w.emit("test", { n: 1 });
  const b = w.drainEvents();
  assert.equal(b.length, 1);
  assert.equal(b[0].type, "test");
  assert.equal(w.events.length, 0); // live buffer clear
  assert.equal(w.drainEvents().length, 0);
});

test('drainEvents: steady state alternates two pre-allocated buffers (no per-tick array)', () => {
  const w = new World(new RNG(42));
  const a = w.drainEvents();
  w.emit("t1", {});
  const b = w.drainEvents();
  w.emit("t2", {});
  const c = w.drainEvents();
  assert.notEqual(a, b);
  assert.equal(c, a); // buffer reuse - zero allocations in steady state (ST-074)
  assert.equal(c[0].type, "t2");
});
