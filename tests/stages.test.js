// ST-419 (I449) / E57: campaign stage system - pure-core unit tests.
// ST-453 (E64): the wave-based campaign flow (waves 5/10/15) was replaced by the level-based
// flow (3 levels, end-of-level boss + warp). The 4 flow tests below were rewritten to drive the
// level machine; the pure stage-mapping primitives and endless invariance tests are unchanged.
// Covers stage mapping, warp determinism, mode gating, level-boss victory. No three, no DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { STATE } from '../src/core/state.js';
import {
  stageForWave, isStageEndWave, isFinalWave, stageIndex0,
  makeWarp, stepWarp, stageTheme, stageName
} from '../src/core/stages.js';
import { bossDistance } from '../src/core/level.js'; // ST-453 (E64)

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;

/** ST-453 (E64): campaign bosses come from level ends - park the level machine just short of the
 * level boss line and step once so _levelStep() spawns it. Skip the entrance animation. */
function worldWithCampaignBoss(seed, level) {
  const w = new World(new RNG(seed));
  w.begin('campaign');
  w.levelState.level = level;
  w.levelState.phase = 'zone';
  w.levelState.distance = bossDistance(level, CONFIG) - 0.01;
  w.step(DT, NEUTRAL);
  assert.ok(w.boss, 'level boss spawned');
  w.boss.entered = 1; // skip the entrance
  return w;
}
function worldWithEndlessBoss(seed, wave) {
  const w = new World(new RNG(seed));
  w.begin(); // endless
  w.waves.state = 'intermission';
  w.waves.intermission = 100;
  w.spawnBossForWave(wave);
  w.boss.entered = 1;
  assert.ok(w.boss, 'boss spawned');
  return w;
}
/** One 1-damage bullet, then step. Kills a boss at hp 1. ST-456: campaign bosses are
 * armored - the bullet must land on the (forced-open) weak point, not the body. */
function landOneBullet(w) {
  const b = w.boss;
  w.boss.hp = 1;
  let px = b.pos.x, py = b.pos.y;
  if (b.isCampaignBoss) {
    b.phaseIndex = b.phaseCount - 1; // final phase: an hp drop must not transition (and re-arm the weak point)
    b.weak.state = 'open'; b.weak.open = true; b._weakTimer = 5; // hold it open through the step
    b._updateWeak(0);
    px = b.weak.x; py = b.weak.y;
  }
  w.weapons.bullets.push({ id: 1, pos: { x: px, y: py }, vel: { x: 34, y: 0 }, life: 1, radius: 0.18, dead: false });
  w.step(DT, NEUTRAL);
}

test('stages: stageForWave maps waves 1..15 to 3 stages', () => {
  assert.equal(stageForWave(1), 1);
  assert.equal(stageForWave(5), 1);
  assert.equal(stageForWave(6), 2);
  assert.equal(stageForWave(10), 2);
  assert.equal(stageForWave(11), 3);
  assert.equal(stageForWave(15), 3);
});

test('stages: isStageEndWave only at 5/10/15 (within range)', () => {
  assert.equal(isStageEndWave(5), true);
  assert.equal(isStageEndWave(10), true);
  assert.equal(isStageEndWave(15), true);
  assert.equal(isStageEndWave(1), false);
  assert.equal(isStageEndWave(6), false);
  assert.equal(isStageEndWave(11), false);
  assert.equal(isStageEndWave(20), false);
});

test('stages: isFinalWave only at 15', () => {
  assert.equal(isFinalWave(15), true);
  assert.equal(isFinalWave(5), false);
  assert.equal(isFinalWave(10), false);
  assert.equal(isFinalWave(20), false);
});

test('stages: stageIndex0 clamped 0..2', () => {
  assert.equal(stageIndex0(1), 0);
  assert.equal(stageIndex0(6), 1);
  assert.equal(stageIndex0(11), 2);
  assert.equal(stageIndex0(16), 2); // clamped to last
});

test('stages: makeWarp/stepWarp are deterministic (no RNG)', () => {
  const a = makeWarp(0.5), b = makeWarp(0.5);
  assert.deepEqual(a, { t: 0, dur: 0.5 });
  let sa;
  for (let i = 0; i < 7; i++) { sa = stepWarp(a, 0.1); assert.equal(stepWarp(b, 0.1), sa); assert.equal(a.t, b.t); }
  assert.equal(sa, 'done'); // 0.1 * 5 = 0.5 >= 0.5 (done at step 5, stays done)
  const z = makeWarp(0); // zero/invalid duration -> completes immediately
  assert.equal(stepWarp(z, DT), 'done');
});

test('stages: endless is default and runs 40s with ZERO stage events', () => {
  const w = new World(new RNG(1234));
  w.begin(); // endless
  assert.equal(w.mode, 'endless');
  assert.equal(w.currentStage, 1);
  assert.equal(w.warp, null);
  assert.equal(w.victory, false);
  w.ship.invuln = 1e9; // survive to observe a long run
  let sawStageEvent = false;
  for (let i = 0; i < 60 * 40; i++) {
    w.step(DT, NEUTRAL);
    for (const e of w.drainEvents()) if (e.type === 'warpStart' || e.type === 'stageCleared' || e.type === 'themeSwap') sawStageEvent = true;
    if (w.game.in(STATE.GAME_OVER)) break;
  }
  assert.equal(sawStageEvent, false, 'no stage events in endless');
  assert.equal(w.victory, false);
  assert.equal(w.warp, null);
});

test('stages: mode selection via begin() and setMode()', () => {
  const w = new World(new RNG(1));
  w.setMode('campaign'); assert.equal(w.mode, 'campaign');
  w.setMode('bogus'); assert.equal(w.mode, 'endless');
  const w2 = new World(new RNG(1));
  w2.begin('campaign');
  assert.equal(w2.mode, 'campaign');
  assert.ok(w2.game.in(STATE.PLAYING));
  const w3 = new World(new RNG(1));
  w3.begin('endless');
  assert.equal(w3.mode, 'endless');
});

test('stages: killing the level-1 boss in campaign starts the warp to level 2', () => {
  const w = worldWithCampaignBoss(51, 1);
  assert.equal(w.boss.kind, 'monolith');
  assert.equal(w.boss.prime, false); // ST-456: prime is a boolean identity flag
  assert.equal(w.boss.maxHp, 96); // ST-456: campaignBoss.hp[1]
  assert.equal(w.boss.spawnWave, 0); // 0 tags a level boss
  landOneBullet(w);
  assert.ok(w.warp, 'warp active after level-1 boss death');
  assert.equal(w.warp.nextLevel, 2);
  assert.equal(w.warp.nextStage, 2);
  const evs = w.drainEvents();
  assert.ok(evs.find(e => e.type === 'warpStart' && e.data.toStage === 2), 'warpStart toStage 2');
  assert.ok(evs.find(e => e.type === 'levelCleared' && e.data.level === 1), 'levelCleared level 1');
});

test('stages: the warp freezes the sim (game clock frozen) and advances the level', () => {
  const w = worldWithCampaignBoss(52, 1);
  landOneBullet(w);
  assert.ok(w.warp, 'warp active');
  w.drainEvents(); // clear warpStart + levelCleared
  const t0 = w.time;
  let guard = 0;
  while (w.warp && guard < 200) { w.step(DT, NEUTRAL); guard++; }
  assert.equal(w.warp, null, 'warp completed');
  assert.equal(w.time, t0, 'game clock frozen during warp');
  assert.equal(w.currentStage, 2, 'advanced to stage 2');
  assert.deepEqual(w.levelState, { level: 2, distance: 0, zone: 1, phase: 'zone' }, 'level 2 reset');
  const evs = w.drainEvents();
  assert.ok(evs.find(e => e.type === 'stageCleared' && e.data.stage === 1), 'stageCleared 1');
  assert.ok(evs.find(e => e.type === 'levelIntro' && e.data.level === 2), 'levelIntro level 2');
  const ts = evs.find(e => e.type === 'themeSwap');
  assert.ok(ts && ts.data.stage === 2, 'themeSwap stage 2');
  assert.ok(ts.data.theme, 'stage 2 has a theme');
});

test('stages: killing the campaign final (level 5) boss = archon (monolith tint until D4) -> victory gameover (ST-517 E75)', () => {
  const w = worldWithCampaignBoss(53, 5);
  assert.equal(w.boss.kind, 'monolith');
  assert.equal(w.boss.prime, false);
  assert.equal(w.boss.abyssal, false); // ST-517 (E75): archon identity lands D4/ST-519; monolith fallback is not abyssal
  assert.equal(w.boss.maxHp, 175); // ST-517: campaignBoss.hp[5]
  assert.equal(w.boss.cfg.boss.burst.every, CONFIG.boss.burst.every); // ST-456: base cfg (Prime is a visual identity)
  assert.equal(w.boss.splitCount, 4); // ST-456: campaignBoss.splitCount
  assert.equal(w.boss.cfg.boss.phase2.hpFrac, CONFIG.boss.phase2.hpFrac);
  assert.equal(w.boss.spawnWave, 0); // 0 tags a level boss
  w.ship.invuln = 1e9; // survive the split
  landOneBullet(w);
  assert.ok(w.game.in(STATE.GAME_OVER), 'game over');
  assert.equal(w.victory, true, 'victory flag');
  const evs = w.drainEvents();
  const go = evs.find(e => e.type === 'gameover');
  assert.ok(go, 'gameover event');
  assert.equal(go.data.victory, true, 'gameover carries victory:true');
  assert.equal(go.data.level, 5, 'gameover carries level 5'); // ST-517 (E75)
  assert.equal(w.warp, null, 'no warp after final boss');
});

test('stages: killing the ENDLESS final (wave 15) boss is NOT a victory, no warp', () => {
  const w = worldWithEndlessBoss(54, 15);
  assert.equal(w.boss.prime, undefined);
  assert.equal(w.boss.maxHp, 76); // min(88, 64+12)
  assert.equal(w.boss.cfg.boss.burst.every, 4.0);
  w.ship.invuln = 1e9;
  landOneBullet(w);
  assert.ok(w.game.in(STATE.PLAYING), 'still playing (endless continues)');
  assert.equal(w.victory, false);
  assert.equal(w.warp, null);
  const evs = w.drainEvents();
  assert.ok(!evs.find(e => e.type === 'gameover' && e.data.victory), 'no victory gameover in endless');
  assert.ok(evs.find(e => e.type === 'bossDeath'), 'boss still died/split normally');
});

test('stages: warp is deterministic - two same-seed campaign runs reach warp identically', () => {
  function drive(seed) {
    const w = worldWithCampaignBoss(seed, 1);
    const events = [];
    landOneBullet(w);
    for (const e of w.drainEvents()) events.push(e.type + ':' + JSON.stringify(e.data));
    let frames = 0;
    while (w.warp && frames < 200) { w.step(DT, NEUTRAL); frames++; for (const e of w.drainEvents()) events.push(e.type + ':' + JSON.stringify(e.data)); }
    return { frames, events, time: w.time, stage: w.currentStage };
  }
  const A = drive(777), B = drive(777);
  assert.equal(A.frames, B.frames);
  assert.equal(A.time, B.time);
  assert.equal(A.stage, B.stage);
  assert.deepEqual(A.events, B.events);
});

test('stages: stageTheme/stageName resolve rows and handle stage 1 (null theme)', () => {
  assert.equal(stageTheme(1, CONFIG), null); // stage 1 = identity default
  assert.equal(stageTheme(2, CONFIG).accent, 0x2dd4bf);
  assert.equal(stageTheme(3, CONFIG).accent, 0xffc94d);
  assert.equal(stageName(1, CONFIG), 'Outer Drift');
  assert.equal(stageName(3, CONFIG), 'Core Gate');
  assert.equal(stageTheme(9, CONFIG).accent, 0xffc94d); // clamped to last row
});
