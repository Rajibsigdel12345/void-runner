// ST-138: asteroid belt (drifting indestructibles) - unit tests. LF, node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { v2Len } from "../src/core/math.js";

function freshWorld(seed) {
  const w = new World(new RNG(seed), CONFIG);
  w.begin();
  w.field.clear();
  w.waves.state = "idle"; // freeze the director
  return w;
}

function beltRocks(w) { return w.field.rocks.filter(r => r.belt); }

test("config: belt block shape and values", () => {
  const b = CONFIG.belt;
  assert.equal(b.fromWave, 8);
  assert.equal(b.max, 5);
  assert.equal(b.size, "M");
  assert.ok(Array.isArray(b.speed) && b.speed.length === 2, "speed is a range");
  assert.ok(b.speed[0] > 0 && b.speed[0] < b.speed[1], "low < high");
  assert.ok(b.speed[1] < CONFIG.ship.maxSpeed, "much slower than the ship - a drift, not a chase");
});

test("spawn rules: nothing before fromWave, one per wave after, capped at max", () => {
  const w = freshWorld(7);
  w.spawnBeltForWave(7);
  assert.equal(beltRocks(w).length, 0, "no belt rock on wave 7");
  w.spawnBeltForWave(8);
  assert.equal(beltRocks(w).length, 1, "one belt rock on wave 8");
  for (let wave = 9; wave <= 12; wave++) w.spawnBeltForWave(wave);
  assert.equal(beltRocks(w).length, CONFIG.belt.max, "capped at max after waves 8-12");
  w.spawnBeltForWave(13);
  assert.equal(beltRocks(w).length, CONFIG.belt.max, "cap holds on later waves");
});

test("belt rocks spawn at the rim, kept away from the ship, drifting slowly", () => {
  const w = freshWorld(11);
  w.ship.pos.x = 20; w.ship.pos.y = 0; // park the ship near the rim to exercise the re-roll
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  assert.ok(r, "rock spawned");
  assert.equal(r.size, "M");
  assert.ok(Math.abs(v2Len(r.pos) - (CONFIG.arena.radius - r.radius * 0.5)) < 0.01, "spawned at the rim");
  const dShip = Math.hypot(r.pos.x - w.ship.pos.x, r.pos.y - w.ship.pos.y);
  assert.ok(dShip >= 10 - 0.01, "kept at least 10 u from the ship");
  const sp = v2Len(r.vel);
  assert.ok(sp >= CONFIG.belt.speed[0] - 0.001 && sp <= CONFIG.belt.speed[1] + 0.001, "drift speed within the belt range");
});

test("belt rocks are exempt from the normal rock cap", () => {
  const w = freshWorld(13);
  while (w.field.count < CONFIG.asteroid.maxConcurrent) w.field.spawn("S", 1, { x: 1, y: 1 });
  assert.equal(w.field.count, CONFIG.asteroid.maxConcurrent, "field filled to the cap");
  w.spawnBeltForWave(8);
  assert.equal(beltRocks(w).length, 1, "belt rock spawns despite the cap");
  assert.equal(w.field.count, CONFIG.asteroid.maxConcurrent + 1, "total = cap + 1 belt rock");
});

test("indestructible: field.hit never destroys a belt rock", () => {
  const w = freshWorld(17);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  for (let i = 0; i < 20; i++) {
    const res = w.field.hit(r.id);
    assert.equal(res.destroyed, false, "never destroyed");
    assert.equal(res.belt, true, "reports belt");
  }
  assert.equal(r.dead, false, "still alive after 20 hits");
});

test("indestructible: a live bullet is consumed - no score, no split, beltHit emitted", () => {
  const w = freshWorld(19);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  const score0 = w.score;
  w.weapons.bullets.push({ id: 901, pos: { x: r.pos.x, y: r.pos.y }, radius: 2, dead: false });
  w.resolveBulletRocks();
  assert.equal(w.weapons.bullets.length, 0, "bullet consumed");
  assert.equal(r.dead, false, "belt rock survives the shot");
  assert.equal(beltRocks(w).length, 1, "no fragments");
  assert.equal(w.score, score0, "no score from a belt rock");
  const evs = w.drainEvents();
  const beltHit = evs.find(e => e.type === "beltHit");
  assert.ok(beltHit, "beltHit event emitted");
  assert.deepEqual(beltHit.data, { x: r.pos.x, y: r.pos.y }, "beltHit carries the rock pos");
  assert.equal(evs.find(e => e.type === "kill"), undefined, "no kill event");
});

test("indestructible: bombs leave belt rocks alone", () => {
  const w = freshWorld(23);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  assert.equal(w.field.shatter(r.id), false, "shatter refuses belt rocks");
  assert.equal(r.dead, false, "still alive");
});

test("indestructible: destroy() never splits a belt rock", () => {
  const w = freshWorld(29);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  const children = w.field.destroy(r.id);
  assert.deepEqual(children, [], "no fragments from a belt rock");
});

test("collision: contact costs a life, the belt rock survives, invuln blocks a second hit", () => {
  const w = freshWorld(31);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  w.ship.pos.x = r.pos.x; w.ship.pos.y = r.pos.y; // park the ship on the rock
  const lives0 = w.lives;
  w.resolveShipRocks();
  const evs = w.drainEvents();
  assert.ok(evs.find(e => e.type === "hit"), "hit event on contact");
  assert.equal(w.lives, lives0 - 1, "one life lost");
  assert.equal(r.dead, false, "belt rock survives the hit");
  w.resolveShipRocks(); // still overlapping
  assert.equal(w.lives, lives0 - 1, "invulnerability window: no second life lost");
});

test("drift: belt rocks move and stay inside the arena over long steps", () => {
  const w = freshWorld(37);
  w.spawnBeltForWave(8);
  const r = beltRocks(w)[0];
  const p0x = r.pos.x, p0y = r.pos.y;
  for (let i = 0; i < 600; i++) w.field.step(0.1); // 60 s of drift
  assert.ok(Math.abs(r.pos.x - p0x) + Math.abs(r.pos.y - p0y) > 0.1, "position changed");
  assert.ok(v2Len(r.pos) + r.radius <= CONFIG.arena.radius + 0.01, "stays inside the arena");
});

test("determinism: same seed -> identical belt rock positions and velocities", () => {
  const a = freshWorld(42), b = freshWorld(42);
  for (let wave = 8; wave <= 10; wave++) { a.spawnBeltForWave(wave); b.spawnBeltForWave(wave); }
  const A = beltRocks(a), B = beltRocks(b);
  assert.equal(A.length, B.length);
  A.forEach((r, i) => {
    assert.equal(r.pos.x, B[i].pos.x);
    assert.equal(r.pos.y, B[i].pos.y);
    assert.equal(r.vel.x, B[i].vel.x);
    assert.equal(r.vel.y, B[i].vel.y);
  });
});
