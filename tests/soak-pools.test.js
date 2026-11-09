// ST-077: 10-minute headless soak - no NaN/Inf AND every pool stays inside its
// configured cap for the whole run (no slow leaks across waves/bosses/restarts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';

// Same documented sentinel as soak-nan (I43): -Infinity until the first kill.
const ALLOWED_INF = new Set(['w.scoreKeeper.lastKillTime']);

function nonFinite(w) {
  const bad = [];
  const seen = new Set();
  const walk = (o, path, depth) => {
    if (!o || typeof o !== 'object' || depth > 2 || seen.has(o)) return;
    seen.add(o);
    for (const [k, v] of Object.entries(o)) {
      const p2 = path + '.' + k;
      if (typeof v === 'number' && !Number.isFinite(v)) {
        if (Number.isNaN(v) || !ALLOWED_INF.has(p2)) bad.push(p2 + '=' + v);
      } else if (v && typeof v === 'object') walk(v, p2, depth + 1);
    }
  };
  walk(w, 'w', 0);
  return bad;
}

test('world: 10-minute aggressive soak - finite state + bounded pools (ST-077)', () => {
  const w = new World(new RNG(0x504b));
  w.begin();
  const rng = new RNG(4242);
  const S = 1 / 60;
  const STEPS = 600 * 60; // 10 minutes of sim
  const caps = {
    rocks: CONFIG.asteroid.maxConcurrent,
    bullets: CONFIG.weapon.maxBullets,
    eb: CONFIG.enemyBullets.maxConcurrent,
    mines: CONFIG.mine.maxConcurrent,
    drops: CONFIG.powerup.maxActiveDrops
  };
  const peaks = { rocks: 0, bullets: 0, eb: 0, mines: 0, drops: 0 };
  let totalKills = 0;
  let peakWave = 0;
  let restarts = 0;
  for (let i = 0; i < STEPS; i++) {
    const a = rng.next() * Math.PI * 2;
    w.step(S, {
      thrust: { x: Math.cos(a), y: Math.sin(a) },
      aimPoint: { x: (rng.next() * 2 - 1) * 30, y: (rng.next() * 2 - 1) * 30 },
      firing: rng.next() < 0.5
    });
    w.drainEvents();
    if (w.gameOver) { totalKills += w.scoreKeeper.kills; peakWave = Math.max(peakWave, w.wave); w.restart(); restarts++; }
    if (i % 300 === 0) {
      assert.deepEqual(nonFinite(w), [], 'non-finite state at t=' + (i / 60).toFixed(1) + 's');
      peaks.rocks = Math.max(peaks.rocks, w.field.rocks.length);
      peaks.bullets = Math.max(peaks.bullets, w.weapons.bullets.length);
      peaks.eb = Math.max(peaks.eb, w.enemyBullets.bullets.length);
      peaks.mines = Math.max(peaks.mines, w.mines.mines.length);
      peaks.drops = Math.max(peaks.drops, w.powerups.drops.length);
      assert.ok(w.field.rocks.length <= caps.rocks, 'rocks ' + w.field.rocks.length + ' > cap ' + caps.rocks + ' at t=' + (i / 60).toFixed(0) + 's');
      assert.ok(w.weapons.bullets.length <= caps.bullets, 'bullets over cap at t=' + (i / 60).toFixed(0) + 's');
      assert.ok(w.enemyBullets.bullets.length <= caps.eb, 'enemy bullets over cap at t=' + (i / 60).toFixed(0) + 's');
      assert.ok(w.mines.mines.length <= caps.mines, 'mines over cap at t=' + (i / 60).toFixed(0) + 's');
      assert.ok(w.powerups.drops.length <= caps.drops, 'drops over cap at t=' + (i / 60).toFixed(0) + 's');
      assert.equal(w.events.length, 0, 'live event buffer must be clear after drain');
    }
  }
  assert.deepEqual(nonFinite(w), [], 'final state finite');
  // the soak must have exercised real content (not a degenerate frozen run):
  totalKills += w.scoreKeeper.kills;
  peakWave = Math.max(peakWave, w.wave);
  assert.ok(restarts >= 1, 'run died and restarted at least once (soak covered full lives)');
  assert.ok(peakWave >= 3, `peak wave reached ${peakWave}`);
  assert.ok(totalKills >= 100, `total kills ${totalKills} across the soak`);
  console.log('soak peaks:', JSON.stringify(peaks), 'caps:', JSON.stringify(caps), 'restarts:', restarts, 'peakWave:', peakWave, 'totalKills:', totalKills);
  assert.ok(peaks.rocks <= caps.rocks && peaks.bullets <= caps.bullets && peaks.eb <= caps.eb && peaks.mines <= caps.mines && peaks.drops <= caps.drops, 'peaks within caps');
});
