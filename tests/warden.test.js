// ST-136: WARDEN armored drone mini-boss - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { Warden } from "../src/core/warden.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2, v2Len } from "../src/core/math.js";

const SHIP = { x: 0, y: 0 };

function freshWarden() { return new Warden(new RNG(1), CONFIG, v2(0, 0)); }

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  return w;
}

function pushBullet(w, id) {
  w.weapons.bullets.push({ id, pos: { x: w.warden.pos.x, y: w.warden.pos.y }, radius: 2, dead: false });
}

test("config: warden block shape and values", () => {
  const wd = CONFIG.warden;
  assert.equal(wd.armor, 6);
  assert.equal(wd.hp, 12);
  assert.equal(wd.radius, 1.7);
  assert.equal(wd.speed, 2.4);
  assert.equal(wd.turn, 1.5);
  assert.equal(wd.spin, 0.9);
  assert.equal(wd.splitCount, 2);
  assert.equal(wd.score, 400);
  assert.ok(wd.speed < CONFIG.ship.maxSpeed, "slower than the ship - dodgeable");
});

test("hit model: armor absorbs exactly armor hits with no HP loss", () => {
  const wd = freshWarden();
  const hp0 = wd.hp;
  for (let i = 0; i < CONFIG.warden.armor; i++) {
    const r = wd.hit();
    assert.deepEqual(r, { absorbed: true, killed: false });
    assert.equal(wd.hp, hp0, "HP untouched while armor lasts");
    assert.equal(wd.armor, CONFIG.warden.armor - 1 - i);
  }
  assert.equal(wd.armor, 0);
  assert.equal(wd.hp, hp0);
});

test("hit model: after armor, HP chips and the killing hit reports killed", () => {
  const wd = freshWarden();
  for (let i = 0; i < CONFIG.warden.armor; i++) wd.hit();
  for (let i = 0; i < CONFIG.warden.hp - 1; i++) {
    assert.deepEqual(wd.hit(), { absorbed: false, killed: false });
  }
  assert.equal(wd.alive, true);
  const last = wd.hit();
  assert.deepEqual(last, { absorbed: false, killed: true });
  assert.equal(wd.alive, false);
  assert.equal(wd.hp, 0);
});

test("hit model: total hits to kill = armor + hp; dead warden ignores hits", () => {
  const wd = freshWarden();
  let hits = 0;
  while (wd.alive) { wd.hit(); hits++; }
  assert.equal(hits, CONFIG.warden.armor + CONFIG.warden.hp);
  assert.deepEqual(wd.hit(), { absorbed: false, killed: false }, "no re-kill");
});

test("movement: homing closes the gap at bounded speed toward the ship", () => {
  const wd = new Warden(new RNG(1), CONFIG, v2(10, 0));
  const d0 = v2Len(wd.pos);
  wd.step(0.1, SHIP);
  const d1 = v2Len(wd.pos);
  assert.ok(d1 < d0, "distance to the ship shrinks");
  assert.ok(Math.abs(wd.pos.x - (10 - CONFIG.warden.speed * 0.1)) < 1e-9, "head-on approach is straight");
  assert.ok(Math.abs(wd.pos.y) < 1e-9, "no lateral drift on a straight heading");
  assert.ok(Math.abs(d1 - (d0 - CONFIG.warden.speed * 0.1)) < 1e-9);
});

test("movement: arena clamp keeps the warden inside the rim", () => {
  const R = CONFIG.arena.radius;
  const wd = new Warden(new RNG(1), CONFIG, v2(R + 5, 0));
  wd.step(0.1, SHIP);
  assert.ok(v2Len(wd.pos) <= R - wd.radius + 1e-9, "clamped to the rim");
  assert.ok(wd.pos.x > 0, "clamp scales the position, no teleport across the arena");
});

test("world spawn rules: 5th waves without a live Monolith only", () => {
  const w = freshWorld(11);
  w.spawnWardenForWave(5);
  assert.ok(w.warden, "5th wave, no boss -> warden spawns");
  const spawnEv = w.drainEvents().find((e) => e.type === "wardenSpawn");
  assert.ok(spawnEv, "wardenSpawn event");
  assert.equal(spawnEv.data.hp, CONFIG.warden.hp);

  w.warden = null;
  w.spawnWardenForWave(7);
  assert.equal(w.warden, null, "non-5th wave -> no warden");

  w.spawnBossForWave(5);
  assert.ok(w.boss, "Monolith spawns on wave 5");
  w.spawnWardenForWave(10);
  assert.equal(w.warden, null, "5th wave with a live Monolith -> no warden");

  w.boss = null; // Monolith dead by wave start
  w.spawnWardenForWave(10);
  assert.ok(w.warden, "5th wave with the Monolith dead -> warden spawns");
});

test("world: bullets drain armor first (wardenArmor pings), then HP", () => {
  const w = freshWorld(12);
  w.spawnWardenForWave(5);
  const hp0 = w.warden.hp;
  for (let i = 0; i < CONFIG.warden.armor; i++) {
    pushBullet(w, 9000 + i);
    w.resolveBulletWarden();
  }
  const pings = w.drainEvents().filter((e) => e.type === "wardenArmor");
  assert.equal(pings.length, CONFIG.warden.armor, "one ping per absorbed hit");
  assert.equal(pings[pings.length - 1].data.armor, 0, "last ping reports the armor gone");
  assert.equal(w.warden.hp, hp0, "HP never touched by armor hits");
  for (let i = 0; i < CONFIG.warden.hp - 1; i++) {
    pushBullet(w, 9100 + i);
    w.resolveBulletWarden();
  }
  assert.ok(w.warden.alive, "one hit from death");
  pushBullet(w, 9999);
  w.resolveBulletWarden();
  assert.equal(w.warden, null, "killing hit clears the warden");
});

test("world: wardenDeath pays score and splits into S rocks", () => {
  const w = freshWorld(13);
  w.spawnWardenForWave(5);
  const s0 = w.field.rocks.filter((r) => !r.dead && r.size === "S").length;
  const score0 = w.score;
  const total = CONFIG.warden.armor + CONFIG.warden.hp;
  for (let i = 0; i < total; i++) { pushBullet(w, 9500 + i); w.resolveBulletWarden(); }
  const evs = w.drainEvents();
  assert.ok(evs.some((e) => e.type === "wardenDeath"), "wardenDeath event");
  const kill = evs.find((e) => e.type === "kill");
  assert.ok(kill, "kill event for the score");
  assert.equal(kill.data.size, "warden");
  assert.ok(kill.data.points >= CONFIG.warden.score, "pays the warden score");
  assert.ok(w.score > score0, "score increased");
  const s1 = w.field.rocks.filter((r) => !r.dead && r.size === "S").length;
  assert.equal(s1 - s0, CONFIG.warden.splitCount, "split S rocks spawned");
});

test("world: contact with the ship costs a life; the warden survives", () => {
  const w = freshWorld(14);
  w.spawnWardenForWave(5);
  const lives0 = w.lives;
  w.warden.pos.x = CONFIG.ship.radius + w.warden.radius - 0.05;
  w.warden.pos.y = 0;
  w.resolveShipWarden();
  assert.equal(w.lives, lives0 - 1, "one life lost");
  assert.ok(w.warden.alive, "the drone survives the touch");
  assert.ok(w.drainEvents().some((e) => e.type === "hit"), "hit event for the ship");
});

test("ST-385: fresh warden has no hit-flash (hitFlash 0 at rest)", () => {
  const wd = freshWarden();
  assert.equal(wd.hitFlash, 0, "hitFlash starts at 0");
});

test("ST-385: absorbed armor hits do not trigger the hit-flash", () => {
  const wd = freshWarden(); // armor 6
  for (let i = 0; i < 6; i++) {
    const r = wd.hit();
    assert.equal(r.absorbed, true, "armor hit absorbed");
  }
  assert.equal(wd.armor, 0, "armor fully spent");
  assert.equal(wd.hitFlash, 0, "no flash on absorbed hits");
});

test("ST-385: a non-absorbed HP hit spikes the hit-flash to 1", () => {
  const wd = freshWarden();
  for (let i = 0; i < 6; i++) wd.hit(); // spend the 6 armor
  const r = wd.hit(); // first HP hit
  assert.equal(r.absorbed, false, "not absorbed");
  assert.equal(r.killed, false, "not yet killed");
  assert.equal(wd.hitFlash, 1, "hitFlash spiked to 1");
});

test("ST-385: the killing HP hit also spikes the hit-flash to 1", () => {
  const wd = freshWarden();
  wd.armor = 0; // bypass the armor layer
  wd.hp = 1;    // one HP hit to kill
  const r = wd.hit();
  assert.equal(r.killed, true, "killing hit");
  assert.equal(wd.hitFlash, 1, "the kill hit still flashes");
});

test("ST-385: the hit-flash decays to 0 over time (Math.max floor)", () => {
  const wd = freshWarden();
  wd.hitFlash = 1;
  let prev = wd.hitFlash;
  for (let i = 0; i < 60; i++) {
    wd.step(1 / 60, SHIP);
    assert.ok(wd.hitFlash <= prev + 1e-9, "monotone non-increasing");
    prev = wd.hitFlash;
  }
  assert.ok(wd.hitFlash < 1, "decayed from 1");
  wd.step(1, SHIP);
  assert.equal(wd.hitFlash, 0, "clamped to exactly 0");
});

test("ST-385: the hit-flash timeline is deterministic across identical wardens", () => {
  const a = freshWarden();
  const b = freshWarden();
  for (let i = 0; i < 6; i++) { a.hit(); b.hit(); } // spend armor on both
  a.hit(); b.hit(); // first HP hit on both
  assert.equal(a.hitFlash, b.hitFlash, "same spike");
  assert.equal(a.hitFlash, 1, "spike was 1");
  for (let i = 0; i < 40; i++) {
    a.step(1 / 60, SHIP); b.step(1 / 60, SHIP);
    assert.equal(a.hitFlash, b.hitFlash, "identical decay at each step");
  }
});
