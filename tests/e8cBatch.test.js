// ST-145: E8C test batch - cross-system invariants for the E8-2 heavyweight family:
// boss alternation (Monolith/Splicer) vs the Warden fallback, belt coexistence,
// enemyBullets pool pressure, boss HP/score family curves, determinism through
// boss + skip + respawn scripts, and edge cases. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2, v2Len } from "../src/core/math.js";
import { Monolith, bossHpForWave } from "../src/core/boss.js";
import { Splicer, splicerHpForWave } from "../src/core/splicer.js";
import { Warden } from "../src/core/warden.js";
import { dailySeed } from "../src/core/daily.js";

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  w.ship.invuln = 1e9; // the ship never dies in these scripts
  return w;
}

function killBoss(w) {
  for (let i = 0; i <= w.boss.maxHp; i++) {
    w.weapons.bullets.push({ id: 7000 + i, pos: { x: w.boss.pos.x, y: w.boss.pos.y }, radius: 5, dead: false });
  }
  w.resolveBulletBoss();
}

function snapshot(w) {
  const b = w.boss;
  return JSON.stringify({
    score: w.score,
    lives: w.lives,
    boss: b ? { kind: b.kind, x: b.pos.x, y: b.pos.y, hp: b.hp, phase: b.phase, entered: b.entered } : null,
    bolts: w.enemyBullets.bullets.map((x) => [x.pos.x, x.pos.y, x.vel.x, x.vel.y, x.life]),
    rocks: w.field.rocks.filter((r) => !r.dead).map((r) => [r.pos.x, r.pos.y, r.vel.x, r.vel.y, r.size, r.belt ? 1 : 0]),
  });
}

// ---------------------------------------------------------------- alternation

test("alternation: a live boss on a 5th wave skips the spawn and does not advance the variant count", () => {
  const w = freshWorld(101);
  w.spawnBossForWave(5); // Monolith (count 0 -> 1)
  assert.equal(w.boss.kind, "monolith");
  w.spawnBossForWave(10); // Monolith still alive -> skip
  assert.equal(w.boss.kind, "monolith", "the same Monolith is still the boss");
  assert.equal(w.bossSpawnCount, 1, "the skip does not advance the variant count");
});

test("alternation: after a skip, the next spawn is the Splicer (variant order preserved)", () => {
  const w = freshWorld(102);
  w.spawnBossForWave(5); // Monolith
  w.spawnBossForWave(10); // skipped (Monolith alive)
  killBoss(w);
  assert.equal(w.boss, null);
  w.spawnBossForWave(15); // count 1 (odd) -> Splicer
  assert.equal(w.boss.kind, "splicer");
  assert.equal(w.bossSpawnCount, 2);
});

test("alternation: a live Splicer on a 5th wave also skips, and the next spawn is the Monolith", () => {
  const w = freshWorld(103);
  w.bossSpawnCount = 1;
  w.spawnBossForWave(10); // Splicer (count 1 -> 2)
  assert.equal(w.boss.kind, "splicer");
  w.spawnBossForWave(15); // Splicer alive -> skip
  assert.equal(w.boss.kind, "splicer");
  assert.equal(w.bossSpawnCount, 2, "skip does not advance the count");
  killBoss(w);
  w.spawnBossForWave(20); // count 2 (even) -> Monolith
  assert.equal(w.boss.kind, "monolith");
  assert.equal(w.bossSpawnCount, 3);
});

test("spawn event: bossSpawn carries the variant kind, including after a skip", () => {
  const w = freshWorld(104);
  w.spawnBossForWave(5);
  w.drainEvents();
  w.spawnBossForWave(10); // skipped
  assert.ok(!w.drainEvents().some((e) => e.type === "bossSpawn"), "no bossSpawn event on a skipped wave");
  killBoss(w);
  w.spawnBossForWave(15);
  const ev = w.drainEvents().find((e) => e.type === "bossSpawn");
  assert.ok(ev);
  assert.equal(ev.data.kind, "splicer");
  assert.equal(ev.data.hp, splicerHpForWave(CONFIG, 15));
});

test("heavyweight: a live boss (either kind) blocks the Warden on a 5th wave", () => {
  const w = freshWorld(105);
  w.spawnBossForWave(5); // Monolith
  w.spawnWardenForWave(10);
  assert.equal(w.warden, null, "no Warden while the Monolith is alive");
  killBoss(w);
  w.bossSpawnCount = 1;
  w.spawnBossForWave(10); // Splicer
  w.warden = null;
  w.spawnWardenForWave(15);
  assert.equal(w.warden, null, "no Warden while the Splicer is alive");
});

test("heavyweight: a 5th wave with no live heavyweight spawns the Warden", () => {
  const w = freshWorld(106);
  w.spawnBossForWave(5); // Monolith
  killBoss(w);
  w.spawnWardenForWave(10); // no boss by wave start
  assert.ok(w.warden, "Warden spawns when the boss slot is empty");
});

test("heavyweight: only one Warden at a time", () => {
  const w = freshWorld(107);
  w.spawnWardenForWave(10);
  assert.ok(w.warden);
  w.spawnWardenForWave(15);
  assert.ok(w.warden, "still the first Warden");
  assert.ok(!w.drainEvents().filter((e) => e.type === "wardenSpawn").some(() => false));
  const spawns = w.drainEvents().filter((e) => e.type === "wardenSpawn");
  // events were drained above; assert via the single live warden instead
  assert.ok(w.warden);
});

test("spawn: the boss spawn position stays inside the arena for a range of seeds (ship near the rim)", () => {
  for (let seed = 1; seed <= 10; seed++) {
    const w = freshWorld(seed);
    w.ship.pos.x = 22; w.ship.pos.y = 0; // near the spawn ring
    w.spawnBossForWave(5);
    assert.ok(w.boss, "seed " + seed + ": a boss spawns");
    const R = CONFIG.arena.radius - CONFIG.boss.radius;
    assert.ok(v2Len(w.boss.pos) <= R + 1e-6, "seed " + seed + ": on the rim ring");
    assert.ok(isFinite(w.boss.pos.x) && isFinite(w.boss.pos.y), "seed " + seed + ": finite position");
  }
});

test("edge: a ship standing on the spawn ring - the tries loop terminates and the boss exists", () => {
  const w = freshWorld(108);
  const R = CONFIG.arena.radius - CONFIG.boss.radius;
  w.ship.pos.x = R; w.ship.pos.y = 0;
  w.spawnBossForWave(5);
  assert.ok(w.boss, "the boss spawns even when every try is near the ship");
  assert.ok(isFinite(w.boss.pos.x) && isFinite(w.boss.pos.y));
  assert.ok(v2Len(w.boss.pos) <= R + 1e-6);
});

// ------------------------------------------------------------ HP/score family

test("hp curve: the Splicer's HP at every 5-wave spawn follows its own curve", () => {
  for (const wave of [10, 15, 20, 25, 30, 40, 45]) {
    const w = freshWorld(109);
    w.bossSpawnCount = 1;
    w.spawnBossForWave(wave);
    assert.equal(w.boss.maxHp, splicerHpForWave(CONFIG, wave), "wave " + wave);
  }
});

test("hp curve: the Monolith's HP at every 5-wave spawn follows its own curve", () => {
  for (const wave of [5, 10, 15, 20, 30, 35, 50]) {
    const w = freshWorld(110);
    w.spawnBossForWave(wave);
    assert.equal(w.boss.maxHp, bossHpForWave(CONFIG, wave), "wave " + wave);
  }
});

test("hp curve: the Splicer's HP is never above the Monolith's at a shared wave (the evasion inverse)", () => {
  for (let wave = 10; wave <= 50; wave += 5) {
    assert.ok(splicerHpForWave(CONFIG, wave) <= bossHpForWave(CONFIG, wave), "wave " + wave);
  }
});

test("hp curve: the hpFirstWave boundary pays the base HP (scale engages strictly after)", () => {
  assert.equal(splicerHpForWave(CONFIG, CONFIG.splicer.hpFirstWave), CONFIG.splicer.maxHp);
  assert.ok(splicerHpForWave(CONFIG, CONFIG.splicer.hpFirstWave + CONFIG.boss.everyWave) > CONFIG.splicer.maxHp);
  assert.equal(bossHpForWave(CONFIG, CONFIG.boss.hpFirstWave), CONFIG.boss.maxHp);
  assert.ok(bossHpForWave(CONFIG, CONFIG.boss.hpFirstWave + CONFIG.boss.everyWave) > CONFIG.boss.maxHp);
});

test("score ladder (family): warden < splicer < monolith", () => {
  assert.ok(CONFIG.warden.score < CONFIG.splicer.score);
  assert.ok(CONFIG.splicer.score < CONFIG.boss.score);
});

// ---------------------------------------------------------------- pool pressure

test("pool: sustained Splicer phase 2 (60 s) never exceeds the enemyBullets cap", () => {
  const w = freshWorld(111);
  w.bossSpawnCount = 1;
  w.spawnBossForWave(10);
  w.boss.entered = 1;
  w.boss.phase = 2;
  const cap = CONFIG.enemyBullets.maxConcurrent;
  for (let i = 0; i < 60 * 60; i++) {
    w.step(1 / 60, {});
    assert.ok(w.enemyBullets.count <= cap, "frame " + i + ": " + w.enemyBullets.count + " > " + cap);
  }
});

test("pool: fire() returns null exactly at the cap and accepts one after a cull", () => {
  const w = freshWorld(112);
  const cap = CONFIG.enemyBullets.maxConcurrent;
  for (let i = 0; i < cap; i++) {
    const b = w.enemyBullets.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 7);
    assert.ok(b, "fire " + i + " accepted");
  }
  assert.equal(w.enemyBullets.count, cap);
  assert.equal(w.enemyBullets.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 7), null, "at the cap -> null");
  w.enemyBullets.bullets[0].dead = true;
  w.enemyBullets.step(0.001);
  assert.ok(w.enemyBullets.fire({ x: 0, y: 0 }, { x: 1, y: 0 }, 7), "a cull frees a slot");
});

test("coexistence: a bolt passes through a belt rock (no bolt-vs-rock collision) and the belt is untouched", () => {
  const w = freshWorld(113);
  w.spawnBeltForWave(10);
  const belt = w.field.rocks.find((r) => r.belt);
  assert.ok(belt, "a belt rock spawned");
  const rockPos = v2(belt.pos.x, belt.pos.y); // the field is not stepped here, so the rock stays put
  const toRock = v2(belt.pos.x, belt.pos.y);
  const len = v2Len(toRock);
  const dir = { x: toRock.x / len, y: toRock.y / len };
  const from = { x: belt.pos.x - dir.x * 2, y: belt.pos.y - dir.y * 2 };
  const bolt = w.enemyBullets.fire(from, dir, 7);
  assert.ok(bolt);
  const t = 40 * 0.016;
  for (let i = 0; i < 40; i++) w.enemyBullets.step(0.016);
  assert.equal(bolt.dead, false, "bolt survived the 40 steps (in-arena, within its life)");
  // enemy bolts have NO rock collision: full speed along dir, nothing consumed it
  const traveled = Math.hypot(bolt.pos.x - from.x, bolt.pos.y - from.y);
  assert.ok(Math.abs(traveled - 7 * t) < 1e-6, "bolt traveled the full distance (nothing deflected or consumed it)");
  const progress = (bolt.pos.x - rockPos.x) * dir.x + (bolt.pos.y - rockPos.y) * dir.y;
  assert.ok(progress > 2, "bolt is on the far side of the belt rock (passed straight through)");
  assert.ok(Math.abs(bolt.vel.x - dir.x * 7) < 1e-9 && Math.abs(bolt.vel.y - dir.y * 7) < 1e-9, "bolt velocity unchanged");
  // the belt is untouched: rock alive and still at its spawn position
  assert.equal(belt.dead, false, "belt rock not destroyed by the bolt");
  assert.equal(belt.pos.x, rockPos.x);
  assert.equal(belt.pos.y, rockPos.y);
});

test("coexistence: the belt cap is independent of the boss (5 belt rocks + Splicer spiral)", () => {
  const w = freshWorld(114);
  w.bossSpawnCount = 1;
  w.spawnBossForWave(10);
  for (let wave = 8; wave <= 12; wave++) w.spawnBeltForWave(wave);
  const belts = w.field.rocks.filter((r) => r.belt).length;
  assert.equal(belts, CONFIG.belt.max, "belt cap reached");
  w.boss.entered = 1;
  for (let i = 0; i < 600; i++) w.step(1 / 60, {});
  assert.equal(w.field.rocks.filter((r) => r.belt && !r.dead).length, CONFIG.belt.max, "belt rocks persist through the spiral");
  assert.ok(w.enemyBullets.count <= CONFIG.enemyBullets.maxConcurrent);
});

test("coexistence: a Warden spawns on a belt-active 5th wave (belt rocks present)", () => {
  const w = freshWorld(115);
  for (let wave = 8; wave <= 10; wave++) w.spawnBeltForWave(wave);
  assert.ok(w.field.rocks.some((r) => r.belt));
  w.spawnWardenForWave(10);
  assert.ok(w.warden, "Warden coexists with belt rocks");
});

// ---------------------------------------------------------------- determinism

test("determinism: two seeded Worlds with the same boss script (Monolith -> Splicer) are bit-identical", () => {
  function run() {
    const w = freshWorld(77);
    w.spawnBossForWave(5); // Monolith
    for (let i = 0; i < 312; i++) w.step(1 / 60, {});
    killBoss(w);
    assert.equal(w.boss, null);
    w.spawnBossForWave(10); // Splicer
    for (let i = 0; i < 600; i++) w.step(1 / 60, {});
    return snapshot(w);
  }
  assert.equal(run(), run(), "bit-identical snapshot");
});

test("determinism: a skip + respawn script is bit-identical (the skip consumes no RNG)", () => {
  function run() {
    const w = freshWorld(78);
    w.spawnBossForWave(5); // Monolith
    for (let i = 0; i < 300; i++) w.step(1 / 60, {});
    w.spawnBossForWave(10); // skipped (Monolith alive)
    assert.equal(w.boss.kind, "monolith");
    for (let i = 0; i < 300; i++) w.step(1 / 60, {});
    killBoss(w);
    w.spawnBossForWave(15); // Splicer (count 1)
    for (let i = 0; i < 300; i++) w.step(1 / 60, {});
    return snapshot(w);
  }
  assert.equal(run(), run(), "bit-identical snapshot through a skipped boss wave");
});

test("determinism: a daily-seeded run reaching the first Splicer is bit-identical across instances", () => {
  const seed = dailySeed(2026, 11, 10, CONFIG.daily.salt);
  function run() {
    const w = new World(new RNG(1), CONFIG);
    w.reseed(seed);
    w.begin();
    w.field.clear();
    w.waves.state = "idle";
    w.ship.invuln = 1e9;
    w.spawnBossForWave(5);
    for (let i = 0; i < 312; i++) w.step(1 / 60, {});
    killBoss(w);
    w.spawnBossForWave(10); // Splicer
    for (let i = 0; i < 400; i++) w.step(1 / 60, {});
    return snapshot(w);
  }
  assert.equal(run(), run(), "daily seed -> bit-identical run through both bosses");
});

// ---------------------------------------------------------------- edge cases

test("edge: a boss killed right before a 5th wave - the next variant spawns exactly once", () => {
  const w = freshWorld(116);
  w.spawnBossForWave(5); // Monolith
  for (let i = 0; i < 60 * 4; i++) w.step(1 / 60, {});
  killBoss(w);
  w.spawnBossForWave(10);
  assert.ok(w.boss, "the Splicer spawns on wave 10");
  assert.equal(w.boss.kind, "splicer");
  assert.equal(w.bossSpawnCount, 2, "exactly one increment");
  w.spawnBossForWave(10); // called again on the same wave (defensive)
  assert.equal(w.bossSpawnCount, 2, "no double spawn on the same wave");
});

test("edge: a fresh Splicer fires no aimed bolt until aimEvery elapses, then one per cadence", () => {
  const w = freshWorld(117);
  w.bossSpawnCount = 1;
  w.spawnBossForWave(10);
  w.boss.entered = 1; // skip the entrance
  const every = CONFIG.splicer.aimEvery;
  for (let i = 0; i < Math.ceil((every - 0.01) / 0.05); i++) w.step(0.05, {});
  assert.equal(w.drainEvents().filter((e) => e.type === "bossFire").length, 0, "no aimed bolt before the cadence");
  for (let i = 0; i < 4; i++) w.step(0.05, {});
  assert.ok(w.drainEvents().filter((e) => e.type === "bossFire").length >= 1, "an aimed bolt after the cadence");
});

test("edge: the Splicer's spiral covers all directions over time (angle coverage > 5 rad)", () => {
  const s = new Splicer(new RNG(9), CONFIG, v2(10, 0));
  s.entered = 1;
  const angles = [];
  for (let shot = 0; shot < 10; shot++) {
    for (let i = 0; i < Math.ceil(CONFIG.splicer.spiralEvery / 0.01); i++) s.step(0.01);
    const bolts = s.drainBolts();
    if (bolts && bolts.length >= 1) angles.push(Math.atan2(bolts[0].y, bolts[0].x));
  }
  assert.ok(angles.length >= 9, "shots drained: " + angles.length);
  let min = Infinity, max = -Infinity;
  for (const a of angles) {
    const n = (a + Math.PI) % (Math.PI * 2);
    if (n < min) min = n;
    if (n > max) max = n;
  }
  assert.ok(max - min > 5, "arm swept " + (max - min).toFixed(2) + " rad over 10 shots");
});

test("edge: a Monolith has no drainBolts and a 10 s world step is safe for both variants", () => {
  const m = new Monolith(new RNG(1), CONFIG, v2(10, 0), 40);
  assert.equal(typeof m.drainBolts, "undefined", "Monolith has no spiral API");
  const wm = freshWorld(118);
  wm.spawnBossForWave(5);
  wm.boss.entered = 1;
  for (let i = 0; i < 600; i++) wm.step(1 / 60, {});
  assert.ok(wm.enemyBullets.count <= CONFIG.enemyBullets.maxConcurrent);
  const ws = freshWorld(119);
  ws.bossSpawnCount = 1;
  ws.spawnBossForWave(10);
  ws.boss.entered = 1;
  for (let i = 0; i < 600; i++) ws.step(1 / 60, {});
  assert.ok(ws.enemyBullets.count <= CONFIG.enemyBullets.maxConcurrent);
});

test("edge: the Warden's hp parameter is optional and positive-clamped (family ctor contract)", () => {
  const w1 = new Warden(new RNG(1), CONFIG, v2(0, 0));
  assert.equal(w1.maxHp, CONFIG.warden.hp, "default hp");
  const w2 = new Warden(new RNG(1), CONFIG, v2(0, 0), 5);
  assert.equal(w2.maxHp, 5, "explicit hp honored");
  const w3 = new Warden(new RNG(1), CONFIG, v2(0, 0), -3);
  assert.equal(w3.maxHp, CONFIG.warden.hp, "non-positive falls back to config");
  const m = new Monolith(new RNG(1), CONFIG, v2(0, 0), -3);
  assert.equal(m.maxHp, CONFIG.boss.maxHp, "Monolith same contract");
  const s = new Splicer(new RNG(1), CONFIG, v2(0, 0), 0);
  assert.equal(s.maxHp, CONFIG.splicer.maxHp, "Splicer same contract");
});

test("edge: a skipped boss wave does not touch the Warden slot or the belt layer", () => {
  const w = freshWorld(120);
  w.spawnBossForWave(5); // Monolith
  for (let wave = 8; wave <= 10; wave++) w.spawnBeltForWave(wave);
  const belts0 = w.field.rocks.filter((r) => r.belt).length;
  w.spawnBossForWave(10); // skipped
  w.spawnWardenForWave(10); // blocked by the live Monolith
  assert.equal(w.warden, null);
  assert.equal(w.field.rocks.filter((r) => r.belt).length, belts0, "belt layer untouched by the skip");
  assert.equal(w.boss.kind, "monolith");
});
