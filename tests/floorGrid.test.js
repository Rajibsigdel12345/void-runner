// ST-257 (I269): arena floor grid layout + radial falloff invariants.
// Pure config + math checks (DOM-free), same shape as flame.test.js.
import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../src/core/config.js";
import {
  falloff,
  gridColorAt,
  ringRadii,
  gridVertexCount,
  gridSegmentCount,
} from "../src/core/floorGrid.js";

const A = CONFIG.arena;
const G = A.grid;
const BRIGHT = hexRGB(A.gridBright);
const DIM = hexRGB(A.gridDim);

function hexRGB(h) {
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}
function luma(c) {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// The ST-177 FX-off floor proxy (tests/paletteHarmony.test.js):
// bg = max(NEBULA_LUMA=51, luma(gridBright)); bomb pickup must clear 59.
const NEBULA_LUMA = 51;
const BOMB = 0xff5252;

test("ST-257: layout is sparser than the old PolarGridHelper (12 spokes / 8 rings x 64)", () => {
  assert.ok(G.sectors <= 8, "spokes " + G.sectors + " <= 8");
  assert.ok(G.rings <= 5, "rings " + G.rings + " <= 5");
  assert.ok(G.sectors >= 4 && G.rings >= 3, "still reads as a grid");
  assert.ok(G.divisions < 64, "divisions " + G.divisions + " < 64");
  const oldSegs = 12 * 2 + 8 * 64; // old helper: 12 spokes + 8 ring loops of 64
  const newSegs = gridSegmentCount(G.rings, G.sectors, G.divisions, G.spokeSegs);
  assert.ok(newSegs < oldSegs, "fewer line segments: " + newSegs + " < " + oldSegs);
});

test("ST-257: ring radii tile the arena exactly", () => {
  const radii = ringRadii(A.radius, G.rings);
  assert.equal(radii.length, G.rings);
  for (let i = 0; i < G.rings; i++) {
    assert.ok(Math.abs(radii[i] - (A.radius / G.rings) * (i + 1)) < 1e-9, "ring " + i);
  }
  assert.ok(Math.abs(radii[G.rings - 1] - A.radius) < 1e-9, "outer ring sits on the arena edge");
});

test("ST-257: falloff is 1 at center, 0 at edge, monotone, clamped", () => {
  assert.equal(falloff(0, G.falloffPow), 1);
  assert.equal(falloff(1, G.falloffPow), 0);
  let prev = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const f = falloff(Math.min(t, 1), G.falloffPow);
    assert.ok(f <= prev + 1e-12, "monotone at t=" + t.toFixed(2));
    prev = f;
  }
  assert.equal(falloff(-1, G.falloffPow), falloff(0, G.falloffPow), "clamped below");
  assert.equal(falloff(2, G.falloffPow), falloff(1, G.falloffPow), "clamped above");
});

test("ST-257: grid is warm neutral (R>G>B) at both anchors and every mix stop", () => {
  for (const c of [BRIGHT, DIM]) {
    assert.ok(c[0] > c[1] && c[1] > c[2], "anchor R>G>B: " + c.join(","));
  }
  for (let i = 0; i <= 20; i++) {
    const c = gridColorAt(DIM, BRIGHT, i / 20, G.falloffPow);
    assert.ok(c[0] >= c[1] && c[1] >= c[2], "stop " + i + " R>=G>=B: " + c.join(","));
  }
});

test("ST-257: radial falloff - ring lumas decrease inner->outer, dim band under FLOOR 50", () => {
  const radii = ringRadii(A.radius, G.rings);
  const lumas = radii.map((r) => luma(gridColorAt(DIM, BRIGHT, r / A.radius, G.falloffPow)));
  for (let i = 1; i < lumas.length; i++) {
    assert.ok(lumas[i] <= lumas[i - 1] + 0.01, "ring " + i + " not brighter than ring " + (i - 1) + ": " + lumas.map((l) => l.toFixed(1)).join("/"));
  }
  for (const l of lumas) assert.ok(l < 50, "ring luma " + l.toFixed(1) + " < 50 (dim band)");
  assert.deepEqual(gridColorAt(DIM, BRIGHT, 1, G.falloffPow), DIM, "edge = dim anchor");
});

test("ST-257: spoke ramp - hub = bright anchor, tip = dim anchor, monotone", () => {
  assert.deepEqual(gridColorAt(DIM, BRIGHT, 0, G.falloffPow), BRIGHT, "hub = bright anchor");
  assert.deepEqual(gridColorAt(DIM, BRIGHT, 1, G.falloffPow), DIM, "tip = dim anchor");
  let prev = Infinity;
  for (let s = 0; s <= G.spokeSegs; s++) {
    const l = luma(gridColorAt(DIM, BRIGHT, s / G.spokeSegs, G.falloffPow));
    assert.ok(l <= prev + 0.01, "spoke ramp monotone at " + s);
    prev = l;
  }
});

test("ST-257: ST-177 FX-off floor still clears (bomb pickup vs max(nebula, gridBright))", () => {
  const bg = Math.max(NEBULA_LUMA, luma(BRIGHT));
  const bombL = luma(hexRGB(BOMB));
  assert.ok(bombL - bg >= 59, "bomb " + bombL.toFixed(1) + " - " + bg.toFixed(1) + " >= 59");
  assert.ok(luma(BRIGHT) <= luma(hexRGB(BOMB)) - 59, "bright anchor kept under the bomb margin");
});

test("ST-257: geometry bookkeeping is exact (5 rings x 48 + 8 spokes x 8 = 304 segs)", () => {
  const v = gridVertexCount(G.rings, G.sectors, G.divisions, G.spokeSegs);
  const s = gridSegmentCount(G.rings, G.sectors, G.divisions, G.spokeSegs);
  assert.equal(s, G.rings * G.divisions + G.sectors * G.spokeSegs);
  assert.equal(v, s * 2);
  assert.equal(s, 5 * 48 + 8 * 8, "default config = 304 segments");
});
