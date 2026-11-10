// ST-129: drone.maxAge seeker-battery tests. Drones self-destruct after
// CONFIG.drone.maxAge (game-time) seconds so they cannot accumulate unboundedly
// onto boss waves (I129 playtest finding). Field-level tests cover the mechanics;
// the world-level test covers the droneDecay event.
import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/core/game.js";
import { RNG } from "../src/core/rng.js";
import { CONFIG } from "../src/core/config.js";
import { DroneField } from "../src/core/drones.js";
import { v2 } from "../src/core/math.js";

const DT = 1 / 60;
const NEUTRAL = { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false };
const MAXAGE = CONFIG.drone.maxAge;

test("drone battery: alive just before maxAge, decayed just after", () => {
  const f = new DroneField(new RNG(901));
  const dn = f.spawn(v2(0, 0));
  assert.ok(dn);
  for (let i = 0; i < Math.ceil(MAXAGE) - 1; i++) f.step(1.0, v2(0, 0)); // age = MAXAGE - 1
  assert.equal(f.count, 1, "still alive at age " + (MAXAGE - 1));
  f.step(1.0, v2(0, 0)); // age = MAXAGE
  assert.equal(f.count, 0, "decayed at age " + MAXAGE);
  assert.equal(f.decayed.length, 1, "one decay recorded");
  assert.equal(f.decayed[0].id, dn.id, "decay carries the drone id");
  const d = Math.hypot(f.decayed[0].pos.x, f.decayed[0].pos.y);
  assert.ok(d <= CONFIG.arena.radius + 1e-6, "decay pos inside the arena");
});

test("drone battery: decayed drones free their slot (spawn succeeds after decay)", () => {
  const f = new DroneField(new RNG(902));
  const cap = CONFIG.drone.maxConcurrent;
  for (let i = 0; i < cap; i++) { assert.ok(f.spawn(v2(0, 0))); }
  assert.equal(f.spawn(v2(0, 0)), null, "field full at the cap");
  f.step(MAXAGE + 1, v2(0, 0)); // every drone expires in one big step
  assert.equal(f.count, 0, "all drones decayed");
  assert.ok(f.spawn(v2(0, 0)), "spawn succeeds once the field is free");
});

test("drone battery: a bullet-killed drone does not double-decay", () => {
  const f = new DroneField(new RNG(903));
  const dn = f.spawn(v2(0, 0));
  assert.ok(f.destroy(dn.id), "bullet kill path");
  for (let i = 0; i < MAXAGE + 2; i++) f.step(1.0, v2(0, 0));
  assert.equal(f.count, 0);
  assert.equal(f.decayed.length, 0, "no decay recorded for a bullet-killed drone");
});

test("drone battery: age ticks with the dt passed in (slow-mo semantics)", () => {
  const f = new DroneField(new RNG(904));
  f.spawn(v2(0, 0));
  // half-speed dt (as if enemyScale = 0.5 under slow-mo): battery drains twice as
  // slowly in real time, exactly tracking the scaled drone motion.
  const half = 1.0 / 2;
  for (let i = 0; i < (MAXAGE / half) - 1; i++) f.step(half, v2(0, 0)); // scaled age = MAXAGE - 0.5
  assert.equal(f.count, 1, "alive at scaled age " + (MAXAGE - 0.5));
  f.step(half, v2(0, 0)); // scaled age = MAXAGE
  assert.equal(f.count, 0, "decayed at scaled age " + MAXAGE);
});

test("world: droneDecay event emitted once at the decay position", () => {
  const w = new World(new RNG(905));
  w.begin();
  w.waves.state = "idle"; // freeze the director: no waves/rocks/mines/boss/wave-drone spawns
  const dn = w.drones.spawn(w.ship.pos);
  assert.ok(dn, "drone spawned directly into the world");
  // Park the seeker on the rim opposite the ship (origin) so its battery - not a
  // ship collision - is what ends it. Reparked after every step (deterministic).
  const park = { x: -(CONFIG.arena.radius - CONFIG.drone.radius - 0.5), y: 0 };
  dn.pos.x = park.x; dn.pos.y = park.y;
  let decays = [];
  for (let i = 0; i < Math.ceil(MAXAGE) - 1; i++) {
    w.step(1.0, NEUTRAL);
    const d = w.drones.drones[0];
    if (d) { d.pos.x = park.x; d.pos.y = park.y; }
    for (const e of w.drainEvents()) if (e.type === "droneDecay") decays.push(e);
  }
  assert.equal(decays.length, 0, "no decay before maxAge");
  assert.equal(w.drones.count, 1, "drone still alive before maxAge");
  w.step(1.0, NEUTRAL);
  const evs = w.drainEvents();
  decays = evs.filter((e) => e.type === "droneDecay");
  assert.equal(decays.length, 1, "exactly one droneDecay at maxAge");
  const p = decays[0].data.pos;
  assert.ok(Math.abs(p.x - park.x) < 1e-9 && Math.abs(p.y - park.y) < 1e-9, "decay at the pre-step (parked) position");
  assert.equal(w.drones.count, 0, "drone gone from the field");
});

test("drone battery: deterministic decay step for a fixed seed", () => {
  const decayStep = (seed) => {
    const f = new DroneField(new RNG(seed));
    f.spawn(v2(0, 0));
    for (let i = 1; i <= MAXAGE + 5; i++) {
      f.step(1.0, v2(0, 0));
      if (f.count === 0) return i;
    }
    return -1;
  };
  const a = decayStep(906);
  const b = decayStep(906);
  assert.notEqual(a, -1, "drone decayed");
  assert.equal(a, b, "same seed -> same decay step");
  assert.ok(a <= MAXAGE + 1 && a >= MAXAGE - 1, "decay lands on the maxAge boundary");
});
