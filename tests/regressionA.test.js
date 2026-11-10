// ST-148: regression round A (node side) - extended soak under full E8C load.
// Three long-horizon runs against the pure core (DOM-free, three-free):
//   1. 20-wave invuln auto-fire soak with per-60s invariant checkpoints
//      (NaN scan, pool caps, belt growth, boss/warden contracts).
//   2. Bit-identical determinism of the same soak across two fresh runs.
//   3. Kamikaze-ship natural death -> single gameover event -> restart reset.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';

const DT = 1 / 60;

// --- intents ------------------------------------------------------------------

// Canonical good pilot (same contract as tests/determinism.test.js): oscillating
// thrust, always firing, aim at the nearest live rock. Aim is derived from world
// state, so identical state => identical intent => true replay.
function intentFor(w, i) {
  let nearest = null;
  let best = Infinity;
  for (const r of w.field.rocks) {
    if (r.dead) continue;
    const dx = r.pos.x - w.ship.pos.x;
    const dy = r.pos.y - w.ship.pos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) { best = d2; nearest = r; }
  }
  return {
    thrust: { x: Math.cos(i * 0.013) * 0.8, y: Math.sin(i * 0.011) * 0.8 },
    aimPoint: nearest ? { x: nearest.pos.x, y: nearest.pos.y } : null,
    firing: true
  };
}

// Kamikaze pilot for the death test: full-thrust dive at the nearest live rock,
// firing into it. Deterministic state => deterministic dive => eventual death.
function kamikazeIntent(w, i) {
  let nearest = null;
  let best = Infinity;
  for (const r of w.field.rocks) {
    if (r.dead) continue;
    const dx = r.pos.x - w.ship.pos.x;
    const dy = r.pos.y - w.ship.pos.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) { best = d2; nearest = r; }
  }
  if (!nearest) return { thrust: { x: 0.5, y: 0.5 }, aimPoint: null, firing: true };
  const d = Math.sqrt(best);
  return {
    thrust: { x: (nearest.pos.x - w.ship.pos.x) / d, y: (nearest.pos.y - w.ship.pos.y) / d },
    aimPoint: { x: nearest.pos.x, y: nearest.pos.y },
    firing: true
  };
}

// --- plain state extraction (no world refs, no cycles) -------------------------

function stateForScan(w) {
  return {
    time: w.time,
    state: w.game.state,
    ship: { x: w.ship.pos.x, y: w.ship.pos.y, vx: w.ship.vel.x, vy: w.ship.vel.y, aim: w.ship.aim, invuln: w.ship.invuln },
    waves: { state: w.waves.state, wave: w.waves.wave, waveElapsed: w.waves.waveElapsed, intermission: w.waves.intermission, toSpawn: w.waves.toSpawn },
    sk: { score: w.scoreKeeper.score, kills: w.scoreKeeper.kills, combo: w.scoreKeeper.combo, maxCombo: w.scoreKeeper.maxCombo },
    lives: w.livesMgr.count,
    rocks: w.field.rocks.map((r) => ({ x: r.pos.x, y: r.pos.y, vx: r.vel.x, vy: r.vel.y, spin: r.spin, rot: r.rot })),
    drones: w.drones.drones.filter((d) => !d.dead).map((d) => ({ x: d.pos.x, y: d.pos.y, vx: d.vel.x, vy: d.vel.y })),
    mines: w.mines.mines.filter((m) => !m.dead).map((m) => ({ x: m.pos.x, y: m.pos.y, vx: m.vel.x, vy: m.vel.y })),
    eb: w.enemyBullets.bullets.filter((b) => !b.dead).map((b) => ({ x: b.pos.x, y: b.pos.y, vx: b.vel.x, vy: b.vel.y })),
    bullets: w.weapons.bullets.filter((b) => !b.dead).map((b) => ({ x: b.pos.x, y: b.pos.y })),
    drops: w.powerups.drops.map((d) => ({ x: d.pos.x, y: d.pos.y })),
    tl: { rapid: w.powerups.timeLeft.rapid, spread: w.powerups.timeLeft.spread, shield: w.powerups.timeLeft.shield, magnet: w.powerups.timeLeft.magnet, overdrive: w.powerups.timeLeft.overdrive },
    vortex: { phase: w.vortex.phase, x: w.vortex.pos.x, y: w.vortex.pos.y, timer: w.vortex.timer, nextIn: w.vortex.nextIn },
    boss: w.boss ? { kind: w.boss.kind, hp: w.boss.hp, x: w.boss.pos.x, y: w.boss.pos.y } : null,
    warden: w.warden ? { hp: w.warden.hp, armor: w.warden.armor, x: w.warden.pos.x, y: w.warden.pos.y } : null
  };
}

// House NaN-scan rule: only values of type number are scanned and every scanned
// value must be finite. (The one intentional sentinel, scoreKeeper.lastKillTime
// = -Infinity, is deliberately NOT in the scan set.)
function findBadNumbers(obj, path, out) {
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) out.push(path + '=' + String(obj));
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) findBadNumbers(obj[i], path + '[' + i + ']', out);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) findBadNumbers(obj[k], path ? path + '.' + k : k, out);
  }
}

function assertNoBadNumbers(w, label) {
  const bad = [];
  findBadNumbers(stateForScan(w), '', bad);
  assert.deepEqual(bad, [], label + 'non-finite values: ' + bad.join(', '));
}

// System caps that must hold at every checkpoint (from config.js).
function assertInvariants(w) {
  assert.equal(w.game.state, 'PLAYING', 'invuln soak ship must never die');
  assert.ok(Number.isFinite(w.score), 'score finite');
  assert.ok(w.enemyBullets.bullets.filter((b) => !b.dead).length <= 24, 'enemyBullets cap 24');
  assert.ok(w.field.rocks.filter((r) => r.belt).length <= 5, 'belt cap 5');
  assert.ok(w.field.rocks.length <= 29, 'rock layer cap (24 non-belt + 5 belt)');
  assert.ok(w.mines.mines.filter((m) => !m.dead).length <= 10, 'mines cap 10');
  assert.ok(w.drones.drones.filter((d) => !d.dead).length <= 6, 'drones cap 6');
  assertNoBadNumbers(w, 't=' + w.time.toFixed(1) + 's: ');
}

// Invuln auto-fire soak. Returns world, heavyweight events, 60 s checkpoints.
function runSoak(seed, steps, checkpointEvery) {
  const w = new World(new RNG(seed));
  w.begin();
  w.ship.invuln = 1e9;
  const evs = { bossSpawn: [], wardenSpawn: [] };
  const checkpoints = [];
  for (let i = 0; i < steps && w.game.state === 'PLAYING'; i++) {
    w.step(DT, intentFor(w, i));
    for (const e of w.drainEvents()) {
      if (e.type === 'bossSpawn') evs.bossSpawn.push(e.data);
      if (e.type === 'wardenSpawn') evs.wardenSpawn.push(e.data);
    }
    if (checkpointEvery && (i + 1) % checkpointEvery === 0) {
      assertInvariants(w);
      checkpoints.push(stateForScan(w));
    }
  }
  return { w, evs, checkpoints };
}

// --- tests ----------------------------------------------------------------------

test('regressionA: 20-wave invuln soak keeps every invariant (ST-148)', () => {
  const { w, evs } = runSoak(14801, 54000, 3600); // 900 s hard cap
  assert.ok(w.wave >= 20, 'reached wave ' + w.wave + ' (need >= 20)');
  assert.equal(w.game.state, 'PLAYING');
  assert.equal(w.weaponLevel(), 3, 'weapon level 3 from wave 10+');

  // Boss contract: the first heavyweight (wave 5) is always the Monolith, and
  // every spawn lands on a 5th wave. A skipped wave consumes no variant.
  assert.ok(evs.bossSpawn.length >= 1, 'a boss must spawn');
  assert.equal(evs.bossSpawn[0].wave, 5, 'first boss at wave 5');
  assert.equal(evs.bossSpawn[0].kind, 'monolith');
  for (let i = 0; i < evs.bossSpawn.length; i++) {
    const b = evs.bossSpawn[i];
    assert.ok(b.wave % 5 === 0, 'boss spawns on a 5th wave');
    assert.equal(b.kind, i % 2 === 0 ? 'monolith' : 'splicer', 'strict alternation');
  }
  // Heavyweight exclusivity: no 5th wave ever gets both a boss and a Warden.
  const bossWaves = new Set(evs.bossSpawn.map((b) => b.wave));
  for (const d of evs.wardenSpawn) assert.ok(!bossWaves.has(d.wave), 'no boss+warden on wave ' + d.wave);
  // The belt is a persistent layer: by wave 12 it holds its cap of 5.
  assert.equal(w.field.rocks.filter((r) => r.belt).length, 5, 'belt at cap');
  // End state is structurally healthy.
  if (w.boss) {
    assert.ok(w.boss.hp > 0 && Number.isFinite(w.boss.hp), 'boss hp');
    assert.ok(w.boss.kind === 'monolith' || w.boss.kind === 'splicer');
  }
  if (w.warden) assert.ok(Number.isFinite(w.warden.hp) && Number.isFinite(w.warden.armor) && w.warden.armor >= 0);
  assertNoBadNumbers(w, 'final: ');
  console.log('  [soak] t=' + w.time.toFixed(0) + 's wave=' + w.wave +
    ' bosses=' + evs.bossSpawn.map((b) => b.kind + '@' + b.wave).join(' ') +
    ' wardens=' + (evs.wardenSpawn.map((d) => '@' + d.wave).join(' ') || '-') +
    ' rocks=' + w.field.rocks.length +
    ' eb=' + w.enemyBullets.bullets.filter((b) => !b.dead).length);
});

test('regressionA: the 300 s invuln soak is bit-identical across two runs (ST-148)', () => {
  const a = runSoak(14803, 18000, 3600);
  const b = runSoak(14803, 18000, 3600);
  assert.deepEqual(a.checkpoints, b.checkpoints, 'every 60 s checkpoint bit-identical');
  assert.deepEqual(a.evs, b.evs, 'heavyweight events identical');
});

test('regressionA: kamikaze ship dies once, restart resets the run (ST-148)', () => {
  const w = new World(new RNG(14804));
  w.begin();
  let gameovers = 0;
  let hits = 0;
  for (let i = 0; i < 54000 && !w.gameOver; i++) {
    w.step(DT, kamikazeIntent(w, i));
    for (const e of w.drainEvents()) {
      if (e.type === 'gameover') gameovers++;
      if (e.type === 'hit') hits++;
    }
  }
  assert.ok(w.gameOver, 'kamikaze ship must die within 900 s sim (hits=' + hits + ', wave=' + w.wave + ')');
  assert.equal(gameovers, 1, 'gameover event fires exactly once');
  assert.ok(hits >= 3, 'three lives, three hit events (got ' + hits + ')');
  assert.ok(Number.isFinite(w.score), 'final score finite');
  assert.equal(w.lives, 0);

  w.restart();
  assert.equal(w.game.state, 'PLAYING');
  assert.equal(w.score, 0);
  assert.equal(w.lives, 3);
  assert.equal(w.boss, null);
  assert.equal(w.warden, null);
  assert.equal(w.field.rocks.length, 0);
  assert.equal(w.enemyBullets.bullets.filter((b) => !b.dead).length, 0);
  assert.equal(w.mines.mines.filter((m) => !m.dead).length, 0);

  // The restarted world must stay healthy: 10 s with the good pilot.
  for (let i = 0; i < 600; i++) {
    w.step(DT, intentFor(w, i));
    w.drainEvents();
  }
  assert.equal(w.game.state, 'PLAYING');
  assert.ok(Number.isFinite(w.score));
  assertNoBadNumbers(w, 'post-restart: ');
  console.log('  [death] died at wave ' + w.wave + ' (pre-restart), post-restart 10 s clean, hits=' + hits);
});
