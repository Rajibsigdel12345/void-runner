// ST-120: split (generation) scoring tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const NOINTENT = { thrust: v2(0, 0), aimPoint: null, firing: false };
const DT = 1 / 60;

function freshKill(w, size, at, gen) {
  const r = w.field.spawn(size, 1, at);
  r.vel = v2(0, 0);
  r.gen = gen;
  w.weapons._spawn({ x: r.pos.x, y: r.pos.y }, 0);
  w.step(DT, NOINTENT);
}

test('splitScoring: genBonus config is non-decreasing from 0', () => {
  const gb = CONFIG.asteroid.split.genBonus;
  assert.ok(Array.isArray(gb) && gb.length >= 2, 'genBonus array');
  assert.equal(gb[0], 0, 'gen 0 has no bonus');
  for (let i = 1; i < gb.length; i++) assert.ok(gb[i] >= gb[i - 1], 'non-decreasing');
});

test('splitScoring: fresh (gen 0) rock scores the base size value', () => {
  const w = new World(new RNG(31));
  w.begin();
  freshKill(w, 'L', { x: 3, y: 0 }, 0);
  assert.equal(w.score, CONFIG.asteroid.sizes.L.score, 'no gen bonus on a fresh rock');
});

test('splitScoring: gen-1 and gen-2 fragments score base * (1 + genBonus)', () => {
  const gb = CONFIG.asteroid.split.genBonus;
  let w = new World(new RNG(32));
  w.begin();
  freshKill(w, 'M', { x: -4, y: 2 }, 1);
  assert.equal(w.score, Math.floor(CONFIG.asteroid.sizes.M.score * (1 + gb[1])), 'gen 1 M bonus');

  w = new World(new RNG(33));
  w.begin();
  freshKill(w, 'S', { x: 5, y: -3 }, 2);
  assert.equal(w.score, Math.floor(CONFIG.asteroid.sizes.S.score * (1 + gb[2])), 'gen 2 S bonus');
});

test('splitScoring: gen beyond the table clamps to the last bonus', () => {
  const gb = CONFIG.asteroid.split.genBonus;
  const w = new World(new RNG(34));
  w.begin();
  freshKill(w, 'S', { x: 0, y: 6 }, 99);
  assert.equal(w.score, Math.floor(CONFIG.asteroid.sizes.S.score * (1 + gb[gb.length - 1])), 'clamped gen bonus');
});

test('splitScoring: full chain L0 -> M1 (combo reset between kills)', () => {
  const gb = CONFIG.asteroid.split.genBonus;
  const w = new World(new RNG(35));
  w.begin();
  const L = w.field.spawn('L', 1, { x: 3, y: 0 });
  L.vel = v2(0, 0);
  w.weapons._spawn({ x: L.pos.x, y: L.pos.y }, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.score, CONFIG.asteroid.sizes.L.score, 'L base');
  // reset the combo chain (as damage would) so the next kill scores at 1x - keeps the test
  // isolated from near-miss bonuses that accrue while idle-stepping
  w.scoreKeeper.onDamage();
  const M = w.field.rocks.find(r => r.size === 'M' && r.gen === 1);
  assert.ok(M, 'gen-1 M fragment exists');
  M.vel = v2(0, 0);
  w.weapons._spawn({ x: M.pos.x, y: M.pos.y }, 0);
  w.step(DT, NOINTENT);
  assert.equal(w.score, CONFIG.asteroid.sizes.L.score + Math.floor(CONFIG.asteroid.sizes.M.score * (1 + gb[1])), 'chain total');
  const ev = w.drainEvents().find(e => e.type === 'kill' && e.data.size === 'M');
  assert.ok(ev && ev.data.gen === 1, 'kill event carries gen');
});
