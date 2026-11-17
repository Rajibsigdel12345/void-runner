// ST-448 (E63): POD - a drifting splitter (wave 13+). PROCEDURAL: it drifts inward on a
// closed-form cosine wobble (no ship knowledge, no RNG in step()) so a pinned W2-3 run
// draws zero extra RNG. 4 hits; a LETHAL hit splits into 2 WASP corkscrews (game.js
// drives the split exactly once); natural expiry (maxAge) self-destructs with NO split.
// Covers: config rungs, juice rungs (incl. the podDeath flash 0.4), wave gates, rim
// spawn, inward drift + bounded wobble, the reduced-motion 0.4x wobble scale, the exact
// 2-child split (world), no child dash before the 1.0 s floor, hp 4, world kill (+300),
// contact, the once-per-run toast, maxAge (field + world), and the roster mix matrix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/game.js';
import { RNG } from '../src/core/rng.js';
import { PodField } from '../src/core/pod.js';
import { CONFIG } from '../src/core/config.js';
import { killPunchEnergy } from '../src/core/killPunch.js';

const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const DT = 1 / 60;
const EPS = 1e-9;

test('pod: config sanity', () => {
  const s = CONFIG.pod;
  assert.equal(s.firstWave, 13, 'gate is wave 13');
  assert.equal(s.perWave, 1, 'one per wave');
  assert.equal(s.maxConcurrent, 2, 'cap two concurrent');
  assert.equal(s.hp, 4, 'four hits to kill');
  assert.equal(s.radius, 1.2, 'heavy hitbox');
  assert.equal(s.splitCount, 2, 'splits into two wasps');
  assert.equal(s.seamGlow, 0.55, 'static seam core glow');
  assert.ok(s.seamGlow <= 1.0, 'glow is RM-safe (<= 1.0)');
  assert.equal(s.rmAmpScale, 0.4, 'reduced-motion wobble scale');
  assert.ok(s.rmAmpScale > 0 && s.rmAmpScale < 1, 'RM scale is a real reduction');
  assert.equal(s.driftSpeed, 2.2, 'inward drift 2.2 u/s');
  assert.equal(s.driftWobble, 0.4, 'wobble amplitude 0.4 u/s');
  assert.equal(s.rimDist, 15, 'rim spawn 15 u from the ship');
  assert.equal(s.score, 300, 'kill reward 300');
  assert.ok(CONFIG.stinger.score < s.score && s.score < CONFIG.sentry.score, '250 < 300 < 350 score rung');
});

test('pod: juice rungs (shake 0.75, killPunch 0.26, shockwave 3.0, flash 0.4)', () => {
  assert.equal(CONFIG.fx.shakeTable.podDeath, 0.75, 'shake rung 0.75');
  assert.ok(CONFIG.fx.shakeTable.sentryDeath < 0.75 && 0.75 < CONFIG.fx.shakeTable.wardenDeath, '0.7 < 0.75 < 0.8 ordering');
  assert.equal(CONFIG.fx.killPunch.pod, 0.26, 'killPunch rung 0.26');
  assert.ok(CONFIG.fx.killPunch.flyer < 0.26 && 0.26 < CONFIG.fx.killPunch.sentry, '0.25 < 0.26 < 0.28 ordering');
  assert.equal(killPunchEnergy('pod', false, CONFIG.fx.killPunch), 0.26, 'unboosted pod punch');
  assert.equal(killPunchEnergy('pod', true, CONFIG.fx.killPunch), CONFIG.fx.killPunch.max, 'overdrive 0.39 capped at the 0.3 max');
  assert.equal(CONFIG.fx.shockwave.classes.pod, 3.0, 'shockwave class 3.0');
  assert.ok(CONFIG.fx.shockwave.classes.sentry < 3.0 && 3.0 <= CONFIG.fx.shockwave.classes.gunship, '2.8 < 3.0 <= 3.6 ordering');
  assert.equal(CONFIG.fx.flashTable.podDeath, 0.4, 'pod death flashes 0.4 (sentry/wasp deaths do not flash)');
  assert.equal(CONFIG.fx.flashTable.sentryDeath, undefined, 'no sentry death flash rung');
  assert.equal(CONFIG.fx.flashTable.waspDeath, undefined, 'no wasp death flash rung');
});

test('pod: wave gates (none W12, one W13, cap holds W14, none on boss W15)', () => {
  const w = new World(new RNG(4841));
  w.begin();
  w.spawnPodForWave(12);
  assert.equal(w.pods.count, 0, 'no pods at wave 12');
  w.spawnPodForWave(13);
  assert.equal(w.pods.count, 1, 'one pod at wave 13');
  w.spawnPodForWave(14);
  assert.equal(w.pods.count, 2, 'cap 2 holds at wave 14');
  w.spawnPodForWave(15);
  assert.equal(w.pods.count, 2, 'boss wave 15 excluded');
});

test('pod: rim spawn stays at least 15 u from the ship', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    const f = new PodField(new RNG(seed));
    const shipPos = { x: 20, y: 0 };
    const q = f.spawn(shipPos);
    const d = Math.hypot(q.pos.x - shipPos.x, q.pos.y - shipPos.y);
    assert.ok(d >= CONFIG.pod.rimDist - 1e-6, 'seed ' + seed + ' at ' + d.toFixed(3) + ' u');
  }
});

test('pod: drifts inward and the perpendicular wobble stays bounded', () => {
  const f = new PodField(new RNG(4842));
  const p = f.spawn({ x: 0, y: 0 });
  const r0 = Math.hypot(p.pos.x, p.pos.y);
  let maxPerpVel = 0;
  for (let i = 0; i < 600; i++) {
    const px = p.pos.x, py = p.pos.y; // the sim measures the wobble in this pre-step frame
    f.step(DT);
    const d = Math.hypot(px, py);
    const dirx = -px / d, diry = -py / d;
    const perp = Math.abs(p.vel.x * -diry + p.vel.y * dirx);
    if (perp > maxPerpVel) maxPerpVel = perp;
  }
  const r1 = Math.hypot(p.pos.x, p.pos.y);
  assert.ok(r1 < r0, 'net inward drift over 10 s (' + r0.toFixed(2) + ' -> ' + r1.toFixed(2) + ')');
  assert.ok(maxPerpVel <= CONFIG.pod.driftWobble + 1e-6, 'perpendicular velocity bounded by the wobble amplitude');
});

test('pod: reduced motion scales the wobble down to 0.4x (same seed, same phase)', () => {
  const run = (seed, amp) => {
    const f = new PodField(new RNG(seed));
    f.ampScale = amp;
    const p = f.spawn({ x: 0, y: 0 });
    const p0 = { x: p.pos.x, y: p.pos.y };
    const d0 = Math.hypot(p0.x, p0.y);
    const inx = -p0.x / d0, iny = -p0.y / d0; // the initial inward axis
    let maxPerp = 0;
    for (let i = 0; i < 600; i++) {
      f.step(DT);
      const dx = p.pos.x - p0.x, dy = p.pos.y - p0.y;
      const perp = Math.abs(dx * -iny + dy * inx);
      if (perp > maxPerp) maxPerp = perp;
    }
    return maxPerp;
  };
  for (const seed of [4835, 7, 42]) {
    const full = run(seed, 1);
    const rm = run(seed, CONFIG.pod.rmAmpScale);
    assert.ok(full > 0, 'seed ' + seed + ' the wobble is not degenerate');
    assert.ok(rm > 0 && rm < full, 'seed ' + seed + ' RM wobble is smaller');
    assert.ok(rm / full > 0.35 && rm / full < 0.45, 'seed ' + seed + ' the scale is ~0.4x (' + (rm / full).toFixed(3) + ')');
  }
});

test('pod: four hits to kill (three hit events, the lethal one splits)', () => {
  const f = new PodField(new RNG(4843));
  const p = f.spawn({ x: 0, y: 0 });
  f.step(DT);
  for (let i = 0; i < 3; i++) {
    const q = f.hit(p.id);
    assert.ok(!q.dead, 'survives hit ' + (i + 1));
  }
  assert.equal(f.drainEvents().filter(e => e.kind === 'hit').length, 3, 'three hit events');
  const q = f.hit(p.id);
  assert.ok(q.dead, 'dead on hit 4');
  const ev = f.drainEvents();
  assert.ok(ev.some(e => e.kind === 'death' && e.self === false && e.split === true), 'lethal death carries split:true');
  assert.equal(f.count, 0, 'field compacted');
});

test('pod: a lethal world hit splits into EXACTLY 2 wasp children at the pod position', () => {
  const w = new World(new RNG(4844));
  w.begin();
  w.spawnPodForWave(13);
  const p = w.pods.pods[0];
  p.pos.x = 5; p.pos.y = 0;
  for (let i = 0; i < CONFIG.pod.hp; i++) {
    w.weapons.bullets.push({ id: 9400 + i, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  }
  w.resolveBulletPods();
  const ev = w.drainEvents();
  assert.equal(w.wasps.count, 2, 'exactly 2 wasp children');
  for (const wp of w.wasps.wasps) {
    assert.equal(wp.splitChild, true, 'child flagged as a split child');
    assert.ok(Math.hypot(wp.pos.x - 5, wp.pos.y - 0) < 0.01, 'child at the pod position');
  }
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.size, 'pod', 'kill class pod');
  assert.equal(kills[0].data.points, 300, '+300');
  assert.ok(ev.some(e => e.type === 'podDeath' && e.data.split === true), 'podDeath (split)');
  assert.equal(w.pods.count, 0, 'pod gone');
});

test('pod: split children corkscrew >= 1.0 s before their first dash', () => {
  const w = new World(new RNG(4845));
  w.begin();
  w.spawnPodForWave(13);
  const p = w.pods.pods[0];
  p.pos.x = 8; p.pos.y = 0;
  for (let i = 0; i < CONFIG.pod.hp; i++) {
    w.weapons.bullets.push({ id: 9500 + i, pos: { x: 8, y: 0 }, radius: 2, dead: false });
  }
  w.resolveBulletPods();
  w.drainEvents();
  const t0 = w.time;
  let dashAt = null;
  for (let i = 0; i < 600 && dashAt === null; i++) {
    w.step(DT, NEUTRAL);
    for (const e of w.drainEvents()) if (e.type === 'waspDash') { dashAt = w.time; break; }
  }
  assert.ok(dashAt !== null, 'a child dashes within the window');
  assert.ok(dashAt - t0 >= CONFIG.wasp.corkscrewDurMin - 2 * DT, 'no dash before the 1.0 s anticipation floor');
});

test('pod: maxAge expiry self-destructs with NO split (field and world)', () => {
  const f = new PodField(new RNG(4846));
  const p = f.spawn({ x: 0, y: 0 });
  p.age = CONFIG.pod.maxAge - DT;
  f.step(DT);
  const ev = f.drainEvents();
  assert.ok(ev.some(e => e.kind === 'death' && e.self === true && e.split === false), 'self death, split:false');
  assert.equal(f.count, 0, 'field empty');

  const w = new World(new RNG(4847));
  w.begin();
  w.spawnPodForWave(13);
  w.pods.pods[0].age = CONFIG.pod.maxAge - DT;
  w.step(DT, NEUTRAL);
  const wv = w.drainEvents();
  assert.ok(wv.some(e => e.type === 'podDeath' && e.data.self === true && e.data.split === false), 'world podDeath (self, no split)');
  assert.equal(w.wasps.count, 0, 'expiry spawns no children');
  assert.equal(w.pods.count, 0, 'pod gone');
});

test('pod: world kill pays +300 and feeds the combo', () => {
  const w = new World(new RNG(4848));
  w.begin();
  w.spawnPodForWave(13);
  const p = w.pods.pods[0];
  p.pos.x = 5; p.pos.y = 0;
  for (let i = 0; i < CONFIG.pod.hp; i++) {
    w.weapons.bullets.push({ id: 9700 + i, pos: { x: 5, y: 0 }, radius: 2, dead: false });
  }
  w.resolveBulletPods();
  const ev = w.drainEvents();
  const kills = ev.filter(e => e.type === 'kill');
  assert.equal(kills.length, 1, 'one kill');
  assert.equal(kills[0].data.points, 300, '+300');
  assert.equal(kills[0].data.combo, 1, 'combo feeds to 1');
  assert.equal(ev.filter(e => e.type === 'podHit').length, 3, 'three podHit FX events');
});

test('pod: contact costs a life, no score, pod destroyed', () => {
  const w = new World(new RNG(4849));
  w.begin();
  w.spawnPodForWave(13);
  const p = w.pods.pods[0];
  p.pos.x = 0; p.pos.y = 0; // onto the ship
  const scoreBefore = w.score;
  const livesBefore = w.lives;
  w.resolveShipPods();
  const ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'podDeath' && e.data.self === false), 'podDeath on contact');
  assert.ok(ev.some(e => e.type === 'hit'), 'hit (life lost) event');
  assert.equal(w.lives, livesBefore - 1, 'one life lost');
  assert.equal(w.score, scoreBefore, 'no score for a contact kill');
  assert.equal(w.pods.count, 0, 'pod gone');
});

test('pod: first spawn toasts once, later spawns stay quiet', () => {
  const w = new World(new RNG(4850));
  w.begin();
  w.spawnPodForWave(13);
  let ev = w.drainEvents();
  assert.ok(ev.some(e => e.type === 'podSpawn'), 'first spawn toasts');
  w.spawnPodForWave(14);
  ev = w.drainEvents();
  assert.ok(!ev.some(e => e.type === 'podSpawn'), 'second spawn is quiet');
});

test('pod: roster mix matrix W10-W15 (debut waves, caps, boss-wave exclusion)', () => {
  const w = new World(new RNG(4851));
  w.begin();
  const at = (n) => {
    w.spawnSentryForWave(n);
    w.spawnWaspForWave(n);
    w.spawnPodForWave(n);
    return [w.sentries.count, w.wasps.count, w.pods.count];
  };
  assert.deepEqual(at(10), [0, 0, 0], 'W10: boss wave, nothing new');
  assert.deepEqual(at(11), [2, 0, 0], 'W11: sentry debut (2); others gated');
  assert.deepEqual(at(12), [2, 3, 0], 'W12: wasp V-pack debut; sentries at cap');
  assert.deepEqual(at(13), [2, 6, 1], 'W13: pod debut; wasps at cap 6');
  assert.deepEqual(at(14), [2, 6, 2], 'W14: pods at cap 2; wasp pack + sentries deferred');
  assert.deepEqual(at(15), [2, 6, 2], 'W15: boss wave - no change');
});

test('pod: field is deterministic (same seed + inputs -> identical event stream)', () => {
  const run = (seed) => {
    const f = new PodField(new RNG(seed));
    f.spawn({ x: 0, y: 0 });
    f.spawn({ x: 0, y: 0 }); // cap 2
    const out = [];
    for (let i = 0; i < 1200; i++) {
      f.step(DT);
      for (const e of f.drainEvents()) out.push([e.kind, e.pos.x.toFixed(4), e.pos.y.toFixed(4), String(f.count)]);
    }
    return out;
  };
  const a = run(4852);
  const b = run(4852);
  assert.ok(a.length >= 0, 'run completed');
  assert.deepEqual(a, b, 'bit-identical event stream (no RNG in step)');
});
