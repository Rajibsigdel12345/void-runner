// ST-126: E8B test batch - 40 new unit tests across the E8B systems (weapon/combo/
// bomb/slow-mo/drone/splitter/shielded). Every test targets a gap NOT covered by the
// existing per-system suites (drones/shielded/slowmo/splitScoring/weaponLevel/
// bombGenBonus/score/golden/overdrive/game.test.js) - none of these duplicate one.
import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { CONFIG } from "../src/core/config.js";
import { Weapons } from "../src/core/weapons.js";
import { AsteroidField } from "../src/core/asteroids.js";
import { DroneField } from "../src/core/drones.js";
import { ScoreKeeper } from "../src/core/score.js";
import { v2 } from "../src/core/math.js";

const DT = 1 / 60;
const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const FIRING_AT = (p) => ({ thrust: { x: 0, y: 0 }, aimPoint: p, firing: true });

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** World begun + drained: no rocks, no pending spawns (isolates the system under test). */
function freshWorld(seed, cfg) {
  const w = new World(new RNG(seed), cfg || CONFIG);
  w.begin();
  w.field.clear();
  w.waves.toSpawn = 0;
  return w;
}

/** Force the wave director into a wave with a full spawn queue (probe aid). */
function forceWave(w, wave) {
  const wd = w.waves;
  wd.state = "active";
  wd.wave = wave;
  wd.waveElapsed = 0;
  wd.activeMod = "none";
  wd.toSpawn = CONFIG.wave.base + CONFIG.wave.growth * wave;
}

function cfgShielded(over) {
  return { ...CONFIG, asteroid: { ...CONFIG.asteroid, shielded: { ...CONFIG.asteroid.shielded, ...over } } };
}

// ---------- weapon: capacity / layout / cadence ----------

test("weapon: fire respects the maxBullets capacity (null at the cap)", () => {
  const wp = new Weapons(CONFIG);
  for (let i = 0; i < CONFIG.weapon.maxBullets; i++) {
    wp.cooldown = 0;
    if (!wp.fire(v2(0, 0), 0)) break;
  }
  assert.equal(wp.count, CONFIG.weapon.maxBullets);
  wp.cooldown = 0;
  assert.equal(wp.fire(v2(0, 0), 0), null, "no 65th bullet");
});

test("weapon: fireSpread fans the shots across the full arc", () => {
  const wp = new Weapons(CONFIG);
  const shots = wp.fireSpread(v2(0, 0), 0, 3, 0.35);
  assert.equal(shots.length, 3);
  const angs = shots.map((b) => Math.atan2(b.vel.y, b.vel.x)).sort((a, b) => a - b);
  assert.ok(Math.abs(angs[0] + 0.35) < 1e-9, "outer left at -arc");
  assert.ok(Math.abs(angs[1]) < 1e-9, "center on aim");
  assert.ok(Math.abs(angs[2] - 0.35) < 1e-9, "outer right at +arc");
});

test("weapon: the L2 twin layout places shots at -arc/+arc (never centered)", () => {
  const wp = new Weapons(CONFIG);
  const shots = wp.fireSpread(v2(0, 0), 0, 2, 0.16);
  assert.equal(shots.length, 2);
  const angs = shots.map((b) => Math.abs(Math.atan2(b.vel.y, b.vel.x))).sort((a, b) => a - b);
  assert.ok(Math.abs(angs[0] - 0.16) < 1e-9 && Math.abs(angs[1] - 0.16) < 1e-9);
  assert.equal(shots.filter((b) => Math.abs(Math.atan2(b.vel.y, b.vel.x)) < 1e-6).length, 0);
});

test("weapon: a spread burst consumes ONE cooldown cycle", () => {
  const wp = new Weapons(CONFIG);
  wp.fireSpread(v2(0, 0), 0, 3, 0.35);
  assert.equal(wp.fire(v2(0, 0), 0), null, "still on cooldown after the burst");
  wp.step(CONFIG.weapon.fireInterval, false, null);
  assert.ok(wp.fire(v2(0, 0), 0), "fires again after one interval");
});

test("weapon: rateMul shortens the cooldown proportionally", () => {
  const wp = new Weapons(CONFIG);
  wp.cooldown = 0;
  wp.fire(v2(0, 0), 0, 1.0);
  const c1 = wp.cooldown;
  wp.bullets.length = 0;
  wp.cooldown = 0;
  wp.fire(v2(0, 0), 0, 1.15);
  const c2 = wp.cooldown;
  assert.ok(c2 < c1);
  assert.ok(Math.abs(c2 - c1 / 1.15) < 1e-12);
});

test("weapon: bullet speed is identical at L1 and L3", () => {
  const wp = new Weapons(CONFIG);
  const l1 = wp.fire(v2(0, 0), 0, 1.0);
  wp.bullets.length = 0;
  wp.cooldown = 0;
  const l3 = wp.fireSpread(v2(0, 0), 0, 3, 0.34, 1.15);
  assert.ok(Math.hypot(l1.vel.x, l1.vel.y) === CONFIG.weapon.bulletSpeed);
  for (const b of l3) assert.ok(Math.abs(Math.hypot(b.vel.x, b.vel.y) - CONFIG.weapon.bulletSpeed) < 1e-9);
});

test("weapon: spread power-up overrides the L1 single shot (world)", () => {
  const w = freshWorld(11);
  w.powerups.apply("spread");
  w.fireWeapon();
  assert.equal(w.weapons.count, 3, "3-way burst at level 1");
});

test("weapon: L3 rateMul stacks with rapid (world)", () => {
  const w = freshWorld(12);
  w.waves.wave = 10; // level 3
  w.powerups.apply("rapid");
  w.fireWeapon();
  const expected = (1 / 5.5) / (CONFIG.powerup.types.rapid.rate * 1.15);
  assert.ok(Math.abs(w.weapons.cooldown - expected) < 1e-12);
  assert.equal(w.weapons.count, 3, "L3 layout kept under rapid");
});

test("weapon: weaponLevelUp fires exactly once for a level jump (world)", () => {
  const w = freshWorld(13);
  let ups = 0;
  for (let i = 0; i < 600; i++) {
    if (i === 0) w.waves.wave = 10;
    w.step(DT, NEUTRAL);
    ups += w.drainEvents().filter((e) => e.type === "weaponLevelUp").length;
  }
  assert.equal(ups, 1, "no re-emit on later steps");
});

// ---------- combo / score ----------

test("combo: a kill at exactly the window boundary keeps the chain", () => {
  const sk = new ScoreKeeper(CONFIG);
  sk.kill(100, 0);
  sk.kill(100, CONFIG.combo.window); // exactly window: t - last == window, not >
  assert.equal(sk.combo, 2);
  sk.kill(100, 2 * CONFIG.combo.window + 0.001); // just past: resets
  assert.equal(sk.combo, 1);
});

test("score: overdriveMult doubles the kill payout (unit)", () => {
  const sk = new ScoreKeeper(CONFIG);
  sk.overdriveMult = 2;
  const pts = sk.kill(100, 0);
  assert.equal(pts, 200);
  assert.equal(sk.score, 200);
});

test("score: bonus() doubles under overdrive without touching the combo (unit)", () => {
  const sk = new ScoreKeeper(CONFIG);
  sk.kill(100, 0);
  sk.kill(100, 1);
  sk.kill(100, 2);
  assert.equal(sk.combo, 3);
  sk.overdriveMult = 2;
  const b = sk.bonus(15);
  assert.equal(b, 30);
  assert.equal(sk.combo, 3, "bonus does not extend the chain");
  assert.equal(sk.maxCombo, 3);
  assert.equal(sk.score, 100 + 110 + 120 + 30);
});

test("combo: the chain continues across a rock kill then a drone kill (world)", () => {
  const w = freshWorld(14);
  const r = w.field.spawn("M", 1, { x: 2, y: 0 });
  r.vel = v2(0, 0);
  let s = 0;
  while (s++ < 60 && w.scoreKeeper.kills < 1) w.step(DT, FIRING_AT({ x: 2, y: 0 }));
  assert.equal(w.scoreKeeper.kills, 1);
  const d = w.drones.spawn(w.ship.pos);
  d.pos.x = 2; d.pos.y = 0; d.vel = v2(0, 0);
  s = 0;
  while (s++ < 120 && w.scoreKeeper.kills < 2) w.step(DT, FIRING_AT({ x: 2, y: 0 }));
  assert.equal(w.scoreKeeper.kills, 2);
  assert.equal(w.scoreKeeper.combo, 2, "drone kill feeds the same chain");
});

test("score: overdrive doubles a drone-kill payout (world kill event)", () => {
  const w = freshWorld(15);
  w.powerups.apply("overdrive");
  w.step(DT, NEUTRAL); // world syncs the scoreKeeper overdriveMult
  const d = w.drones.spawn(w.ship.pos);
  d.pos.x = 2; d.pos.y = 0; d.vel = v2(0, 0);
  let s = 0;
  while (s++ < 60 && w.scoreKeeper.kills < 1) w.step(DT, FIRING_AT({ x: 2, y: 0 }));
  assert.equal(w.scoreKeeper.kills, 1);
  const ke = w.drainEvents().find((e) => e.type === "kill");
  assert.equal(ke.data.points, 2 * CONFIG.drone.score);
  assert.equal(ke.data.overdrive, true);
  assert.equal(ke.data.drone, true);
});

// ---------- bomb ----------

test("bomb: clears rocks but leaves drones and mines alone (world)", () => {
  const w = freshWorld(16);
  const d = w.drones.spawn(null);
  d.pos.x = 5; d.pos.y = 0;
  const m = w.mines.spawn(null);
  m.pos.x = 6; m.pos.y = 0;
  w.bombBlast();
  assert.equal(w.field.count, 0);
  assert.equal(w.drones.count, 1, "drones are not bomb targets");
  assert.equal(w.mines.mines.length, 1, "mines are not bomb targets");
});

test("bomb: a golden rock cleared by bomb pays 5x on the bomb path (world)", () => {
  const w = freshWorld(17);
  const r = w.field.spawn("M", 1, { x: 2, y: 0 }, null, true);
  r.vel = v2(0, 0);
  w.bombBlast();
  const ke = w.drainEvents().find((e) => e.type === "kill");
  assert.equal(ke.data.points, CONFIG.asteroid.sizes.M.score * CONFIG.asteroid.golden.scoreMult);
  assert.equal(ke.data.golden, true);
  assert.equal(w.field.count, 0);
});

test("bomb: a shielded rock (armor 3) is gone in ONE blast for the flat score (world)", () => {
  const w = freshWorld(18);
  const r = w.field.spawn("M", 1, { x: 2, y: 0 }, null, false, null, 0, true);
  r.vel = v2(0, 0);
  assert.equal(r.armor, 3);
  w.bombBlast();
  assert.equal(w.field.count, 0, "shatter bypasses armor");
  const ke = w.drainEvents().find((e) => e.type === "kill");
  assert.equal(ke.data.points, CONFIG.asteroid.shielded.score);
});

test("bomb: overdrive doubles each rock kill in the bomb chain (world)", () => {
  const w = freshWorld(19);
  w.powerups.apply("overdrive");
  w.step(DT, NEUTRAL);
  const r1 = w.field.spawn("M", 1, { x: 2, y: 0 }); r1.vel = v2(0, 0);
  const r2 = w.field.spawn("S", 1, { x: -2, y: 0 }); r2.vel = v2(0, 0);
  w.bombBlast();
  const pts = w.drainEvents().filter((e) => e.type === "kill").map((e) => e.data.points).sort((a, b) => a - b);
  // M first (combo 1, mult 1.0): floor(50*1*2)=100; S (combo 2, mult 1.1): floor(100*1.1*2)=220
  assert.deepEqual(pts, [100, 220]);
});

// ---------- slow-mo: which systems scale, which do not ----------

test("slowmo: drones run at ~scale speed under slow-mo (world wiring)", () => {
  function droneDisplacement(seed, slow) {
    const w = new World(new RNG(seed), CONFIG);
    w.begin();
    w.field.clear();
    w.waves.toSpawn = 0;
    const d = w.drones.spawn(w.ship.pos);
    const p0 = { x: d.pos.x, y: d.pos.y };
    if (slow) w.powerups.apply("slowmo");
    for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
    const dn = w.drones.drones[0];
    return Math.hypot(dn.pos.x - p0.x, dn.pos.y - p0.y);
  }
  const a = droneDisplacement(21, false);
  const b = droneDisplacement(21, true);
  assert.ok(a > 2, "control drone actually moved");
  const ratio = b / a;
  assert.ok(ratio > 0.3 && ratio < 0.5, "drone displacement ~0.4x, got " + ratio);
});

test("slowmo: enemy bolts run at ~scale speed under slow-mo (world wiring)", () => {
  function boltDisplacement(seed, slow) {
    const w = new World(new RNG(seed), CONFIG);
    w.begin();
    w.field.clear();
    w.waves.toSpawn = 0;
    const b = w.enemyBullets.fire(v2(5, 0), v2(1, 0), 3); // away from the ship (a bolt fired at the ship is absorbed on step 1)
    const p0 = { x: b.pos.x, y: b.pos.y };
    if (slow) w.powerups.apply("slowmo");
    for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
    const bn = w.enemyBullets.bullets[0];
    return Math.hypot(bn.pos.x - p0.x, bn.pos.y - p0.y);
  }
  const a = boltDisplacement(22, false);
  const b = boltDisplacement(22, true);
  assert.ok(a > 2.5, "control bolt moved ~3u, got " + a);
  const ratio = b / a;
  assert.ok(ratio > 0.3 && ratio < 0.5, "bolt displacement ~0.4x, got " + ratio);
});

test("slowmo: player bullets keep FULL speed under slow-mo (world wiring)", () => {
  function bulletX(seed, slow) {
    const w = new World(new RNG(seed), CONFIG);
    w.begin();
    w.field.clear();
    w.waves.toSpawn = 0;
    const b = w.weapons.fire(v2(0, 0), 0);
    if (slow) w.powerups.apply("slowmo");
    for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
    assert.equal(b.dead, false, "bullet still alive after 1s");
    return b.pos.x;
  }
  const a = bulletX(23, false);
  const b = bulletX(23, true);
  assert.ok(a > 30, "bullet traveled ~34u, got " + a);
  assert.ok(Math.abs(a - b) < 1e-9, "identical displacement, got " + a + " vs " + b);
});

test("slowmo: the wave intermission counts REAL time (not scaled)", () => {
  const w = freshWorld(24);
  w.waves.state = "intermission";
  w.waves.intermission = 5.0;
  w.powerups.apply("slowmo");
  for (let i = 0; i < 60; i++) w.step(DT, NEUTRAL);
  assert.ok(w.waves.intermission > 3.8 && w.waves.intermission < 4.2, "1s real time elapsed, got " + w.waves.intermission);
});

test("slowmo: the combo window expires in real time under slow-mo (world)", () => {
  const w = freshWorld(25);
  w.powerups.apply("slowmo");
  const r1 = w.field.spawn("M", 1, { x: 2, y: 0 }); r1.vel = v2(0, 0);
  let s = 0;
  while (s++ < 60 && w.scoreKeeper.kills < 1) w.step(DT, FIRING_AT({ x: 2, y: 0 }));
  assert.equal(w.scoreKeeper.kills, 1);
  const t1 = w.time;
  for (let i = 0; i < 300; i++) w.step(DT, NEUTRAL); // 5s real gap, no firing
  assert.ok(w.time - t1 > CONFIG.combo.window, "real gap exceeds the combo window");
  const r2 = w.field.spawn("M", 1, { x: 2, y: 0 }); r2.vel = v2(0, 0);
  s = 0;
  while (s++ < 60 && w.scoreKeeper.kills < 2) w.step(DT, FIRING_AT({ x: 2, y: 0 }));
  assert.equal(w.scoreKeeper.kills, 2);
  assert.equal(w.scoreKeeper.combo, 1, "chain expired in real time, not enemy time");
});

test("slowmo: a replay spanning a slow-mo window stays bit-identical (world)", () => {
  function run(seed) {
    const w = new World(new RNG(seed), CONFIG);
    w.begin();
    w.field.clear();
    w.waves.toSpawn = 0;
    w.drones.spawn(w.ship.pos);
    const cps = [];
    for (let i = 0; i < 400; i++) {
      if (i === 30) w.powerups.apply("slowmo");
      w.step(DT, NEUTRAL);
      if (i % 100 === 99) {
        const d = w.drones.drones[0];
        cps.push({ t: w.time, x: d.pos.x, y: d.pos.y, vx: d.vel.x, vy: d.vel.y });
      }
    }
    const d = w.drones.drones[0];
    cps.push({ t: w.time, x: d.pos.x, y: d.pos.y, vx: d.vel.x, vy: d.vel.y });
    return cps;
  }
  assert.deepEqual(run(26), run(26), "checkpoints + final state identical");
});
// ---------- drone: bounds / speed / spin / ship contact ----------
test("drone: rim reflection keeps the drone inside the arena (600 steps)", () => {
  const f = new DroneField(new RNG(27), CONFIG);
  const d = f.spawn(null);
  d.pos = v2(20, 0);
  d.vel = v2(CONFIG.drone.speed, 0);
  for (let i = 0; i < 600; i++) {
    f.step(DT, { x: 0, y: 0 });
    const dist = Math.hypot(d.pos.x, d.pos.y) + CONFIG.drone.radius;
    assert.ok(dist <= CONFIG.arena.radius + 1e-6, "inside the arena at step " + i + ", dist " + dist);
  }
});
test("drone: every spawn lands exactly on the rim ring (radius - drone.radius)", () => {
  const f = new DroneField(new RNG(28), CONFIG);
  const ring = CONFIG.arena.radius - CONFIG.drone.radius;
  for (let i = 0; i < 25; i++) {
    const d = f.spawn({ x: 20, y: 0 });
    assert.ok(d, "spawn within the concurrent cap");
    assert.ok(Math.abs(Math.hypot(d.pos.x, d.pos.y) - ring) < 1e-9, "spawn on the rim ring");
    f.clear();
  }
});
test("drone: speed is constant across steps (seek never accelerates)", () => {
  const f = new DroneField(new RNG(29), CONFIG);
  const d = f.spawn(null);
  for (let i = 0; i < 300; i++) {
    f.step(DT, { x: 0, y: 0 });
    assert.ok(Math.abs(Math.hypot(d.vel.x, d.vel.y) - CONFIG.drone.speed) < 1e-9);
  }
});
test("drone: rot advances at exactly 2 rad/s", () => {
  const f = new DroneField(new RNG(30), CONFIG);
  const d = f.spawn(null);
  const r0 = d.rot;
  f.step(120 * DT, { x: 0, y: 0 });
  assert.ok(Math.abs(d.rot - (r0 + 120 * DT * 2.0)) < 1e-9, "got " + (d.rot - r0));
});
test("drone: an invulnerable ship takes no life (drone survives); contact after expiry costs one (world)", () => {
  const w = freshWorld(31);
  const d = w.drones.spawn(null);
  d.pos.x = 0.1; d.pos.y = 0; d.vel = v2(0, 0);
  w.ship.invuln = 3.0;
  const lives0 = w.lives;
  w.step(DT, NEUTRAL);
  assert.equal(w.lives, lives0, "invulnerable ship keeps its life");
  assert.equal(w.drones.count, 1, "drone survives while the ship is invulnerable");
  w.ship.invuln = 0;
  const dn = w.drones.drones.find((x) => !x.dead);
  dn.pos.x = 0.1; dn.pos.y = 0;
  w.step(DT, NEUTRAL);
  assert.equal(w.lives, lives0 - 1, "contact after invuln expiry costs a life");
  assert.equal(w.drones.count, 0, "drone destroyed on contact");
});
// ---------- splitter: sizes / gen / inheritance / kick / capacity ----------
test("split: S fragments are terminal (zero children)", () => {
  const f = new AsteroidField(new RNG(32), CONFIG);
  const r = f.spawn("S", 1, { x: 0, y: 0 });
  r.vel = v2(3, 0);
  assert.equal(f.destroy(r.id).length, 0);
});
test("split: L -> 2..3 M children, all gen 1", () => {
  const f = new AsteroidField(new RNG(33), CONFIG);
  const r = f.spawn("L", 1, { x: 0, y: 0 });
  r.vel = v2(4, 0);
  const children = f.destroy(r.id);
  assert.ok(children.length >= 2 && children.length <= 3);
  for (const c of children) { assert.equal(c.size, "M"); assert.equal(c.gen || 0, 1); }
});
test("split: M -> 2..3 S children, all gen 2", () => {
  const f = new AsteroidField(new RNG(34), CONFIG);
  const r = f.spawn("M", 1, { x: 0, y: 0 }, null, false, null, 1); // parent M at gen 1 (a fragment of an L), so children are gen 2
  r.vel = v2(4, 0);
  const children = f.destroy(r.id);
  assert.ok(children.length >= 2 && children.length <= 3);
  for (const c of children) { assert.equal(c.size, "S"); assert.equal(c.gen || 0, 2); }
});
test("split: children inherit the parent speedMult", () => {
  const f = new AsteroidField(new RNG(35), CONFIG);
  const r = f.spawn("L", 1.7, { x: 0, y: 0 });
  r.vel = v2(4, 0);
  const children = f.destroy(r.id);
  assert.ok(children.length > 0);
  for (const c of children) assert.ok(Math.abs(c.speedMult - 1.7) < 1e-9);
});
test("split: children kick within +/-split.spread of the parent heading", () => {
  const f = new AsteroidField(new RNG(36), CONFIG);
  const r = f.spawn("L", 1, { x: 0, y: 0 });
  r.vel = v2(4, 0); // heading = 0 rad
  const children = f.destroy(r.id);
  const spread = CONFIG.asteroid.split.spread;
  for (const c of children) {
    const ang = Math.atan2(c.vel.y, c.vel.x);
    assert.ok(Math.abs(angDiff(ang, 0)) <= spread + 1e-9, "child heading " + ang);
  }
});
test("split: capacity limits fragments when the field is full", () => {
  const f = new AsteroidField(new RNG(37), CONFIG);
  const cap = CONFIG.asteroid.maxConcurrent;
  for (let i = 0; i < cap - 1; i++) f.spawn("S", 1, { x: 0, y: 0 });
  const r = f.spawn("L", 1, { x: 0, y: 0 });
  assert.ok(r, "one slot left for the L");
  r.vel = v2(4, 0);
  const children = f.destroy(r.id);
  assert.equal(children.length, 0, "no room for fragments at the cap");
  assert.equal(f.count, cap - 1);
});
// ---------- shielded: wave gate / precedence / ram / armor ----------
test("shielded: wave gate - none observed at wave 3, every rim spawn at wave 4 when chance=1", () => {
  const cfg = cfgShielded({ chance: 1 });
  for (const wave of [3, 4]) {
    const w = new World(new RNG(38), cfg);
    w.begin();
    forceWave(w, wave);
    w.livesMgr.count = 999;
    let sawBad = false, sawAny = false;
    for (let i = 0; i < 120; i++) {
      w.step(DT, NEUTRAL);
      for (const r of w.field.rocks) {
        sawAny = true;
        if (wave === 3 && r.shielded) sawBad = true;
        if (wave === 4 && (!r.shielded || r.size !== "M")) sawBad = true;
      }
    }
    assert.ok(sawAny, "rocks were spawned (wave " + wave + ")");
    assert.ok(!sawBad, wave === 3 ? "no shielded before minWave" : "all rim spawns are shielded M at chance=1");
  }
});
test("shielded: the default 10% chance produces shielded rocks by wave 4", () => {
  const w = new World(new RNG(51), CONFIG);
  w.begin();
  forceWave(w, 4);
  w.livesMgr.count = 999;
  let saw = false;
  for (let i = 0; i < 900; i++) {
    w.step(DT, NEUTRAL);
    if (w.field.rocks.some((r) => r.shielded)) saw = true;
  }
  assert.ok(saw, "at least one shielded rock occurred at 10% over 15s");
});
test("shielded: takes precedence over golden when both roll at chance=1", () => {
  const cfg = { ...CONFIG, asteroid: { ...CONFIG.asteroid, shielded: { ...CONFIG.asteroid.shielded, chance: 1 }, golden: { ...CONFIG.asteroid.golden, chance: 1 } } };
  const w = new World(new RNG(40), cfg);
  w.begin();
  forceWave(w, 4);
  w.livesMgr.count = 999;
  let sawAny = false, sawBad = false;
  for (let i = 0; i < 120; i++) {
    w.step(DT, NEUTRAL);
    for (const r of w.field.rocks) { sawAny = true; if (!r.shielded || r.golden) sawBad = true; }
  }
  assert.ok(sawAny);
  assert.ok(!sawBad, "shielded wins the roll; never both flags");
});
test("shielded: a ship ram destroys it with no split and no score (world)", () => {
  const w = freshWorld(41);
  const r = w.field.spawn("M", 1, { x: 1.0, y: 0 }, null, false, null, 0, true);
  r.vel = v2(0, 0);
  const lives0 = w.lives;
  w.step(DT, NEUTRAL);
  assert.equal(w.lives, lives0 - 1, "ram costs a life");
  assert.ok(r.dead, "rock destroyed");
  assert.equal(w.field.rocks.filter((x) => (x.gen || 0) >= 1).length, 0, "no fragments from a ram");
  assert.equal(w.score, 0, "ramming scores nothing");
});
test("shielded: armor depletes 3 -> 0 across hits, then further hits are null (unit)", () => {
  const f = new AsteroidField(new RNG(42), CONFIG);
  const r = f.spawn("M", 1, { x: 0, y: 0 }, null, false, null, 0, true);
  const h1 = f.hit(r.id);
  assert.equal(h1.destroyed, false);
  assert.equal(h1.armorLeft, 2);
  const h2 = f.hit(r.id);
  assert.equal(h2.destroyed, false);
  assert.equal(h2.armorLeft, 1);
  const h3 = f.hit(r.id);
  assert.equal(h3.destroyed, true);
  assert.equal(h3.shielded, true);
  assert.equal(f.hit(r.id), null);
});
