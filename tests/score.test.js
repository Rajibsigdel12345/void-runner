// ST-013: score + combo tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { ScoreKeeper } from '../src/core/score.js';
import { CONFIG } from '../src/core/config.js';

const W = CONFIG.combo.window;

test('score: first kill pays base at 1.0x', () => {
  const s = new ScoreKeeper();
  assert.equal(s.kill(100, 0), 100);
  assert.equal(s.score, 100);
  assert.equal(s.combo, 1);
});

test('score: chain within window raises multiplier by step per kill', () => {
  const s = new ScoreKeeper();
  assert.equal(s.kill(100, 0), 100);            // 1.0x
  assert.equal(s.kill(100, 0.5), 110);          // 1.1x
  assert.equal(s.kill(100, 1.0), 120);          // 1.2x
  assert.equal(s.combo, 3);
  assert.ok(Math.abs(s.multiplier - 1.2) < 1e-9);
});

test('score: combo caps at configured max', () => {
  const s = new ScoreKeeper();
  for (let i = 0; i < CONFIG.combo.cap + 5; i++) s.kill(100, i * 0.1);
  assert.equal(s.combo, CONFIG.combo.cap);
  const topMult = 1 + CONFIG.combo.step * (CONFIG.combo.cap - 1);
  assert.ok(Math.abs(s.multiplier - topMult) < 1e-9);
  assert.equal(s.kill(100, 2), Math.floor(100 * topMult), 'capped kill pays top mult');
});

test('score: combo expires after window', () => {
  const s = new ScoreKeeper();
  s.kill(100, 0);
  s.kill(100, 1); // last kill at t=1
  s.tick(1 + W + 0.1); // time passes beyond window, no kill
  assert.equal(s.combo, 0, 'combo expired');
  assert.equal(s.kill(100, 1 + W + 0.5), 100, 'next kill restarts at 1.0x');
});

test('score: damage resets combo', () => {
  const s = new ScoreKeeper();
  s.kill(100, 0);
  s.kill(100, 0.5);
  s.onDamage();
  assert.equal(s.combo, 0);
  assert.equal(s.kill(100, 1), 100);
});

test('score: maxCombo tracked across chains', () => {
  const s = new ScoreKeeper();
  for (let i = 0; i < 5; i++) s.kill(10, i * 0.1);
  s.onDamage();
  for (let i = 0; i < 3; i++) s.kill(10, 10 + i * 0.1);
  assert.equal(s.maxCombo, 5);
});

test('score: points floor non-integer products', () => {
  const s = new ScoreKeeper();
  s.kill(33, 0);
  s.kill(33, 0.2); // 33 * 1.1 = 36.3 -> 36
  assert.equal(s.score, 33 + 36);
});


test('score: kills counted', () => {
  const s = new ScoreKeeper();
  s.kill(10, 0);
  s.kill(10, 0.1);
  s.kill(10, 0.2);
  assert.equal(s.kills, 3);
});

test('score: reset clears kills and maxCombo', () => {
  const s = new ScoreKeeper();
  for (let i = 0; i < 4; i++) s.kill(10, i * 0.1);
  s.reset();
  assert.equal(s.kills, 0);
  assert.equal(s.maxCombo, 0);
});

// I111: tier + heat (combo HUD preconditions)

test('score: tier is 0 with no chain and rises with combo', () => {
  const s = new ScoreKeeper();
  assert.equal(s.tier, 0, 'no chain -> tier 0');
  s.kill(100, 0);
  assert.equal(s.tier, 0, 'first kill (combo 1) stays base tier 0');
  s.kill(100, 0.2);
  assert.equal(s.tier, 1, 'second kill (combo 2) -> tier 1');
});

test('score: tier is monotonic and capped at tierCount', () => {
  const s = new ScoreKeeper();
  let prev = 0;
  for (let c = 1; c <= CONFIG.combo.cap; c++) {
    s.kill(10, c * 0.01);
    assert.ok(s.tier >= prev, 'tier must not decrease at combo ' + c);
    prev = s.tier;
    assert.ok(s.tier <= CONFIG.combo.tierCount, 'tier within tierCount');
  }
  assert.equal(s.tier, CONFIG.combo.tierCount, 'reaches top tier at cap');
});

test('score: heat is 1 right after a kill and drains to 0 at window', () => {
  const s = new ScoreKeeper();
  s.kill(100, 0);
  assert.ok(Math.abs(s.heatAt(0) - 1) < 1e-9, 'full heat right after kill');
  assert.ok(Math.abs(s.heatAt(W / 2) - 0.5) < 1e-9, 'half heat at half window');
  assert.equal(s.heatAt(W), 0, 'zero at exact window edge');
  assert.equal(s.heatAt(W + 10), 0, 'clamped after window');
});

test('score: heat is 0 with no active combo', () => {
  const s = new ScoreKeeper();
  assert.equal(s.heatAt(5), 0, 'no combo -> zero heat');
  s.kill(100, 0);
  s.tick(W + 1); // expire
  assert.equal(s.combo, 0);
  assert.equal(s.heatAt(W + 1), 0, 'expired -> zero heat');
});

test('score: damage zeroes tier and heat immediately', () => {
  const s = new ScoreKeeper();
  s.kill(100, 0);
  s.kill(100, 0.2);
  s.onDamage();
  assert.equal(s.tier, 0);
  assert.equal(s.heatAt(0.3), 0);
});
test('score: accuracy is 0 before any shot', () => {
  const s = new ScoreKeeper();
  assert.equal(s.shotsFired, 0);
  assert.equal(s.shotsHit, 0);
  assert.equal(s.accuracy(), 0);
});

test('score: accuracy rises with hits and caps at 1', () => {
  const s = new ScoreKeeper();
  s.onShotFired(4);
  s.onShotHit();
  assert.equal(s.accuracy(), 0.25);
  s.onShotHit();
  s.onShotHit();
  s.onShotHit();
  assert.equal(s.accuracy(), 1);
  s.onShotHit(); // overkill cannot push past 1
  assert.equal(s.accuracy(), 1);
});

test('score: onShotFired floors, clamps and ignores bad input', () => {
  const s = new ScoreKeeper();
  s.onShotFired(2.9);
  s.onShotFired(-5);
  s.onShotFired(NaN);
  s.onShotFired('x');
  assert.equal(s.shotsFired, 2);
});

test('score: reset clears accuracy counters and it restarts fresh', () => {
  const s = new ScoreKeeper();
  s.onShotFired(2);
  s.onShotHit();
  assert.equal(s.accuracy(), 0.5);
  s.reset();
  assert.equal(s.shotsFired, 0);
  assert.equal(s.shotsHit, 0);
  assert.equal(s.accuracy(), 0);
  s.onShotFired(1);
  assert.equal(s.accuracy(), 0);
});
