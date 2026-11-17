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
  discGradientStops,
  restFalloff,
  restGridColorAt,
  totalRingCount,
  fullRingLayout,
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
const BOMB = 0xffa84a; // I464/ST-432 C1: bomb hue red->amber (contrast invariant unchanged, margin widens)

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

// ST-277 (I294): radial floor disc (arena depth cut) - config + stop math.
const DISC = A.floorDisc;

test("ST-277: disc gradient stops are warm neutral R>G>B, luma center>mid>rim, all under FLOOR 50", () => {
  const stops = discGradientStops(DISC);
  assert.equal(stops.length, 3);
  const lumas = stops.map(([, r, g, b]) => luma([r, g, b]));
  for (const [t, r, g, b] of stops) {
    assert.ok(r > g && g > b, "stop t=" + t + " warm neutral R>G>B: " + [r, g, b].join(","));
    assert.ok(luma([r, g, b]) < 50, "stop luma " + luma([r, g, b]).toFixed(1) + " < 50 (floor-ceiling)");
  }
  assert.ok(lumas[0] > lumas[1] && lumas[1] > lumas[2], "luma decreases center->rim: " + lumas.map((l) => l.toFixed(1)).join("/"));
  assert.equal(stops[0][0], 0, "hub stop at t=0");
  assert.equal(stops[2][0], 1, "rim stop at t=1");
  assert.ok(DISC.midT > 0 && DISC.midT < 1, "midT in (0,1): " + DISC.midT);
});

test("ST-277: disc sits just below the grid lines (y<0, small offset)", () => {
  assert.ok(DISC.y < 0, "disc y " + DISC.y + " < 0 (grid at y=0 - no z-fight)");
  assert.ok(Math.abs(DISC.y) < 0.5, "offset small: " + DISC.y);
});

// ST-293 (I315): two-segment rest-band falloff - the readable mid-arena
// plateau the I315 floor audit found missing from the single-exponent ramp.
const RT = G.restT;
const RH = G.restHold;
const RA = G.restPowA;
const RB = G.restPowB;

test("ST-293: restFalloff is 1 at center, 0 at edge, clamped", () => {
  assert.equal(restFalloff(0, RT, RH, RA, RB), 1);
  assert.equal(restFalloff(1, RT, RH, RA, RB), 0);
  assert.equal(restFalloff(-1, RT, RH, RA, RB), restFalloff(0, RT, RH, RA, RB), "clamped below");
  assert.equal(restFalloff(2, RT, RH, RA, RB), restFalloff(1, RT, RH, RA, RB), "clamped above");
});

test("ST-293: restFalloff is monotone non-increasing 0->1", () => {
  let prev = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const f = restFalloff(Math.min(t, 1), RT, RH, RA, RB);
    assert.ok(f <= prev + 1e-12, "monotone at t=" + t.toFixed(2));
    prev = f;
  }
});

test("ST-293: restFalloff is continuous at restT (both segments = restHold)", () => {
  const at = restFalloff(RT, RT, RH, RA, RB);
  assert.ok(Math.abs(at - RH) < 1e-9, "f(restT) = restHold: " + at);
  const e = 1e-4;
  assert.ok(Math.abs(restFalloff(RT - e, RT, RH, RA, RB) - RH) < 1e-2, "approaches restHold from below");
  assert.ok(Math.abs(restFalloff(RT + e, RT, RH, RA, RB) - RH) < 1e-2, "approaches restHold from above");
});

test("ST-293: rest band - mid-arena holds a flat readable plateau", () => {
  const band = [];
  for (let t = 0.2; t <= Math.min(0.6, RT) + 1e-9; t += 0.05) {
    band.push(restFalloff(t, RT, RH, RA, RB));
  }
  const spread = Math.max(...band) - Math.min(...band);
  assert.ok(spread < 0.06, "rest band flat: spread " + spread.toFixed(4) + " < 0.06");
  assert.ok(band[0] < 1, "rest band below the hub");
  assert.ok(band[0] > 0.5, "rest band stays readable (f > 0.5): " + band[0].toFixed(3));
});

test("ST-293: rim depth cut - outer fade is a distinct step below the rest band", () => {
  const rim = restFalloff(0.8, RT, RH, RA, RB);
  assert.ok(rim < RH * 0.5, "rim " + rim.toFixed(3) + " < " + (RH * 0.5) + " (clear step)");
});

test("ST-293: restGridColorAt is warm neutral R>=G>=B at every stop", () => {
  for (let i = 0; i <= 20; i++) {
    const c = restGridColorAt(DIM, BRIGHT, i / 20, RT, RH, RA, RB);
    assert.ok(c[0] >= c[1] && c[1] >= c[2], "stop " + i + " R>=G>=B: " + c.join(","));
  }
});

test("ST-293: rendered ring lumas (rest curve) decrease inner->outer, all under FLOOR 50", () => {
  const radii = ringRadii(A.radius, G.rings);
  const lumas = radii.map((r) => luma(restGridColorAt(DIM, BRIGHT, r / A.radius, RT, RH, RA, RB)));
  for (let i = 1; i < lumas.length; i++) {
    assert.ok(lumas[i] <= lumas[i - 1] + 0.01, "ring " + i + " not brighter than ring " + (i - 1) + ": " + lumas.map((l) => l.toFixed(1)).join("/"));
  }
  for (const l of lumas) assert.ok(l < 50, "ring luma " + l.toFixed(1) + " < 50 (FLOOR-50 dim band)");
  assert.deepEqual(restGridColorAt(DIM, BRIGHT, 1, RT, RH, RA, RB), DIM, "edge = dim anchor");
  assert.deepEqual(restGridColorAt(DIM, BRIGHT, 0, RT, RH, RA, RB), BRIGHT, "hub = bright anchor");
});

test("ST-293: spoke ramp (rest curve) is monotone, hub = bright, tip = dim", () => {
  assert.deepEqual(restGridColorAt(DIM, BRIGHT, 0, RT, RH, RA, RB), BRIGHT, "hub = bright anchor");
  assert.deepEqual(restGridColorAt(DIM, BRIGHT, 1, RT, RH, RA, RB), DIM, "tip = dim anchor");
  let prev = Infinity;
  for (let s = 0; s <= G.spokeSegs; s++) {
    const l = luma(restGridColorAt(DIM, BRIGHT, s / G.spokeSegs, RT, RH, RA, RB));
    assert.ok(l <= prev + 0.01, "spoke ramp monotone at " + s);
    prev = l;
  }
});

test("ST-293: rest-band params are data-driven + geometry bookkeeping unchanged (304 segs)", () => {
  assert.ok(RT > 0 && RT < 1, "restT in (0,1): " + RT);
  assert.ok(RH > 0 && RH < 1, "restHold in (0,1): " + RH);
  assert.ok(RA > 0 && RB > 0, "positive powers: " + RA + ", " + RB);
  assert.equal(gridSegmentCount(G.rings, G.sectors, G.divisions, G.spokeSegs), 5 * 48 + 8 * 8, "304 segs unchanged");
});

// ST-328 (I359): full ring layout - main + hub + rim rings (data-driven,
// render-only; the render keeps one LineSegments draw call, zero sim).
test("ST-328: totalRingCount = main + hub + rim", () => {
  const hub = (G.hubRings || []).length;
  const rim = G.rimRing != null ? 1 : 0;
  assert.equal(totalRingCount(G), G.rings + hub + rim, "main + hub + rim: " + totalRingCount(G));
  assert.ok(totalRingCount(G) > G.rings, "hub/rim add rings to the main set");
});

test("ST-328: fullRingLayout - main radii/curve unchanged, hub near center, rim near edge, f in [0,1]", () => {
  const layout = fullRingLayout(A.radius, G);
  assert.equal(layout.length, totalRingCount(G), "one entry per ring");
  for (const ring of layout) {
    assert.ok(ring.f >= 0 && ring.f <= 1, "f in [0,1] for " + ring.kind + " r=" + ring.r.toFixed(2));
  }
  const mains = layout.filter((r) => r.kind === "main");
  assert.equal(mains.length, G.rings, "five main rings");
  for (let i = 0; i < mains.length; i++) {
    assert.ok(Math.abs(mains[i].r - (A.radius / G.rings) * (i + 1)) < 1e-9, "main ring " + i + " radius");
    assert.ok(Math.abs(mains[i].f - restFalloff(mains[i].r / A.radius, RT, RH, RA, RB)) < 1e-12, "main ring " + i + " keeps the rest-band curve");
  }
  const hubs = layout.filter((r) => r.kind === "hub");
  assert.equal(hubs.length, (G.hubRings || []).length, "one hub ring per config entry");
  for (const h of hubs) {
    assert.ok(h.r < A.radius * 0.25, "hub ring near center: r=" + h.r.toFixed(2));
    assert.ok(Math.abs(h.f - (G.hubF != null ? G.hubF : 1)) < 1e-12, "hub at hubF");
  }
  const rims = layout.filter((r) => r.kind === "rim");
  if (G.rimRing != null) {
    assert.equal(rims.length, 1, "one rim ring");
    assert.ok(Math.abs(rims[0].r - A.radius * G.rimRing) < 1e-9, "rim at rimRing fraction");
    assert.ok(rims[0].r < A.radius, "rim inside the arena edge");
  }
});

test("ST-328: main rings under FLOOR 50, hub rings are the bright anchor, bookkeeping scales", () => {
  const mixed = (f) => [
    Math.round(DIM[0] + (BRIGHT[0] - DIM[0]) * f),
    Math.round(DIM[1] + (BRIGHT[1] - DIM[1]) * f),
    Math.round(DIM[2] + (BRIGHT[2] - DIM[2]) * f),
  ];
  for (const ring of fullRingLayout(A.radius, G)) {
    if (ring.kind === "main") assert.ok(luma(mixed(ring.f)) < 50, "main ring luma " + luma(mixed(ring.f)).toFixed(1) + " < 50");
  }
  for (const h of fullRingLayout(A.radius, G).filter((r) => r.kind === "hub")) {
    assert.ok(Math.abs(luma(mixed(h.f)) - luma(BRIGHT)) < 0.01, "hub ring = bright anchor luma");
  }
  const total = totalRingCount(G);
  assert.equal(gridSegmentCount(total, G.sectors, G.divisions, G.spokeSegs), total * G.divisions + G.sectors * G.spokeSegs, "segment bookkeeping scales with totalRingCount");
  assert.equal(gridVertexCount(total, G.sectors, G.divisions, G.spokeSegs), gridSegmentCount(total, G.sectors, G.divisions, G.spokeSegs) * 2, "vertex = 2 x segment");
});
