// I213: engine trail emitter (ST-213, cgs-dev-story). Pure-logic unit tests
// for the deterministic accumulator in src/core/engineTrail.js: gate
// (active/thrust) behavior, long-run emission rate, dt-clamp overflow
// bounding, and reset.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineTrail } from '../src/core/engineTrail.js';

const cfg = { rate: 14, minThrust: 0.12, dtMax: 0.25, maxPerUpdate: 4 };

test('silent when inactive, even at full thrust', () => {
  const t = createEngineTrail(cfg);
  for (let i = 0; i < 10; i++) assert.equal(t.update(0.1, 1, false), 0);
  assert.equal(t.get(), 0);
});

test('silent below minThrust and drains the accumulator', () => {
  const t = createEngineTrail(cfg);
  t.update(0.1, 1, true); // build up acc
  assert.ok(t.get() > 0);
  for (let i = 0; i < 3; i++) assert.equal(t.update(0.1, 0.05, true), 0);
  assert.equal(t.get(), 0); // gate off drains
});

test('long-run rate matches cfg.rate at full thrust', () => {
  const t = createEngineTrail(cfg);
  let total = 0;
  const steps = 600; // 10 s at 60 fps
  for (let i = 0; i < steps; i++) total += t.update(1 / 60, 1, true);
  assert.equal(total, 140); // exactly 10 s * 14 puffs/s
});

test('giant dt is clamped and emissions capped per update', () => {
  const t = createEngineTrail(cfg);
  const n = t.update(5, 1, true); // tab-restore frame
  assert.ok(n >= 1 && n <= cfg.maxPerUpdate);
  assert.ok(t.get() >= 0 && t.get() <= 1); // accumulator stays bounded
  // and the next normal frame behaves (no runaway burst)
  assert.ok(t.update(1 / 60, 1, true) <= 1);
});

test('reset clears the accumulator', () => {
  const t = createEngineTrail(cfg);
  t.update(0.1, 1, true);
  t.reset();
  assert.equal(t.get(), 0);
});
