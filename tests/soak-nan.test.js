// I43 (ST-043): NaN soak - an aggressive 5-minute simulation must never produce
// non-finite ship/score/rock state (QA plan R7). Deterministic under seeded RNG.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';

// The one intentional non-finite in the core: scoreKeeper.lastKillTime is
// -Infinity until the first kill (sentinel for "no kill yet", score.js).
const ALLOWED_INF = new Set(['w.scoreKeeper.lastKillTime']);

function nonFinite(w) {
  const bad = [];
  const seen = new Set();
  const walk = (o, p, depth) => {
    if (!o || typeof o !== 'object' || depth > 2 || seen.has(o)) return;
    seen.add(o);
    for (const [k, v] of Object.entries(o)) {
      const path = p + '.' + k;
      if (typeof v === 'number' && !Number.isFinite(v)) {
        // NaN is always a failure; Infinity is allowed only at documented sentinels.
        if (Number.isNaN(v) || !ALLOWED_INF.has(path)) bad.push(path + '=' + v);
      } else if (v && typeof v === 'object') walk(v, path, depth + 1);
    }
  };
  walk(w, 'w', 0);
  return bad;
}

test('world: 5-minute aggressive soak stays finite (no NaN/Inf)', () => {
  const w = new World(new RNG(20260113));
  w.begin();
  const rng = new RNG(777);
  const S = 1 / 60;
  const STEPS = 300 * 60; // 5 minutes of sim
  for (let i = 0; i < STEPS; i++) {
    // Aggressive intent: full-magnitude thrust sweeping the circle, aim flung
    // to the arena edges, burst fire. |thrust| <= 1 per the ship contract.
    const a = rng.next() * Math.PI * 2;
    w.step(S, {
      thrust: { x: Math.cos(a), y: Math.sin(a) },
      aimPoint: { x: (rng.next() * 2 - 1) * 30, y: (rng.next() * 2 - 1) * 30 },
      firing: rng.next() < 0.5,
    });
    w.drainEvents();
    if (w.gameOver) w.restart(); // let the soak run the full duration
    if (i % 600 === 0) {
      assert.deepEqual(nonFinite(w), [], 'non-finite state at t=' + (i / 60).toFixed(1) + 's');
    }
  }
  assert.deepEqual(nonFinite(w), [], 'final state finite');
});
