// ST-015: lives tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Lives } from '../src/core/lives.js';
import { CONFIG } from '../src/core/config.js';

test('lives: starts at configured max', () => {
  const l = new Lives();
  assert.equal(l.count, CONFIG.ship.lives);
  assert.ok(l.alive);
});

test('lives: damage decrements; zero stops decrementing', () => {
  const l = new Lives(2);
  assert.equal(l.damage(), 1);
  assert.equal(l.damage(), 0);
  assert.ok(!l.alive);
  assert.equal(l.damage(), 0, 'no negative lives');
});

test('lives: reset restores max', () => {
  const l = new Lives(3);
  l.damage(); l.damage();
  l.reset();
  assert.equal(l.count, 3);
});
