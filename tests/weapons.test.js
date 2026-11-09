// ST-007: weapons core tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { Weapons } from '../src/core/weapons.js';
import { CONFIG } from '../src/core/config.js';
import { v2 } from '../src/core/math.js';

const DT = 1 / 60;

test('weapons: fire respects fireInterval cadence', () => {
  const w = new Weapons();
  const b1 = w.fire(v2(0, 0), 0);
  assert.ok(b1, 'first shot fires');
  assert.equal(w.fire(v2(0, 0), 0), null, 'immediate second shot blocked by cooldown');
  w.step(CONFIG.weapon.fireInterval + 1e-6);
  assert.ok(w.fire(v2(0, 0), 0), 'fires again after interval');
});

test('weapons: rateMul halves cooldown at 2x', () => {
  const w = new Weapons();
  w.fire(v2(0, 0), 0, 2);
  w.step(CONFIG.weapon.fireInterval / 2 + 1e-6);
  assert.ok(w.fire(v2(0, 0), 0), '2x rate allows fire at half interval');
});

test('weapons: bullet cap enforced', () => {
  const w = new Weapons();
  for (let i = 0; i < CONFIG.weapon.maxBullets; i++) w._spawn(v2(0, 0), 0);
  assert.equal(w.count, CONFIG.weapon.maxBullets);
  w.cooldown = 0;
  assert.equal(w.fire(v2(0, 0), 0), null, 'no fire at cap');
});

test('weapons: bullets cull after bulletLife', () => {
  const w = new Weapons();
  w.fire(v2(0, 0), 0);
  for (let i = 0; i < Math.ceil(CONFIG.weapon.bulletLife / DT) + 1; i++) w.step(DT);
  assert.equal(w.count, 0, 'all bullets culled');
});

test('weapons: bullet moves along velocity', () => {
  const w = new Weapons();
  const b = w.fire(v2(0, 0), 0); // +x
  w.step(0.5);
  assert.ok(Math.abs(b.pos.x - CONFIG.weapon.bulletSpeed * 0.5) < 1e-9);
  assert.ok(Math.abs(b.pos.y) < 1e-9);
});

test('weapons: spread fires n bullets across arc, one cooldown', () => {
  const w = new Weapons();
  const fired = w.fireSpread(v2(0, 0), 0, 3, 0.35);
  assert.equal(fired.length, 3);
  // angle offsets: -0.35, 0, +0.35 -> vel.y signs
  assert.ok(fired[0].vel.y < 0 && fired[1].vel.y === 0 && fired[2].vel.y > 0);
  assert.equal(w.fire(v2(0, 0), 0), null, 'spread consumed the cooldown cycle');
});

test('weapons: markHit removes bullet', () => {
  const w = new Weapons();
  const b = w.fire(v2(0, 0), 0);
  w.markHit(b.id);
  w.step(DT);
  assert.equal(w.count, 0);
});

test('weapons: clear resets everything', () => {
  const w = new Weapons();
  w.fire(v2(0, 0), 0);
  w.clear();
  assert.equal(w.count, 0);
  assert.equal(w.cooldown, 0);
  assert.ok(w.fire(v2(0, 0), 0), 'can fire after clear');
});
