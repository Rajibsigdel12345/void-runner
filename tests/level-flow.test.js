// ST-453 (I486) / E64: level state machine in World - unit tests.
// Forward distance + zone transitions + end-of-level boss + Ikaruga F6
// checkpoint continue + LEVELS spawn wiring. Campaign-gated: endless stays
// bit-identical (test 1 here; causal + playframe probes pin the rest).
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { STATE } from '../src/core/state.js';
import { levelLength, isFinalLevel, isCampaignComplete } from '../src/core/level.js';

const ZERO = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 0.5;
const SEED = 42;

/** Fresh world in PLAYING (mode optional). No drain. */
function fresh(mode) {
  const w = new World(new RNG(SEED));
  if (typeof mode === 'string') w.setMode(mode);
  assert.ok(w.begin(mode), 'begin()');
  return w;
}

/** Step (ship invulnerable) until the level boss exists; returns collected events. */
function runToBoss(w) {
  const evs = [];
  for (let i = 0; i < 400 && !w.boss; i++) {
    w.ship.invuln = 999;
    w.step(DT, ZERO);
    evs.push(...w.drainEvents());
  }
  assert.ok(w.boss, 'level boss spawned within 400 steps');
  return evs;
}

/** Step until the warp ends (frozen sim; no invuln needed); returns the events. */
function runWarp(w) {
  const evs = [];
  for (let i = 0; i < 12 && w.warp; i++) {
    w.step(DT, ZERO);
    evs.push(...w.drainEvents());
  }
  assert.ok(!w.warp, 'warp completed within 12 steps');
  return evs;
}

const LEVEL_EVENTS = ['levelIntro', 'zoneEnter', 'levelCleared', 'checkpoint', 'levelBoss'];
const hasType = (evs, t) => evs.some(e => e.type === t);
const byType = (evs, t) => evs.filter(e => e.type === t);

/** Invulnerable-off, rock at the ship, resolve - one guaranteed death. */
function killShip(w) {
  w.ship.invuln = 0;
  const p = w.ship.pos;
  const r = w.field.spawn('M', 1, { x: p.x, y: p.y }, null, false, null, 0, false);
  assert.ok(r, 'rock spawned at the ship');
  w.resolveShipRocks();
}

test('ST-453: endless invariance - 200 steps, level machine untouched, no level events', () => {
  const w = fresh('endless');
  const evs = [];
  for (let i = 0; i < 200; i++) {
    w.ship.invuln = 999;
    w.step(DT, ZERO);
    evs.push(...w.drainEvents());
  }
  assert.deepEqual(w.levelState, { level: 1, distance: 0, zone: 1, phase: 'zone' });
  assert.strictEqual(w.waves.rockAllowed, true);
  for (const t of LEVEL_EVENTS) assert.ok(!hasType(evs, t), 'no ' + t + ' in endless');
});

test('ST-453: campaign begin emits levelIntro L1 + forced zoneEnter z1', () => {
  const w = fresh('campaign');
  const evs = w.drainEvents();
  const intros = byType(evs, 'levelIntro');
  const zones = byType(evs, 'zoneEnter');
  assert.equal(intros.length, 1);
  assert.deepEqual(intros[0].data, { level: 1, nameKey: 'level.name.l1' });
  assert.equal(zones.length, 1);
  assert.deepEqual(zones[0].data, { level: 1, zone: 1, nameKey: 'level.zone.l1z1', paletteId: 'drift-1', hazard: 'calm', mix: ['drone', 'rock'], forced: true });
});

test('ST-453: zone flow - 3 zone transitions then the end-of-level boss (L1)', () => {
  const w = fresh('campaign');
  w.drainEvents();
  const evs = runToBoss(w);
  assert.equal(w.levelState.phase, 'boss');
  assert.equal(w.levelState.distance, levelLength(1, CONFIG)); // frozen at the boss line (330)
  assert.equal(w.boss.kind, 'monolith');
  assert.equal(w.boss.spawnWave, 0); // level boss tag
  assert.deepEqual(byType(evs, 'zoneEnter').map(e => e.data.zone), [2, 3, 4]);
  const bs = byType(evs, 'bossSpawn');
  assert.equal(bs.length, 1);
  assert.equal(bs[0].data.level, 1);
  const lb = byType(evs, 'levelBoss');
  assert.equal(lb.length, 1);
  assert.deepEqual(lb[0].data, { level: 1, kind: 'monolith' });
});

test('ST-453: boss kill -> levelCleared -> warp -> level 2 (fresh start)', () => {
  const w = fresh('campaign');
  w.drainEvents();
  runToBoss(w);
  w.boss.hp = 1;
  assert.ok(w.boss.hit(), 'killing hit');
  w.bossDeath();
  const evs = w.drainEvents();
  const lc = byType(evs, 'levelCleared');
  assert.equal(lc.length, 1);
  assert.equal(lc[0].data.level, 1);
  assert.ok(w.warp, 'warp started');
  assert.equal(w.warp.nextLevel, 2);
  assert.equal(w.levelState.phase, 'clear');
  const evs2 = runWarp(w);
  assert.deepEqual(byType(evs2, 'stageCleared').map(e => e.data.stage), [1]);
  assert.equal(byType(evs2, 'themeSwap').length, 1);
  const intros = byType(evs2, 'levelIntro');
  assert.equal(intros.length, 1);
  assert.equal(intros[0].data.level, 2);
  const zones = byType(evs2, 'zoneEnter');
  assert.equal(zones.length, 1);
  assert.equal(zones[0].data.zone, 1);
  assert.equal(zones[0].data.forced, true);
  assert.equal(zones[0].data.paletteId, 'debris-1');
  assert.deepEqual(w.levelState, { level: 2, distance: 0, zone: 1, phase: 'zone' });
  assert.equal(w._levelStartScore, w.scoreKeeper.score);
});

test('ST-453: full campaign - 3 level bosses, victory on the final prime', () => {
  const w = fresh('campaign');
  w.drainEvents();
  const all = [];
  for (let lvl = 1; lvl <= 3; lvl++) {
    const evs = runToBoss(w);
    all.push(...evs);
    if (lvl === 3) assert.ok(w.boss.prime, 'L3 boss is prime');
    w.boss.hp = 1;
    assert.ok(w.boss.hit(), 'killing hit L' + lvl);
    w.bossDeath();
    const evs2 = w.drainEvents();
    all.push(...evs2);
    if (lvl < 3) {
      all.push(...runWarp(w));
      assert.equal(w.levelState.level, lvl + 1);
    } else {
      w.ship.invuln = 999;
      w.step(DT, ZERO);
      all.push(...w.drainEvents());
    }
  }
  assert.deepEqual(byType(all, 'levelBoss').map(e => e.data.kind), ['monolith', 'splicer', 'monolith']);
  const go = byType(all, 'gameover');
  assert.equal(go.length, 1);
  assert.equal(go[0].data.victory, true);
  assert.equal(go[0].data.level, 3);
  assert.equal(go[0].data.stage, 3);
  assert.ok(w.game.in(STATE.GAME_OVER));
  assert.ok(isFinalLevel(3, CONFIG));
  assert.ok(isCampaignComplete(3, levelLength(3, CONFIG), CONFIG));
});

test('ST-453: checkpoint continue - death restarts the level at the zone-1 checkpoint (x2)', () => {
  const w = fresh('campaign');
  w.drainEvents();
  // advance into zone 2 (past the zone-1 boundary)
  w.levelState.distance = 80 + CONFIG.levels.cruiseSpeed * DT;
  w.ship.invuln = 999;
  w.step(DT, ZERO);
  w.drainEvents();
  assert.equal(w.levelState.zone, 2);
  for (let attempt = 1; attempt <= 2; attempt++) {
    w.scoreKeeper.score = 5000;
    w.livesMgr.count = 1;
    killShip(w);
    const evs = w.drainEvents();
    assert.ok(!w.game.in(STATE.GAME_OVER), 'attempt ' + attempt + ': not game over');
    assert.ok(w.game.in(STATE.PLAYING), 'attempt ' + attempt + ': still playing');
    assert.equal(w.lives, CONFIG.ship.lives);
    assert.equal(w.score, 0); // back to the level-start snapshot
    assert.deepEqual(w.levelState, { level: 1, distance: 0, zone: 1, phase: 'zone' });
    assert.equal(w.field.count, 0);
    assert.equal(w.boss, null);
    const cp = byType(evs, 'checkpoint');
    assert.equal(cp.length, 1);
    assert.deepEqual(cp[0].data, { level: 1, score: 0, reason: 'continue' });
    assert.ok(hasType(evs, 'zoneEnter'), 'forced zoneEnter after continue');
  }
});

test('ST-453: endless death is the classic game over (no checkpoint)', () => {
  const w = fresh('endless');
  w.drainEvents();
  w.livesMgr.count = 1;
  killShip(w);
  const evs = w.drainEvents();
  assert.ok(w.game.in(STATE.GAME_OVER));
  const go = byType(evs, 'gameover');
  assert.equal(go.length, 1);
  assert.equal('victory' in go[0].data, false);
  assert.ok(!hasType(evs, 'checkpoint'));
});

test('ST-453: zone mix gates + hazard rates', () => {
  const w = fresh('campaign');
  w.drainEvents();
  assert.equal(w._zoneAllows('drone'), true); // zone 1 mix: drone + rock
  assert.equal(w._zoneAllows('stinger'), false); // zone 1 has no stinger
  assert.equal(w._hazardRate('rockRate'), 0.5); // calm
  assert.equal(w._hazardRate('mineRate'), 0); // calm
  w.levelState.distance = 85;
  w._zoneInfo();
  assert.equal(w.levelState.zone, 2);
  assert.equal(w._zoneAllows('stinger'), true); // zone 2 mix includes stinger
  assert.equal(w._hazardRate('rockRate'), 1); // moderate
});

test('ST-453: _decideForWave scales d by the zone rockRate (campaign); raw passthrough (endless)', () => {
  const w = fresh('campaign');
  w.drainEvents();
  const scaled = w._decideForWave(1); // wave 1 = pre-firstWave NEUTRAL_ADJ (stable, no state change)
  w.levelState.distance = 100;
  w._zoneInfo(); // zone 2 (moderate, rockRate 1)
  const raw = w._decideForWave(1);
  assert.notEqual(scaled, raw); // campaign returns a copy, never the director object
  assert.equal(scaled.d, 0.5); // calm halves the density
  assert.equal(raw.d, 1);
  const e = fresh('endless');
  const a = e._decideForWave(1);
  const b = e._decideForWave(1);
  assert.equal(a, b); // endless: the director object itself, every time
  assert.equal(a.d, 1);
});

test('ST-453: rockless zone - wave budget consumed without spawns', () => {
  const w = fresh('campaign');
  w.drainEvents();
  w.levelState.distance = 175; // L1 zone 3 (Tug Lane: stinger/flyer/mine - no rock)
  w.ship.invuln = 999;
  w.step(DT, ZERO);
  w.drainEvents();
  assert.equal(w.levelState.zone, 3);
  assert.equal(w.waves.rockAllowed, false);
  const e = fresh('endless');
  e.drainEvents();
  e.ship.invuln = 999;
  e.step(DT, ZERO);
  e.drainEvents();
  assert.equal(e.waves.rockAllowed, true);
});

test('ST-453: sessionStats.level, reset() re-init, replayBegin gating', () => {
  const e = fresh('endless');
  e.drainEvents();
  assert.equal(e.sessionStats().level, 1);
  const c = fresh('campaign');
  c.drainEvents();
  assert.equal(c.sessionStats().level, 1);
  c.levelState.distance = 999;
  c._levelStartScore = 777;
  c._lastZone = 4;
  c.waves.rockAllowed = false;
  c.reset();
  assert.deepEqual(c.levelState, { level: 1, distance: 0, zone: 1, phase: 'zone' });
  assert.equal(c._levelStartScore, 0);
  assert.equal(c._lastZone, 0);
  assert.equal(c.waves.rockAllowed, true);
  const rc = new World(new RNG(7));
  rc.setMode('campaign');
  assert.ok(rc.replayBegin());
  const cev = rc.drainEvents();
  assert.ok(hasType(cev, 'levelIntro'));
  assert.ok(hasType(cev, 'zoneEnter'));
  const re = new World(new RNG(8));
  assert.ok(re.replayBegin());
  const ree = re.drainEvents();
  assert.ok(!hasType(ree, 'levelIntro'));
  assert.ok(!hasType(ree, 'zoneEnter'));
});

// ST-457 (E64): localStorage-continued start level (clamped; campaign-gated)
test('ST-457: setCampaignStartLevel clamps to 1..levelCount', () => {
  const w = new World(new RNG(SEED));
  assert.equal(w.setCampaignStartLevel(0), 1);
  assert.equal(w.setCampaignStartLevel(NaN), 1);
  assert.equal(w.setCampaignStartLevel(99), 3); // campaign length
  assert.equal(w.setCampaignStartLevel(1.7), 1); // floored
  assert.equal(w.setCampaignStartLevel(2), 2);
})

test('ST-457: campaign begin starts at the continued level (L2) with intro + zone enter', () => {
  const w = new World(new RNG(SEED));
  w.setMode('campaign');
  w.setCampaignStartLevel(2);
  assert.ok(w.begin());
  const evs = w.drainEvents();
  const intros = byType(evs, 'levelIntro');
  assert.equal(intros.length, 1);
  assert.deepEqual(intros[0].data, { level: 2, nameKey: 'level.name.l2' });
  const zones = byType(evs, 'zoneEnter');
  assert.equal(zones.length, 1);
  assert.deepEqual(zones[0].data, { level: 2, zone: 1, nameKey: 'level.zone.l2z1', paletteId: 'debris-1', hazard: 'moderate', mix: ['drone', 'mine', 'stinger'], forced: true });
  assert.deepEqual(w.levelState, { level: 2, distance: 0, zone: 1, phase: 'zone' });
})

test('ST-457: endless begin ignores the start level (no level events, levelState L1)', () => {
  const w = new World(new RNG(SEED));
  w.setMode('endless');
  w.setCampaignStartLevel(2);
  assert.ok(w.begin());
  const evs = w.drainEvents();
  assert.ok(!hasType(evs, 'levelIntro'));
  assert.ok(!hasType(evs, 'zoneEnter'));
  assert.deepEqual(w.levelState, { level: 1, distance: 0, zone: 1, phase: 'zone' });
})

test('ST-457: restart from PAUSED keeps the continue start level', () => {
  const w = fresh('campaign');
  w.drainEvents();
  w.setCampaignStartLevel(2);
  assert.ok(w.pause());
  assert.ok(w.restart());
  const evs = w.drainEvents();
  const intros = byType(evs, 'levelIntro');
  assert.equal(intros.length, 1);
  assert.deepEqual(intros[0].data, { level: 2, nameKey: 'level.name.l2' });
  assert.ok(hasType(evs, 'zoneEnter'));
})