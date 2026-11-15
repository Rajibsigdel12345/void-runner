// ST-381 (I411): transient debris shatter pool - shared live cap + steady-state
// contract. Render-layer module (imports three), but pure JS in node (no GL until
// render), so the pool contract is unit-testable with a stub scene.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import { createDebrisField } from "../src/render/debrisField.js";

const STUB_SCENE = { add() {} };
const BURST = { count: 6, speed: 5, life: 0.5, scaleMin: 0.4, scaleMax: 0.8, tint: 0xffffff };
function makeField() {
  return createDebrisField(STUB_SCENE, CONFIG.debris);
}
function assertFiniteInstanceData(d) {
  for (const m of d.meshes) {
    const a = m.instanceMatrix.array;
    for (let i = 0; i < m.count * 16; i++) assert.ok(Number.isFinite(a[i]), "NaN/Inf in instanceMatrix");
  }
}

test("at rest: 0 live, both instanced meshes hidden (+0 steady-state draw calls)", () => {
  const d = makeField();
  assert.equal(d.live, 0);
  assert.equal(d.meshes.length, 2);
  for (const m of d.meshes) {
    assert.equal(m.visible, false);
    assert.equal(m.count, 0);
  }
  d.update(0); // early-out, no crash
  assert.equal(d.live, 0);
});

test("shared live cap: bursts summing above pool steal the oldest, live never exceeds pool", () => {
  const d = makeField();
  // 5 bursts x 6 shards = 30 requested > pool (24) - the bomb-blast worst case.
  for (let i = 0; i < 5; i++) d.spawnShatter(0, 0, BURST);
  assert.equal(d.live, CONFIG.debris.pool);
  d.update(1 / 60);
  assert.equal(d.meshes[0].count + d.meshes[1].count, CONFIG.debris.pool);
  for (const m of d.meshes) assert.ok(m.count <= CONFIG.debris.pool);
  assertFiniteInstanceData(d);
  // further bursts keep it pinned at the cap (steal, not grow)
  d.spawnShatter(0, 0, BURST);
  assert.equal(d.live, CONFIG.debris.pool);
});

test("under cap: exact count, per-mesh split by alternating cursor, finite instance data", () => {
  const d = makeField();
  d.spawnShatter(1, 2, { ...BURST, count: 4 });
  assert.equal(d.live, 4);
  d.update(1 / 60);
  assert.equal(d.meshes[0].count + d.meshes[1].count, 4);
  for (const m of d.meshes) assert.equal(m.visible, true);
  assertFiniteInstanceData(d);
});

test("natural death: shards die at life end, meshes return to hidden steady state", () => {
  const d = makeField();
  for (let i = 0; i < 5; i++) d.spawnShatter(0, 0, BURST); // capped at pool
  d.update(1.0); // > max life (0.5) - all shards must die
  assert.equal(d.live, 0);
  for (const m of d.meshes) {
    assert.equal(m.visible, false);
    assert.equal(m.count, 0);
  }
});
