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

