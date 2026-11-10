// ST-124: bomb honors the split per-gen fragment bonus (parity with the bullet path).
// Before this fix the bomb path ignored genBonus, so a gen-2 S cleared by bomb scored 100
// instead of 150. These tests lock the parity and the flat shielded bomb score.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const GB = CONFIG.asteroid.split.genBonus;
const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };

function freshWorld(seed) { const w = new World(new RNG(seed)); w.begin(); return w; }

test('bombGen: gen-1 fragment cleared by bomb pays base * (1 + genBonus[1])', () => {
  const w = freshWorld(51);
  const r = w.field.spawn('M', 1, { x: -4, y: 2 }, null, false, null, 1);
  r.vel = v2(0, 0);
  w.bombBlast();
  assert.equal(w.score, Math.floor(CONFIG.asteroid.sizes.M.score * (1 + GB[1])), 'bomb gen-1 M bonus');
});

test('bombGen: gen-2 fragment cleared by bomb pays base * (1 + genBonus[2])', () => {
  const w = freshWorld(52);
  const r = w.field.spawn('S', 1, { x: 5, y: -3 }, null, false, null, 2);
  r.vel = v2(0, 0);
  w.bombBlast();
  assert.equal(w.score, Math.floor(CONFIG.asteroid.sizes.S.score * (1 + GB[2])), 'bomb gen-2 S bonus');
});

test('bombGen: bomb and bullet pay the same for the same gen-2 rock (parity)', () => {
  const wb = freshWorld(53);
  const rb = wb.field.spawn('S', 1, { x: 0, y: 6 }, null, false, null, 2);
  rb.vel = v2(0, 0);
  wb.weapons._spawn({ x: rb.pos.x, y: rb.pos.y }, 0);
  wb.step(1 / 60, NOINTENT);
  const bulletScore = wb.score;

  const wm = freshWorld(53);
  const rm = wm.field.spawn('S', 1, { x: 0, y: 6 }, null, false, null, 2);
  rm.vel = v2(0, 0);
  wm.bombBlast();
  assert.equal(wm.score, bulletScore, 'bomb === bullet for a gen-2 S');
  assert.equal(wm.score, Math.floor(CONFIG.asteroid.sizes.S.score * (1 + GB[2])), 'expected gen-2 S value');
});

test('bombGen: a shielded rock cleared by bomb pays the flat shielded score (no gen bonus)', () => {
  const w = freshWorld(54);
  const r = w.field.spawn('M', 1, { x: 3, y: 0 }, null, false, null, 1, true);
  r.vel = v2(0, 0);
  r.gen = 1;
  w.bombBlast();
  assert.equal(w.score, CONFIG.asteroid.shielded.score, 'flat shielded bomb score');
});
