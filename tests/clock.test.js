// ST-078: fixed-timestep frame clock - clamped dt, dropped backlog, resume reset.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/core/clock.js';

const STEP = 1 / 60;
const clock = () => createClock({ step: STEP, maxFrameDt: 0.25, maxSubsteps: 8 });

test('first tick baselines: zero steps, zero dt', () => {
  const c = clock();
  const r = c.tick(1000);
  assert.equal(r.steps, 0);
  assert.equal(r.dt, 0);
  assert.equal(r.clamped, false);
  assert.equal(r.dropped, false);
});

test('steady frame: one sim step per single ~20ms frame', () => {
  const c = clock();
  c.tick(0);
  const r = c.tick(20);
  assert.equal(r.steps, 1);
  assert.equal(r.clamped, false);
});

test('huge gap (tab switch): dt clamped to 0.25, steps capped at 8, backlog dropped', () => {
  const c = clock();
  c.tick(0);
  const r = c.tick(5000);
  assert.equal(r.dt, 0.25);
  assert.equal(r.clamped, true);
  assert.equal(r.steps, 8);
  assert.equal(r.dropped, true);
  assert.equal(r.backlog, 0);
});

test('negative dt (NTP clock correction): treated as zero, no steps', () => {
  const c = clock();
  c.tick(5000);
  const r = c.tick(1000);
  assert.equal(r.dt, 0);
  assert.equal(r.steps, 0);
  assert.equal(r.clamped, false);
});

test('reset discards pending backlog and baselines (resume path)', () => {
  const c = clock();
  c.tick(0);
  c.tick(2000); // backlog clamped + dropped
  c.reset(10000); // fresh baseline, as if unpausing
  const r = c.tick(10020); // first real frame after resume
  assert.equal(r.steps, 1); // no fast-forward from the pre-resume gap
});

test('state() exposes configuration + accumulator', () => {
  const c = clock();
  const s0 = c.state();
  assert.equal(s0.last, null);
  assert.equal(s0.acc, 0);
  assert.equal(s0.step, STEP);
  assert.equal(s0.maxFrameDt, 0.25);
  assert.equal(s0.maxSubsteps, 8);
  c.tick(0);
  assert.equal(c.state().last, 0);
});
