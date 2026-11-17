// ST-456 (E64, I489): unit tests for the campaign end-of-level boss (pure core).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignBoss } from '../src/core/campaignBoss.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { bossDistance, levelLength, bossKind } from '../src/core/level.js';

const DT = 1 / 60;
const P = { x: 0, y: 0 };

function boss(level, tint, seed = 7) {
  return new CampaignBoss(new RNG(seed), CONFIG, { x: 20, y: 0 }, level, tint);
}

function runFrames(b, frames, shipPos) {
  const evs = [];
  for (let i = 0; i < frames; i++) evs.push(b.step(DT, shipPos || P));
  return evs;
}

function statesThrough(b, frames) {
  const seen = [b.weak.state];
  for (let i = 0; i < frames; i++) {
    b.step(DT, P);
    if (b.weak.state !== seen[seen.length - 1]) seen.push(b.weak.state);
  }
  return seen;
}

test('I489 campaignBoss: config sanity', () => {
  const cb = CONFIG.campaignBoss;
  assert.ok(cb.radius > 0);
  assert.ok(cb.enterTime > 0);
  assert.ok(cb.speed > 0 && cb.speed < CONFIG.ship.maxSpeed);
  assert.ok(cb.speed < CONFIG.boss.speed);
  for (const l of [1, 2, 3]) {
    assert.ok(cb.hp[l] > 0);
    assert.ok(cb.score[l] > 0);
  }
  assert.deepEqual(cb.phases, { 1: 3, 2: 1, 3: 1 });
  assert.deepEqual(cb.phaseAt, [1.0, 0.66, 0.33]);
  const w = cb.weak;
  assert.ok(w.r > 0 && w.orbitR > 0 && w.armTime > 0 && w.teleTime > 0 && w.openTime > 0);
  assert.ok(w.orbitR > cb.radius, 'weak point orbits forward of the body');
  assert.equal(cb.moves.ringEvery[0], 99, 'phase 0 never rings');
  assert.ok(cb.moves.ringEvery[1] > 0 && cb.moves.ringEvery[2] > 0);
  assert.ok(cb.moves.aimEvery[0] > cb.moves.aimEvery[1] && cb.moves.aimEvery[1] > cb.moves.aimEvery[2]);
  assert.ok(cb.splitCount > 0);
  assert.equal(cb.splitSize, 'M');
});

test('I489 campaignBoss: weak point cycles closed -> tele -> open -> closed', () => {
  const b = boss(1, 'monolith');
  assert.equal(b.weak.state, 'closed');
  assert.deepEqual(statesThrough(b, 400), ['closed', 'tele', 'open', 'closed']);
});

test('I489 campaignBoss: weak point open flag and tele glow per state', () => {
  const b = boss(1, 'monolith');
  const w = CONFIG.campaignBoss.weak;
  b.weak.state = 'closed'; b._weakTimer = w.armTime; b._updateWeak(0);
  assert.equal(b.weak.open, false);
  assert.equal(b.weak.tele, 0);
  b.weak.state = 'tele'; b._weakTimer = w.teleTime * 0.5; b._updateWeak(0);
  assert.equal(b.weak.open, false);
  assert.ok(b.weak.tele >= 0 && b.weak.tele <= 1);
  b.weak.state = 'open'; b._weakTimer = w.openTime; b._updateWeak(0);
  assert.equal(b.weak.open, true);
  assert.equal(b.weak.tele, 1);
});

test('I489 campaignBoss: weak point rides the front at orbit radius', () => {
  const b = boss(1, 'monolith');
  const w = CONFIG.campaignBoss.weak;
  b.pos.x = 10; b.pos.y = 0;
  b._vel = { x: 1, y: 0 };
  b._updateWeak(0);
  const dx = b.weak.x - b.pos.x;
  const dy = b.weak.y - b.pos.y;
  assert.ok(Math.abs(Math.hypot(dx, dy) - w.orbitR) < 1e-9);
  assert.ok(dx > w.orbitR * 0.99);
  assert.ok(Math.abs(dy) < 1e-9);
});

test('I489 campaignBoss: phase counts and starting posture', () => {
  assert.equal(boss(1, 'monolith').phaseCount, 3);
  assert.equal(boss(2, 'splicer').phaseCount, 1);
  assert.equal(boss(3, 'prime').phaseCount, 1);
  for (const l of [1, 2, 3]) {
    const b = boss(l, ['monolith', 'splicer', 'prime'][l - 1]);
    assert.equal(b.phaseIndex, 0);
    assert.equal(b.postureScale, CONFIG.campaignBoss.posture[0]);
  }
});

test('I489 campaignBoss: L1 progresses 3 phases with posture + weak re-arm', () => {
  const cb = CONFIG.campaignBoss;
  const b = boss(1, 'monolith');
  b.entered = 1;
  b.hp = b.maxHp * 0.6;
  let ev = b.step(DT, P);
  assert.equal(ev.phase, 1);
  assert.equal(ev.phaseIndex, 1);
  assert.equal(b.postureScale, cb.posture[1]);
  assert.equal(b.weak.state, 'closed');
  ev = b.step(DT, P);
  assert.equal(ev.phase, 0, 'no repeated phase event');
  b.hp = b.maxHp * 0.2;
  ev = b.step(DT, P);
  assert.equal(ev.phase, 1);
  assert.equal(ev.phaseIndex, 2);
  assert.equal(b.postureScale, cb.posture[2]);
});

test('I489 campaignBoss: phase 0 aims only; phase 1 adds rings', () => {
  const b = boss(1, 'monolith');
  b.entered = 1;
  const evs = runFrames(b, 180); // 3.0s at phase 0
  assert.ok(evs.some((e) => e.aim === 1), 'aimed bolt in phase 0');
  assert.ok(!evs.some((e) => e.ring === 1), 'no rings in phase 0');
  b.phaseIndex = 1;
  b._aimTimer = 99; b._ringTimer = 0.001;
  const e = b.step(DT, P);
  assert.equal(e.ring, 1);
  assert.equal(e.aim, 0);
});

test('I489 campaignBoss: single-phase L2 uses tier 1 (aim + ring)', () => {
  const b = boss(2, 'splicer');
  b.entered = 1;
  const evs = runFrames(b, 240); // 4.0s
  assert.ok(evs.some((e) => e.aim === 1));
  assert.ok(evs.some((e) => e.ring === 1));
});

test('I489 campaignBoss: entrance gates the move set', () => {
  const b = boss(1, 'monolith');
  const frames = Math.floor((CONFIG.campaignBoss.enterTime - 2 * DT) / DT);
  const evs = runFrames(b, frames);
  assert.ok(!evs.some((e) => e.aim === 1 || e.ring === 1));
  assert.ok(b.entered < 1);
});

test('I489 campaignBoss: hit deals 1 damage, kill flips alive', () => {
  const b = boss(1, 'monolith');
  const hp0 = b.hp;
  assert.equal(b.hit(), false);
  assert.equal(b.hp, hp0 - 1);
  assert.equal(b.hitFlash, 1);
  b.hp = 1;
  assert.equal(b.hit(), true);
  assert.equal(b.alive, false);
  assert.equal(b.hpFrac, 0);
  assert.equal(b.hit(), false, 'dead boss ignores hits');
});

test('I489 campaignBoss: per-level stats', () => {
  const cb = CONFIG.campaignBoss;
  const tints = ['monolith', 'splicer', 'prime'];
  for (const l of [1, 2, 3]) {
    const b = boss(l, tints[l - 1]);
    assert.equal(b.hp, cb.hp[l]);
    assert.equal(b.maxHp, cb.hp[l]);
    assert.equal(b.score, cb.score[l]);
    assert.equal(b.radius, cb.radius);
    assert.equal(b.level, l);
    assert.equal(b.spawnWave, 0);
  }
});

test('I489 campaignBoss: canonical kind + prime + isCampaignBoss', () => {
  const b1 = boss(1, 'monolith');
  assert.equal(b1.kind, 'monolith');
  assert.equal(b1.prime, false);
  const b2 = boss(2, 'splicer');
  assert.equal(b2.kind, 'splicer');
  assert.equal(b2.prime, false);
  const b3 = boss(3, 'prime');
  assert.equal(b3.kind, 'monolith');
  assert.equal(b3.prime, true);
  assert.ok(b1.isCampaignBoss && b2.isCampaignBoss && b3.isCampaignBoss);
});

test('I489 campaignBoss: level boss wiring (kind + distance)', () => {
  for (const l of [1, 2, 3]) {
    assert.ok(bossKind(l).length > 0);
    assert.equal(bossDistance(l), levelLength(l));
  }
  assert.deepEqual([bossKind(1), bossKind(2), bossKind(3)], ['monolith', 'splicer', 'monolith-prime']);
});

test('I489 campaignBoss: timers seeded from the starting tier', () => {
  const cb = CONFIG.campaignBoss;
  const b1 = boss(1, 'monolith');
  assert.equal(b1._aimTimer, cb.moves.aimEvery[0]);
  assert.equal(b1._ringTimer, cb.moves.ringEvery[0]);
  assert.equal(b1.teleRing, -1, 'phase 0 never rings');
  const b2 = boss(2, 'splicer');
  const t = cb.singlePhaseMoveTier;
  assert.equal(b2._aimTimer, cb.moves.aimEvery[t]);
  assert.equal(b2._ringTimer, cb.moves.ringEvery[t]);
  assert.ok(b2.teleRing > 0, 'single-phase boss telegraphs rings');
});

test('I489 campaignBoss: deterministic trajectory + weak orbit', () => {
  const snap = (b) => [b.pos.x, b.pos.y, b.weak.x, b.weak.y, b.teleAim, b.teleRing, b.entered];
  const run = () => {
    const b = new CampaignBoss(new RNG(1234), CONFIG, { x: 20, y: 0 }, 1, 'monolith');
    const out = [];
    for (let i = 0; i < 300; i++) {
      const t = i * DT;
      b.step(DT, { x: Math.cos(t) * 10, y: Math.sin(t) * 10 });
      out.push(snap(b));
    }
    return out;
  };
  assert.deepEqual(run(), run());
});

test('I489 campaignBoss: no NaN on coincident ship and huge dt', () => {
  const b = new CampaignBoss(new RNG(5), CONFIG, { x: 0, y: 0 }, 1, 'monolith');
  b.step(0, P);
  b.step(5, P);
  for (const v of [b.pos.x, b.pos.y, b.weak.x, b.weak.y, b.teleAim, b.entered, b.hpFrac]) {
    assert.ok(Number.isFinite(v), 'finite: ' + v);
  }
  assert.ok(b.teleRing === -1 || Number.isFinite(b.teleRing));
  assert.ok(['closed', 'tele', 'open'].includes(b.weak.state));
});
