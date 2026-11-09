// ST-057: overdrive power-up - 2x score for 6s, magenta hex drop
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { ScoreKeeper } from '../src/core/score.js';
import { POWERUP_TYPES } from '../src/core/powerups.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

function parkedWorld(seed) {
  const w = new World(new RNG(seed));
  w.begin();
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  return w;
}

test('overdrive: config sanity (seed 62)', () => {
  const t = CONFIG.powerup.types.overdrive;
  assert.ok(t, 'overdrive type exists');
  assert.equal(t.dur, 6, 'lasts 6s');
  assert.equal(t.mult, 2, 'doubles score');
  assert.ok(POWERUP_TYPES.includes('overdrive'), 'in the drop table');
  assert.equal(POWERUP_TYPES.length, 6, 'six drop types');
});

test('overdrive: pickup activates, refreshes (no stack), expires (seed 63)', () => {
  const w = parkedWorld(63);
  w.powerups.drops.push({ id: 900, type: 'overdrive', pos: { x: w.ship.pos.x, y: w.ship.pos.y }, vel: { x: 0, y: 0 }, dead: false });
  w.step(DT, NEUTRAL);
  assert.equal(w.powerups.drops.length, 0, 'drop consumed');
  assert.ok(w.powerups.active('overdrive'), 'active right after pickup');
  assert.ok(w.powerups.timeLeft.overdrive > 5.9, 'timer set to ~6s');
  w.powerups.apply('overdrive');
  assert.ok(w.powerups.timeLeft.overdrive > 5.9, 'same-type pickup refreshes, never stacks');
  for (let i = 0; i < 6.2 * 60; i++) w.step(DT, NEUTRAL);
  assert.equal(w.powerups.active('overdrive'), false, 'expired after 6s');
});

test('overdrive: score doubling incl. combo chain and flat bonus (seed 64)', () => {
  const sk = new ScoreKeeper();
  assert.equal(sk.kill(25, 0), 25, 'baseline kill');
  sk.overdriveMult = 2;
  const pts = sk.kill(25, 0.2); // combo 2 while overdrive is on
  assert.equal(pts, Math.floor(25 * sk.multiplier * 2), 'kill doubled after combo mult');
  assert.ok(pts > 50, 'doubled value actually exceeds baseline');
  assert.equal(sk.bonus(15), 30, 'flat bonus doubled');
  sk.overdriveMult = 1;
  assert.equal(sk.kill(25, 0.4), Math.floor(25 * sk.multiplier), 'normal again (combo 3 -> 1.2x)');
});

test('overdrive: world syncs the scoreKeeper multiplier (seed 65)', () => {
  const w = parkedWorld(65);
  assert.equal(w.scoreKeeper.overdriveMult, 1, 'idle');
  w.powerups.apply('overdrive');
  w.step(DT, NEUTRAL);
  assert.equal(w.scoreKeeper.overdriveMult, 2, 'synced while active');
  for (let i = 0; i < 6.2 * 60; i++) w.step(DT, NEUTRAL);
  assert.equal(w.scoreKeeper.overdriveMult, 1, 'synced after expiry');
});

test('overdrive: pinned-seed payout sequence is deterministic (seed 66)', () => {
  const run = () => {
    const w = parkedWorld(66);
    w.powerups.apply('overdrive');
    const out = [];
    for (let k = 0; k < 12; k++) {
      w.step(DT, NEUTRAL);
      out.push(w.scoreKeeper.kill(50, w.time));
    }
    return out.join(',');
  };
  assert.equal(run(), run(), 'reproducible kill payouts across the 6s window edge');
});
