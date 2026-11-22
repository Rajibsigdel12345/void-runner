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
  for (const l of [1, 2, 3, 4, 5]) { // ST-486 (E69): +L4, ST-517 (E75): +L5
    assert.ok(cb.hp[l] > 0);
    assert.ok(cb.score[l] > 0);
  }
  assert.deepEqual(cb.phases, { 1: 3, 2: 1, 3: 1, 4: 1, 5: 3 }); // ST-486 (E69); ST-517 (E75): L5 archon 3-phase
  assert.ok(cb.abyssal && cb.abyssal.spawnEvery > 0 && cb.abyssal.spawnFirst > 0, 'ST-486 abyssal move-set config');
  assert.ok(Number.isInteger(cb.abyssal.body) && Number.isInteger(cb.abyssal.core) && Number.isInteger(cb.abyssal.rim), 'ST-486 abyssal identity hexes');
  assert.ok(cb.archon && cb.archon.spawnEvery > 0 && cb.archon.spawnFirst > 0, 'ST-519 archon move-set config');
  assert.ok(Number.isInteger(cb.archon.body) && Number.isInteger(cb.archon.core) && Number.isInteger(cb.archon.rim), 'ST-519 archon identity hexes');
  assert.ok(cb.archon.moves && cb.archon.moves.aimEvery.length === 3 && cb.archon.moves.ringEvery[0] === 99, 'ST-519 archon cadence (P0 aimed-only)');
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
  assert.equal(boss(4, 'abyssal').phaseCount, 1); // ST-486 (E69)
  assert.equal(boss(5, 'archon').phaseCount, 3); // ST-519 (I553): L5 archon 3-phase
  for (const l of [1, 2, 3, 4, 5]) {
    const b = boss(l, ['monolith', 'splicer', 'prime', 'abyssal', 'monolith'][l - 1]);
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
  const tints = ['monolith', 'splicer', 'prime', 'abyssal', 'archon']; // ST-486 (E69); ST-519 (I553): L5 archon tint
  for (const l of [1, 2, 3, 4, 5]) {
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
  const b4 = boss(4, 'abyssal'); // ST-486 (E69)
  assert.equal(b4.kind, 'monolith');
  assert.equal(b4.prime, false);
  assert.equal(b4.abyssal, true);
  const b5 = boss(5, 'archon'); // ST-519 (I553): L5 archon tint
  assert.equal(b5.kind, 'monolith');
  assert.equal(b5.prime, false);
  assert.equal(b5.archon, true); // ST-519 (I553)
  assert.ok(b1.isCampaignBoss && b2.isCampaignBoss && b3.isCampaignBoss && b4.isCampaignBoss && b5.isCampaignBoss);
});

test('I489 campaignBoss: level boss wiring (kind + distance)', () => {
  for (const l of [1, 2, 3, 4, 5]) { // ST-486 (E69), ST-517 (E75)
    assert.ok(bossKind(l).length > 0);
    assert.equal(bossDistance(l), levelLength(l));
  }
  assert.deepEqual([bossKind(1), bossKind(2), bossKind(3), bossKind(4), bossKind(5)], ['monolith', 'splicer', 'monolith-prime', 'abyssal', 'archon']); // ST-486 (E69); ST-517 (E75)
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

test('ST-486 abyssal: summon cadence - phantom then bulwark alternating, deterministic, entrance-gated', () => {
  const b = boss(4, 'abyssal');
  b.entered = 1; // skip the 1.4 s entrance
  const spawns = [];
  for (let i = 0; i < 1100; i++) { // ~18.3 s: 3 summons at t=5, 11, 17 s
    const ev = b.step(DT, P);
    if (ev.spawn) spawns.push(ev.spawn);
  }
  assert.deepEqual(spawns, ['phantom', 'bulwark', 'phantom'], 'first 3 summons alternate phantom/bulwark');
  // config-driven (no RNG draw): two identical bosses summon on identical frames
  const a = boss(4, 'abyssal'), c = boss(4, 'abyssal');
  a.entered = 1; c.entered = 1;
  let lastA = -1, lastC = -1;
  for (let i = 0; i < 400; i++) {
    if (a.step(DT, P).spawn) lastA = i;
    if (c.step(DT, P).spawn) lastC = i;
  }
  assert.ok(lastA >= 0 && lastA === lastC, 'deterministic summon frame');
  // entrance gate: no summon before the entrance completes
  const g = boss(4, 'abyssal');
  g.entered = 0.9;
  g._spawnTimer = 0.001;
  assert.equal(g.step(DT, P).spawn, 0, 'no summon before the entrance completes');
  // non-abyssal campaign bosses never summon (endless/campaign L1-3 behavior untouched)
  const m = boss(1, 'monolith');
  m.entered = 1;
  assert.ok(runFrames(m, 1200).every((e) => e.spawn === 0), 'monolith never summons');
});

test('ST-519 archon: P0 aimed-only (no ring), summons arm at P1 HALO, 7.0 s cadence, deterministic', () => {
  const b = boss(5, 'archon');
  b.entered = 1;
  assert.equal(b._spawnTimer, -1, 'archon summons unarmed at P0');
  assert.equal(b.teleRing, -1, 'P0 never rings (ringEvery[0] = 99)');
  const evs = runFrames(b, 60 * 20);
  assert.ok(evs.every((e) => e.ring === 0), 'P0 aimed-only: no ring event');
  assert.ok(evs.every((e) => e.spawn === 0), 'no summon before P1');
  b.hp = Math.ceil(b.maxHp * 0.60);
  b.step(DT, P);
  assert.equal(b.phaseIndex, 1, 'P1 HALO reached');
  assert.equal(b._spawnTimer, CONFIG.campaignBoss.archon.spawnFirst - DT, 'summons armed at P1 then same-step decrement');
  const spawns = [];
  for (let i = 0; i < 60 * 40; i++) { const ev = b.step(DT, P); if (ev.spawn) spawns.push(ev.spawn); }
  assert.ok(spawns.length >= 4, 'archon summons at 7.0 s cadence (got ' + spawns.length + ')');
  assert.deepEqual(spawns.slice(0, 4), ['phantom', 'bulwark', 'phantom', 'bulwark'], 'phantom first, alternating');
  const a = boss(5, 'archon'), c = boss(5, 'archon');
  a.entered = 1; c.entered = 1;
  a.hp = Math.ceil(a.maxHp * 0.60); c.hp = Math.ceil(c.maxHp * 0.60);
  a.step(DT, P); c.step(DT, P);
  let lastA = -1, lastC = -1;
  for (let i = 0; i < 60 * 12; i++) { if (a.step(DT, P).spawn) lastA = i; if (c.step(DT, P).spawn) lastC = i; }
  assert.ok(lastA >= 0 && lastA === lastC, 'deterministic summon frame');
  const seq = () => {
    const nb = new CampaignBoss(new RNG(2025), CONFIG, { x: 20, y: 0 }, 5, 'archon');
    nb.entered = 1;
    const out = [];
    for (let i = 0; i < 60 * 25; i++) {
      const ev = nb.step(DT, P);
      if (ev.aim) out.push('a' + i);
      if (ev.ring) out.push('r' + i);
      if (ev.phase) out.push('p' + i);
      if (ev.spawn) out.push('s' + i + ev.spawn);
      if (i % 120 === 0) nb.hp = Math.max(1, nb.maxHp - (i / (60 * 25)) * nb.maxHp);
    }
    return out;
  };
  assert.deepEqual(seq(), seq(), 'archon event sequence deterministic');
  const ab = boss(4, 'abyssal');
  ab.entered = 1;
  const abSpawn = [];
  for (let i = 0; i < 60 * 20; i++) { if (ab.step(DT, P).spawn) abSpawn.push(i); }
  assert.ok(abSpawn.length >= 2, 'abyssal still summons');
  assert.equal(abSpawn[1] - abSpawn[0], 360, 'abyssal cadence unchanged at 6.0 s (not archon 7.0)');
});
