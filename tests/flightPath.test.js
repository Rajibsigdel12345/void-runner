import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathPoint } from '../src/core/flightPath.js';
import { flightPathCam } from '../src/core/cameraModel.js';
import { CONFIG } from '../src/core/config.js';

const FP = CONFIG.flightPath;

test('pathPoint: finite + bounded over a wide distance sweep', () => {
  const o = {};
  const rMax = FP.a1 + FP.a2;
  for (let d = 0; d <= 4000; d += 0.5) {
    pathPoint(d, FP, o);
    assert.ok(Number.isFinite(o.x) && Number.isFinite(o.y) && Number.isFinite(o.elev), 'finite at ' + d);
    assert.ok(o.x*o.x + o.y*o.y <= rMax*rMax + 1e-6, 'x/y bounded by (a1+a2)^2 at ' + d);
    assert.ok(o.elev >= FP.elevBase - FP.elevAmp - 1e-9 && o.elev <= FP.elevBase + FP.elevAmp + 1e-9, 'elev in band');
    assert.ok(o.tx*o.tx + o.ty*o.ty <= 1 + 1e-6, 'tangent unit');
    assert.ok(o.bankRaw >= -1 && o.bankRaw <= 1, 'bankRaw clamped');
  }
});

test('pathPoint: C-continuous position + tangent (no jumps)', () => {
  const a = {}, b = {};
  let maxPosJump = 0, maxTanJump = 0;
  for (let d = 0; d < 4000; d += 0.5) {
    pathPoint(d, FP, a);
    pathPoint(d + 0.5, FP, b);
    maxPosJump = Math.max(maxPosJump, Math.hypot(b.x - a.x, b.y - a.y));
    maxTanJump = Math.max(maxTanJump, Math.hypot(b.tx - a.tx, b.ty - a.ty));
  }
  assert.ok(maxPosJump < 2.0, 'position step bounded (got ' + maxPosJump + ')');
  assert.ok(maxTanJump < 0.30, 'tangent step bounded (got ' + maxTanJump + ')');
});

test('pathPoint: genuine metrics (real curves + elevation, not degenerate)', () => {
  const o = {};
  let maxBank = 0, minElev = Infinity, maxElev = -Infinity, maxR = 0;
  for (let d = 0; d < 4000; d += 0.5) {
    pathPoint(d, FP, o);
    maxBank = Math.max(maxBank, Math.abs(o.bankRaw));
    minElev = Math.min(minElev, o.elev);
    maxElev = Math.max(maxElev, o.elev);
    maxR = Math.max(maxR, Math.hypot(o.x, o.y));
  }
  assert.ok(maxBank > 0.2, 'has real banking (maxBank ' + maxBank + ')');
  assert.ok((maxElev - minElev) > 1.0, 'has real elevation range (span ' + (maxElev - minElev) + ')');
  assert.ok(maxR > 5, 'path is spatially extended (maxR ' + maxR + ')');
});

test('pathPoint: deterministic + distinct per distance', () => {
  const a = {}, b = {}, c = {};
  pathPoint(123.4, FP, a); pathPoint(123.4, FP, b);
  assert.deepEqual(a, b, 'same d -> identical');
  pathPoint(124.0, FP, c);
  assert.ok(Math.hypot(c.x - a.x, c.y - a.y) > 1e-3, 'different d -> different point');
});

test('flightPathCam: E62 invariant - cam->look is invariant under path.elev (pure lift)', () => {
  const chase = { camX: -12, camY: 9, camZ: 4, lookX: 2, lookY: 0, lookZ: 10 };
  const pathA = { x: 3, y: 7, elev: 3, tx: 0, ty: 1, curv: 0, bankRaw: 0 };
  const pathB = { x: 3, y: 7, elev: 8, tx: 0, ty: 1, curv: 0, bankRaw: 0 }; // same xz, different elev
  const aheadA = { x: 5, y: 9, elev: 3.4, tx: 0, ty: 1, curv: 0, bankRaw: 0 };
  const aheadB = { x: 5, y: 9, elev: 8.4, tx: 0, ty: 1, curv: 0, bankRaw: 0 };
  const o1 = { x: 0, y: 0, z: 0 }, l1 = { x: 0, y: 0, z: 0 };
  const o2 = { x: 0, y: 0, z: 0 }, l2 = { x: 0, y: 0, z: 0 };
  flightPathCam(chase, pathA, aheadA, FP, o1, l1);
  flightPathCam(chase, pathB, aheadB, FP, o2, l2);
  // cam is lifted by e in both; the DELTA cam->look must be identical
  const dv1 = { x: l1.x - o1.x, y: l1.y - o1.y, z: l1.z - o1.z };
  const dv2 = { x: l2.x - o2.x, y: l2.y - o2.y, z: l2.z - o2.z };
  assert.ok(Math.hypot(dv1.x - dv2.x, dv1.y - dv2.y, dv1.z - dv2.z) < 1e-9, 'cam->look vector invariant under elev');
  // cam->ship vector (ship sits at path xz + elev) is also invariant
  const s1 = { x: pathA.x - o1.x, y: pathA.elev - o1.y, z: pathA.y - o1.z };
  const s2 = { x: pathB.x - o2.x, y: pathB.elev - o2.y, z: pathB.y - o2.z };
  assert.ok(Math.hypot(s1.x - s2.x, s1.y - s2.y, s1.z - s2.z) < 1e-9, 'cam->ship vector invariant under elev');
});

test('flightPathCam: framing - frac 0 = lift only, frac 1 = pathAhead, frac clamped', () => {
  const chase = { camX: -12, camY: 9, camZ: 4, lookX: 2, lookY: 0, lookZ: 10 };
  const path = { x: 3, y: 7, elev: 5, tx: 0, ty: 1, curv: 0, bankRaw: 0 };
  const ahead = { x: 50, y: -40, elev: 7, tx: 0, ty: 1, curv: 0, bankRaw: 0 };
  // frac = 0 -> look = (chase.lookX, e, chase.lookZ)
  const o0 = { x: 0, y: 0, z: 0 }, l0 = { x: 0, y: 0, z: 0 };
  flightPathCam(chase, path, ahead, { frameFrac: 0 }, o0, l0);
  assert.equal(l0.x, chase.lookX); assert.equal(l0.y, 5); assert.equal(l0.z, chase.lookZ);
  assert.equal(o0.y, chase.camY + 5); // lift applied
  // frac = 1 -> look == pathAhead
  const o1 = { x: 0, y: 0, z: 0 }, l1 = { x: 0, y: 0, z: 0 };
  flightPathCam(chase, path, ahead, { frameFrac: 1 }, o1, l1);
  assert.equal(l1.x, ahead.x); assert.equal(l1.y, ahead.elev); assert.equal(l1.z, ahead.y);
  // clamp: negative -> 0 (lift only), > 1 -> 1 (pathAhead)
  const o2 = { x: 0, y: 0, z: 0 }, l2 = { x: 0, y: 0, z: 0 };
  flightPathCam(chase, path, ahead, { frameFrac: -1 }, o2, l2);
  assert.equal(l2.x, chase.lookX); assert.equal(l2.z, chase.lookZ);
  const o3 = { x: 0, y: 0, z: 0 }, l3 = { x: 0, y: 0, z: 0 };
  flightPathCam(chase, path, ahead, { frameFrac: 2 }, o3, l3);
  assert.equal(l3.x, ahead.x); assert.equal(l3.z, ahead.y);
});
