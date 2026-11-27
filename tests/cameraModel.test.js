// ST-415 (I445): chase-camera model tests (pure math, DOM-free)
import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets, cockpitThrust, cockpitAim, cockpitThrustBasis, azimuthDamp, radialDollyDir } from '../src/core/cameraModel.js'; // ST-572 (I606, E87): +radialDollyDir
import { CONFIG } from '../src/core/config.js';

const CFG = CONFIG.camera; // real config keeps these tests honest
const ARENA = CONFIG.arena.radius; // 26
const FOV = CFG.fovBase;            // 60
const ASPECT = 16 / 9;
const R = ARENA;

const POS = [
  { n: 'center', x: 0, y: 0 },
  { n: 'nearRim', x: 15, y: 15 },                    // t ~= 0.817
  { n: 'rimN', x: 0, y: R },
  { n: 'rim45', x: R * Math.SQRT1_2, y: R * Math.SQRT1_2 }
];
const SQ = Math.SQRT1_2;
const HEADS = [
  { n: 'south', x: 0, y: -1 }, { n: 'north', x: 0, y: 1 },
  { n: 'east', x: 1, y: 0 }, { n: 'west', x: -1, y: 0 },
  { n: 'se', x: SQ, y: -SQ }, { n: 'sw', x: -SQ, y: -SQ },
  { n: 'ne', x: SQ, y: SQ }, { n: 'nw', x: -SQ, y: SQ }
];

const out = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ahead: 0 };
const nd = { x: 0, y: 0, z: 0 };
const targets = (p, h, spdFrac) => chaseTargets(p, h, spdFrac, Math.hypot(p.x, p.y), R, CFG, out);
const camOf = () => ({ x: out.camX, y: out.camY, z: out.camZ });
const lookOf = () => ({ x: out.lookX, y: out.lookY, z: out.lookZ });
const shipNdcY = (p, h, spdFrac) => { targets(p, h, spdFrac); projectNdc(p.x, 0, p.y, camOf(), lookOf(), FOV, ASPECT, nd); return nd.y; };
const centerNdc = (p, h, spdFrac) => { targets(p, h, spdFrac); projectNdc(0, 0, 0, camOf(), lookOf(), FOV, ASPECT, nd); return { x: nd.x, y: nd.y }; };

test('clamp01 / smoothstep01: endpoints + monotone', () => {
  assert.equal(clamp01(-1), 0); assert.equal(clamp01(0.5), 0.5); assert.equal(clamp01(2), 1);
  assert.equal(smoothstep01(0), 0); assert.equal(smoothstep01(1), 1);
  assert.ok(Math.abs(smoothstep01(0.5) - 0.5) < 1e-12);
  let prev = 0;
  for (let i = 1; i <= 20; i++) { const v = smoothstep01(i / 20); assert.ok(v >= prev); prev = v; }
});

test('dollyFactor: identity at/under startFrac, rimScale at the rim, monotone', () => {
  assert.equal(dollyFactor(0, CFG.dolly), 1);
  assert.equal(dollyFactor(CFG.dolly.startFrac, CFG.dolly), 1);
  assert.ok(Math.abs(dollyFactor(1, CFG.dolly) - CFG.dolly.rimScale) < 1e-12);
  let prev = 1;
  for (let i = 0; i <= 100; i++) { const s = dollyFactor(i / 100, CFG.dolly); assert.ok(s >= prev - 1e-12); assert.ok(s >= 1 && s <= CFG.dolly.rimScale + 1e-12); prev = s; }
});

test('chaseTargets: center is the legacy (9, 13) framing with the retuned look-ahead (identity)', () => {
  const c = targets({ x: 0, y: 0 }, { x: 0, y: -1 }, 0);
  assert.equal(c.s, 1);
  assert.ok(Math.abs(c.ahead - CFG.lookAhead) < 1e-12);
  assert.ok(Math.abs(c.camX - 0) < 1e-12 && Math.abs(c.camY - 9) < 1e-12 && Math.abs(c.camZ - 13) < 1e-12);
  assert.ok(Math.abs(c.lookX - 0) < 1e-12 && Math.abs(c.lookY - 0) < 1e-12 && Math.abs(c.lookZ - -CFG.lookAhead) < 1e-12);
});

test('chaseTargets: rim scales offset AND look-ahead by rimScale (uniform)', () => {
  const c = targets({ x: 0, y: R }, { x: 0, y: -1 }, 0);
  assert.ok(Math.abs(c.s - CFG.dolly.rimScale) < 1e-12);
  assert.ok(Math.abs(c.camY - CFG.camHeight * CFG.dolly.rimScale) < 1e-9);
  assert.ok(Math.abs(c.camZ - (R + CFG.camBack * CFG.dolly.rimScale)) < 1e-9);
  assert.ok(Math.abs(c.lookZ - (R - CFG.lookAhead * CFG.dolly.rimScale)) < 1e-9);
  assert.ok(Math.abs(c.ahead - CFG.lookAhead * CFG.dolly.rimScale) < 1e-9);
});

test('chaseTargets: speed still scales the look-ahead on top of the dolly (ss = 1 at rest)', () => {
  const c0 = { ...targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 0) }; // clone: targets() writes the shared scratch in place
  const c1 = { ...targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 1) };
  assert.ok(Math.abs(c0.lookZ - CFG.lookAhead) < 1e-12);
  assert.ok(Math.abs(c1.lookZ - (CFG.lookAhead + CFG.lookAheadSpeed)) < 1e-12); // look-ahead scales by s only (NOT ss)
  assert.equal(c0.camY, CFG.camHeight); // rest: ss = 1 (legacy framing)
  assert.ok(Math.abs(c1.camY - CFG.camHeight * CFG.dolly.speed.boost) < 1e-12); // ST-525: speed dolly scales the height
  assert.ok(Math.abs(c1.camZ - CFG.camBack * CFG.dolly.speed.boost) < 1e-12); // ST-525: ...and the dolly-back
});

test('INVARIANT: ship screen-space offset is identical at every arena position (per heading, both speeds)', () => {
  for (const h of HEADS) {
    for (const spd of [0, 1]) {
      const first = shipNdcY(POS[0], h, spd);
      assert.ok(Number.isFinite(first), 'finite');
      for (const p of POS) {
        const v = shipNdcY(p, h, spd);
        assert.ok(Math.abs(v - first) < 1e-9, 'invariant ' + p.n + '/' + h.n + ' spd=' + spd + ' ' + v + ' vs ' + first);
      }
    }
  }
});

test('ship screen offset stays in a small central band (dodge-readable)', () => {
  for (const p of POS) for (const h of HEADS) for (const spd of [0, 1]) {
    const v = shipNdcY(p, h, spd);
    // measured I445: -0.2315 (south, full speed) .. +0.3770 (north, full speed; look point between ship and camera)
    assert.ok(v >= -0.232 && v <= 0.378, 'band ' + p.n + '/' + h.n + ' spd=' + spd + ' -> ' + v);
  }
});

test('rim keeps the arena center in frame (all positions x headings x speeds)', () => {
  let worst = 0;
  for (const p of POS) for (const h of HEADS) for (const spd of [0, 1]) {
    const c = centerNdc(p, h, spd);
    assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y), 'finite ' + p.n + '/' + h.n);
    assert.ok(Math.abs(c.x) < 1 && Math.abs(c.y) < 1, 'in frame ' + p.n + '/' + h.n + ' ' + c.x + ',' + c.y);
    worst = Math.max(worst, Math.abs(c.x), Math.abs(c.y));
  }
  // measured I445 worst case 0.9732 (rim, heading AWAY from center, full speed) - in frame, and the live
  // game improves it further at speed (FOV 60 -> 64 via fovSpeed). Rest-speed worst case is 0.7433.
  assert.ok(worst < 1, 'worst |center NDC| ' + worst + ' < 1 (in frame)');
  assert.ok(worst <= 0.974, 'worst |center NDC| ' + worst + ' <= 0.974 (pin)');
});

test('projectNdc: look point projects to origin; behind-camera and degenerate -> NaN', () => {
  const cam = { x: 0, y: 9, z: 13 }, look = { x: 0, y: 0, z: -2.6 };
  projectNdc(look.x, look.y, look.z, cam, look, FOV, ASPECT, nd);
  assert.ok(Math.abs(nd.x) < 1e-4 && Math.abs(nd.y) < 1e-4); // float tolerance: basis vectors are normalized
  projectNdc(0, 9, 13 + 5, cam, look, FOV, ASPECT, nd); // directly behind the camera: 5 back at camera height (camera pitches ~30 deg down toward -Z, so this is unambiguously in the rear hemisphere)
  assert.ok(Number.isNaN(nd.x) && Number.isNaN(nd.y) && nd.z < 0);
  projectNdc(0, 1, 0, cam, cam, FOV, ASPECT, nd);       // degenerate cam == look
  assert.ok(Number.isNaN(nd.x) && Number.isNaN(nd.y));
  projectNdc(0, 0, 0, { x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 1 }, FOV, ASPECT, nd); // straight-up view
  assert.ok(Number.isNaN(nd.x) && Number.isNaN(nd.y));
});
// ST-416 (I446): OVERVIEW + COCKPIT camera targets (pure math, DOM-free)

test('overviewTargets: fixed camera above the arena center; the ship never enters the call', () => {
  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };
  overviewTargets(CFG, o);
  assert.equal(o.camX, 0);
  assert.equal(o.camY, CFG.overviewHeight);
  assert.equal(o.camZ, CFG.overviewBack);
  assert.equal(o.lookX, 0);
  assert.equal(o.lookY, 0);
  assert.equal(o.lookZ, 0);
  overviewTargets(CFG, o); // calling again (different frame) gives the same fixed target
  assert.equal(o.camY, CFG.overviewHeight);
  assert.equal(o.camZ, CFG.overviewBack);
});

test('overviewTargets: whole arena frames - every rim point is inside |NDC| <= 1 with margin (16:9, fov 60)', () => {
  const cam = { x: 0, y: CFG.overviewHeight, z: CFG.overviewBack };
  const look = { x: 0, y: 0, z: 0 };
  const o = { x: NaN, y: NaN, z: NaN };
  let worst = 0;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    projectNdc(R * Math.cos(a), 0, R * Math.sin(a), cam, look, FOV, ASPECT, o);
    assert.ok(Number.isFinite(o.x) && Number.isFinite(o.y), 'rim pt ' + i);
    worst = Math.max(worst, Math.abs(o.x), Math.abs(o.y));
  }
  assert.ok(worst <= 1, 'worst rim NDC ' + worst);
  assert.ok(worst <= 0.85, 'tuned margin: worst rim NDC ' + worst + ' (binding point = near rim, bottom edge)');
});

test('cockpitTargets: seat sits setback behind the ship at eye height; looks lookFar ahead along the heading', () => {
  const cases = [
    { p: { x: 0, y: 0 }, f: { x: 0, y: -1 } },
    { p: { x: 12, y: -5 }, f: { x: SQ, y: SQ } },
    { p: { x: -R, y: 0 }, f: { x: 1, y: 0 } }
  ];
  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };
  for (const c of cases) {
    cockpitTargets(c.p, c.f, CFG, o);
    assert.ok(Math.abs(o.camX - (c.p.x - c.f.x * CFG.cockpitSetback)) < 1e-12);
    assert.ok(Math.abs(o.camY - CFG.cockpitHeight) < 1e-12);
    assert.ok(Math.abs(o.camZ - (c.p.y - c.f.y * CFG.cockpitSetback)) < 1e-12);
    assert.ok(Math.abs(o.lookX - (c.p.x + c.f.x * CFG.cockpitLookFar)) < 1e-12);
    assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12); // I504: gentle down-pitch
    assert.ok(Math.abs(o.lookZ - (c.p.y + c.f.y * CFG.cockpitLookFar)) < 1e-12);
    const dx = o.lookX - o.camX, dz = o.lookZ - o.camZ;
    assert.ok(dx * c.f.x + dz * c.f.y > 0, 'look point is in front of the seat along the heading');
    assert.ok(Number.isFinite(o.camX) && Number.isFinite(o.camY) && Number.isFinite(o.camZ));
  }
});

test('cockpitTargets: speed look-ahead - ahead = cockpitLookFar + cockpitLookSpeed*spdFrac; at rest bit-identical to the legacy fixed 60 (ST-444)', () => {
  const p = { x: 7, y: -3 };
  const f = { x: SQ, y: SQ };
  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };
  for (const s of [0, 0.5, 1]) {
    cockpitTargets(p, f, CFG, o, s);
    const ahead = CFG.cockpitLookFar + CFG.cockpitLookSpeed * s;
    assert.equal(o.lookX, p.x + f.x * ahead);
    assert.equal(o.lookZ, p.y + f.y * ahead);
    assert.equal(o.camX, p.x - f.x * CFG.cockpitSetback); // seat position is speed-independent
    assert.equal(o.camY, CFG.cockpitHeight);
    assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12); // I504: gentle down-pitch
  }
  // at rest (explicit 0 and the legacy 3-arg default) bit-identical to the legacy fixed-60 targets
  cockpitTargets(p, f, CFG, o, 0);
  assert.equal(o.lookX, p.x + f.x * 60);
  assert.equal(o.lookZ, p.y + f.y * 60);
  const o2 = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };
  cockpitTargets(p, f, CFG, o2); // legacy 3-arg call (default spdFrac = 0)
  assert.equal(o.lookX, o2.lookX);
  assert.equal(o.lookZ, o2.lookZ);
  // full speed: strictly beyond the rest look-ahead
  cockpitTargets(p, f, CFG, o, 1);
  assert.ok(o.lookX > p.x + f.x * CFG.cockpitLookFar);
});

// I504 (ST-470): cockpit camera-relative thrust rotation
const thr = { x: 99, y: 99 };
const near0 = (v) => Math.abs(v) < 1e-12;

test('cockpitThrust: identity at the default aim (-PI/2, nose-up) - the legacy screen basis', () => {
  const a = -Math.PI / 2;
  for (const v of [[0, -1], [0, 1], [1, 0], [-1, 0], [SQ, -SQ]]) {
    cockpitThrust(v[0], v[1], a, thr);
    assert.ok(Math.abs(thr.x - v[0]) < 1e-12 && Math.abs(thr.y - v[1]) < 1e-12, 'identity at -PI/2 for ' + v);
  }
});

test('cockpitThrust: a=0 (nose-east) maps screen-up to +x and screen-right to +y', () => {
  cockpitThrust(0, -1, 0, thr); assert.ok(Math.abs(thr.x - 1) < 1e-12 && near0(thr.y)); // W = along the nose
  cockpitThrust(1, 0, 0, thr); assert.ok(near0(thr.x) && Math.abs(thr.y - 1) < 1e-12); // D = screen-right
  cockpitThrust(0, 1, 0, thr); assert.ok(Math.abs(thr.x + 1) < 1e-12 && near0(thr.y)); // S = astern
  cockpitThrust(-1, 0, 0, thr); assert.ok(near0(thr.x) && Math.abs(thr.y + 1) < 1e-12); // A = screen-left
});

test('cockpitThrust: rotation preserves magnitude, zero stays zero, basis stays orthonormal (any aim)', () => {
  for (const a of [0, 0.7, -2.1, Math.PI]) {
    cockpitThrust(0.6, -0.8, a, thr);
    assert.ok(Math.abs(Math.hypot(thr.x, thr.y) - 1) < 1e-12);
    cockpitThrust(0, 0, a, thr);
    assert.ok(thr.x === 0 && thr.y === 0, 'zero stays zero'); // === normalizes -0
    cockpitThrust(0, -1, a, thr); const ux = thr.x, uy = thr.y; // screen-up -> fwd
    cockpitThrust(1, 0, a, thr); // screen-right -> camera right
    assert.ok(Math.abs(ux * Math.cos(a) + uy * Math.sin(a) - 1) < 1e-12, 'screen-up maps to fwd');
    assert.ok(Math.abs(ux * thr.x + uy * thr.y) < 1e-12, 'screen-right is perpendicular to screen-up');
    assert.ok(Math.abs(thr.x + Math.sin(a)) < 1e-12 && Math.abs(thr.y - Math.cos(a)) < 1e-12, 'right = (-sin a, cos a)');
  }
});

test('cockpitTargets: I504 seat - look drops cockpitLookDrop below the eye (down-pitch frames the nose)', () => {
  const p = { x: 0, y: 0 };
  const f = { x: 0, y: -1 };
  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };
  cockpitTargets(p, f, CFG, o);
  assert.equal(o.camY, CFG.cockpitHeight);
  assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12);
  assert.ok(o.lookY < o.camY, 'look point is below the eye (nose in frame)');
});

// ST-525 (I559): speed dolly + rail-aligned backDir + undamped cockpit aim (C-1)
const legacyTargets559 = (p, h, spdFrac) => {
  const s = dollyFactor(Math.hypot(p.x, p.y) / R, CFG.dolly);
  const ahead = (CFG.lookAhead + CFG.lookAheadSpeed * spdFrac) * s;
  return { s, camX: p.x, camY: CFG.camHeight * s, camZ: p.y + CFG.camBack * s, lookX: p.x + h.x * ahead, lookY: 0, lookZ: p.y + h.y * ahead };
};

test('ST-525: rest (spdFrac 0) is bit-identical to the legacy model (all POS x HEADS)', () => {
  for (const p of POS) for (const h of HEADS) {
    const c = targets(p, h, 0);
    const l = legacyTargets559(p, h, 0);
    assert.equal(c.ss, 1, p.n + '/' + h.n + ' ss');
    for (const k of ['s', 'camX', 'camY', 'camZ', 'lookX', 'lookY', 'lookZ']) assert.equal(c[k], l[k], p.n + '/' + h.n + ' ' + k);
  }
});

test('ST-525: speed dolly ss endpoints + monotone; look-ahead NOT ss-scaled', () => {
  assert.equal(targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 0).ss, 1);
  assert.ok(Math.abs(targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 1).ss - CFG.dolly.speed.boost) < 1e-12);
  let prev = 1;
  for (let i = 0; i <= 20; i++) { const v = targets({ x: 0, y: 0 }, { x: 0, y: 1 }, i / 20).ss; assert.ok(v >= prev - 1e-12); prev = v; }
  const b = targets({ x: 5, y: -3 }, { x: 0, y: 1 }, 1); // dist ~5.83 < startFrac*26 -> s = 1
  assert.ok(Math.abs(b.lookZ - (-3 + CFG.lookAhead + CFG.lookAheadSpeed)) < 1e-12, 'look-ahead unscaled by ss');
  assert.ok(Math.abs(b.camY - CFG.camHeight * CFG.dolly.speed.boost) < 1e-12);
  assert.ok(Math.abs(b.camZ - (-3 + CFG.camBack * CFG.dolly.speed.boost)) < 1e-12);
});

test('ST-525: backDir null/undefined = legacy bit-identity; unit dirs rotate the dolly-back offset', () => {
  const p = { x: 1, y: -2 };
  const s = dollyFactor(Math.hypot(p.x, p.y) / R, CFG.dolly);
  const base = { ...targets(p, { x: 0, y: 1 }, 0) };
  const l = legacyTargets559(p, { x: 0, y: 1 }, 0);
  for (const k of ['camX', 'camY', 'camZ']) assert.equal(base[k], l[k], 'null backDir ' + k);
  for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
    const c = chaseTargets(p, { x: 0, y: 1 }, 0, Math.hypot(p.x, p.y), R, CFG, out, d);
    assert.ok(Math.abs(Math.hypot(c.camX - p.x, c.camZ - p.y) - CFG.camBack * s) < 1e-9, 'offset magnitude');
    assert.ok(Math.abs(c.camX - (p.x + CFG.camBack * s * d.x)) < 1e-9 && Math.abs(c.camZ - (p.y + CFG.camBack * s * d.y)) < 1e-9, 'offset direction');
  }
});

test('ST-525: rail-aligned backDir -> ship NDC invariant under rigid rotation (rail-parent invariant)', () => {
  const rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
  const A = 0.9;
  const p0 = { x: 1, y: -2 }, h0 = { x: 0, y: 1 };
  const p1 = rot(p0, A), h1 = rot(h0, A);
  const oA = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ahead: 0 };
  const oB = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ahead: 0 };
  const nA = { x: 0, y: 0, z: 0 }, nB = { x: 0, y: 0, z: 0 };
  const cA = chaseTargets(p0, h0, 0, Math.hypot(p0.x, p0.y), R, CFG, oA);
  const cB = chaseTargets(p1, h1, 0, Math.hypot(p1.x, p1.y), R, CFG, oB, { x: h1.x, y: h1.y });
  projectNdc(p0.x, 0, p0.y, { x: cA.camX, y: cA.camY, z: cA.camZ }, { x: cA.lookX, y: cA.lookY, z: cA.lookZ }, FOV, ASPECT, nA);
  projectNdc(p1.x, 0, p1.y, { x: cB.camX, y: cB.camY, z: cB.camZ }, { x: cB.lookX, y: cB.lookY, z: cB.lookZ }, FOV, ASPECT, nB);
  assert.ok(Math.abs(nA.x - nB.x) < 1e-9 && Math.abs(nA.y - nB.y) < 1e-9, 'rail-parent NDC invariant: ' + JSON.stringify(nA) + ' vs ' + JSON.stringify(nB));
});

test('ST-525: cockpitAim - undamped pointer bearing when active, damped-nose fallback otherwise', () => {
  const sp = { x: 0, y: 0 };
  assert.equal(cockpitAim(sp, null, 0.5), 0.5); // no pointer -> fallback
  assert.equal(cockpitAim(sp, { x: 0.0001, y: 0.0001 }, 0.5), 0.5); // coincident (dist ~1.4e-4) -> fallback
  assert.equal(cockpitAim(sp, { x: 0.0005, y: 0.0005 }, 0.5), 0.5); // dist ~7.1e-4 -> fallback
  assert.equal(cockpitAim(sp, { x: 3, y: 4 }, 0.5), Math.atan2(4, 3));
  assert.equal(cockpitAim(sp, { x: 0, y: -5 }, 0.5), -Math.PI / 2);
  assert.equal(cockpitAim({ x: 1, y: 1 }, { x: 4, y: 2 }, 0.5), Math.atan2(1, 3));
});

test('ST-525: C-1 composition - cockpit thrust basis follows the undamped aim, not the damped nose', () => {
  const o = {};
  const undamped = 1.0, damped = 0;
  // W = screen-up = (0, -1) in the screen-basis convention (screen-up = sim -y at aim -PI/2)
  cockpitThrust(0, -1, cockpitAim({ x: 0, y: 0 }, { x: Math.cos(undamped), y: Math.sin(undamped) }, damped), o);
  assert.ok(Math.abs(o.x - Math.cos(undamped)) < 1e-12 && Math.abs(o.y - Math.sin(undamped)) < 1e-12, 'undamped: ' + JSON.stringify(o));
  cockpitThrust(0, -1, damped, o);
  assert.ok(Math.abs(o.x - 1) < 1e-12 && Math.abs(o.y) < 1e-12, 'legacy damped-nose fallback: ' + JSON.stringify(o));
});

test('ST-564 (I599): cockpit thrust basis == view direction - screen-up is nose-forward at every aim angle (24-step sweep, tol 1e-9)', () => {
  const o = {};
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    // Screen basis (input.js convention): W = (0,-1), S = (0,1), A = (-1,0), D = (1,0).
    // basis a = the damped nose angle: the cockpit camera looks along ship.aim, so the
    // thrust basis MUST be the view direction at every instant (ST-564: the I559
    // undamped-pointer basis could flip 180deg behind the ship -> W read as back).
    cockpitThrust(0, -1, a, o); // W -> nose (cos a, sin a)
    assert.ok(Math.abs(o.x - ca) < 1e-9 && Math.abs(o.y - sa) < 1e-9, 'W@' + a.toFixed(3) + ': ' + JSON.stringify(o));
    cockpitThrust(0, 1, a, o); // S -> -nose
    assert.ok(Math.abs(o.x + ca) < 1e-9 && Math.abs(o.y + sa) < 1e-9, 'S@' + a.toFixed(3) + ': ' + JSON.stringify(o));
    cockpitThrust(1, 0, a, o); // D -> right of nose = (-sin a, cos a) [cross(view, up)]
    assert.ok(Math.abs(o.x + sa) < 1e-9 && Math.abs(o.y - ca) < 1e-9, 'D@' + a.toFixed(3) + ': ' + JSON.stringify(o));
    cockpitThrust(-1, 0, a, o); // A -> left of nose = (sin a, -cos a)
    assert.ok(Math.abs(o.x - sa) < 1e-9 && Math.abs(o.y + ca) < 1e-9, 'A@' + a.toFixed(3) + ': ' + JSON.stringify(o));
  }
});

// ST-569 (I604, E87): azimuthDamp - held-azimuth exponential damping (endless banded radial dolly)
test('azimuthDamp: identity (prev == target)', () => {
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * 2 * Math.PI;
    assert.ok(Math.abs(azimuthDamp(a, a, 1 / 60, 0.25) - a) < 1e-12, 'identity @' + a.toFixed(3));
  }
});

test('azimuthDamp: 1-step factor == 1 - exp(-dt/tau) (dt-consistent)', () => {
  const dt = 1 / 60, tau = 0.25;
  const k = 1 - Math.exp(-dt / tau);
  const cases = [[0, Math.PI / 2], [0.3, -1.1], [-2.5, 2.5], [3.0, -3.0], [Math.PI / 2, -Math.PI / 2]];
  for (const [prev, target] of cases) {
    let diff = target - prev;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    const got = azimuthDamp(prev, target, dt, tau);
    assert.ok(Math.abs(got - (prev + diff * k)) < 1e-9, 'factor @' + prev + ',' + target);
  }
});

test('azimuthDamp: convergence 0 -> pi, monotone, no overshoot (120 steps @ 60 fps, tau 0.25)', () => {
  let a = 0, prevA = 0;
  for (let i = 0; i < 120; i++) {
    a = azimuthDamp(a, Math.PI, 1 / 60, 0.25);
    assert.ok(a >= prevA - 1e-12 && a <= Math.PI + 1e-12, 'monotone/no-overshoot step ' + i);
    prevA = a;
  }
  assert.ok(Math.abs(a - Math.PI) < Math.PI / 180, 'within 1 deg of pi, got ' + a.toFixed(5));
});

test('azimuthDamp: wraparound takes the shortest arc (-170 deg -> +170 deg goes through 180)', () => {
  const from = -170 * Math.PI / 180, to = 170 * Math.PI / 180;
  const step = azimuthDamp(from, to, 1 / 60, 0.25);
  assert.ok(step < from, 'moves toward -180 deg (short way), got ' + (step * 180 / Math.PI).toFixed(2) + ' deg');
  assert.ok(from - step < 1.5 * Math.PI / 180, 'first step ~1.29 deg, got ' + ((from - step) * 180 / Math.PI).toFixed(2) + ' deg');
});

test('azimuthDamp: crossing pi/2 -> -pi/2 max per-frame step <= 30 deg (frozen E87 ceiling)', () => {
  let a = Math.PI / 2;
  let maxStep = 0;
  for (let i = 0; i < 180; i++) {
    const next = azimuthDamp(a, -Math.PI / 2, 1 / 60, 0.25);
    maxStep = Math.max(maxStep, Math.abs(next - a));
    a = next;
    if (Math.abs(a + Math.PI / 2) < 1e-4) break;
  }
  assert.ok(maxStep <= (30 * Math.PI) / 180, 'max step ' + (maxStep * 180 / Math.PI).toFixed(2) + ' deg');
});


test('radialDollyDir: deadband identity - converged held at the legacy azimuth inside the band -> backDir null (exact legacy branch)', () => {
  const out = { a: Math.PI / 2, backDir: null, bd: { x: 0, y: 1 } };
  for (let i = 0; i < 60; i++) radialDollyDir(out.a, Math.atan2(1, 0), 5, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);
  assert.equal(out.backDir, null, 'converged held at legacy -> backDir null');
  assert.ok(Math.abs(out.a - Math.PI / 2) < 1e-6, 'held stays at the legacy azimuth, got ' + out.a.toFixed(6));
});

test('radialDollyDir: outside the deadband - radial dolly active, backDir = (cos a, sin a) on the persistent slot', () => {
  const out = { a: Math.PI / 2, backDir: null, bd: { x: 0, y: 1 } };
  for (let i = 0; i < 5; i++) radialDollyDir(out.a, 0, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);
  assert.equal(out.backDir, out.bd, 'backDir aliases the persistent bd slot (no alloc)');
  assert.ok(Math.abs(out.backDir.x - Math.cos(out.a)) < 1e-12 && Math.abs(out.backDir.y - Math.sin(out.a)) < 1e-12, 'backDir = (cos a, sin a)');
  for (let i = 0; i < 295; i++) radialDollyDir(out.a, 0, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);
  assert.ok(Math.abs(out.a) < 1e-3, 'held converges to the radial (0), got ' + out.a.toFixed(6));
  assert.equal(out.backDir, out.bd, 'dolly still active at the converged radial');
});

test('radialDollyDir: wraparound convergence - start -pi/2, target pi/2, 300 steps -> a ~ pi/2 and backDir -> null', () => {
  const out = { a: -Math.PI / 2, backDir: { x: 1, y: 0 }, bd: { x: 1, y: 0 } };
  for (let i = 0; i < 300; i++) radialDollyDir(out.a, Math.PI / 2, ARENA, CFG.dolly.band * ARENA, 1 / 60, CFG.dolly.azTau, CFG.dolly.azDeadband, out);
  assert.ok(Math.abs(out.a - Math.PI / 2) < 1e-4, 'converged to the legacy azimuth, got ' + out.a.toFixed(6));
  assert.equal(out.backDir, null, 'backDir null once the held is inside the deadband of legacy');
});

// ST-587 (I627, E91 D3): cockpit thrust basis toggle (Nose default | View pointer-follow with +/-90 flip guard)
const CTB = (basis, nose, view) => cockpitThrustBasis(basis, nose, view, { aim: 0 }).aim;

test('cockpitThrustBasis: nose default (explicit nose + unknown values) stays on the nose', () => {
  assert.equal(CTB('nose', 0.5, 0.1), 0.5);
  assert.equal(CTB(undefined, 0.5, 0.1), 0.5);
  assert.equal(CTB('bogus', -0.2, 1.0), -0.2);
  assert.equal(CTB('nose', Math.PI, -Math.PI), Math.PI); // seam: nose wins outright, no wrap needed
});

test('cockpitThrustBasis: view follows the pointer while inside +/-90deg of the nose', () => {
  assert.equal(CTB('view', 0, 0.2), 0.2);
  assert.equal(CTB('view', 0, -0.9), -0.9); // just inside 90deg
  assert.equal(CTB('view', 0.5, 0.5), 0.5); // d = 0
  assert.equal(CTB('view', Math.PI - 0.01, -Math.PI + 0.02), -Math.PI + 0.02); // seam wrap, |d| < 90deg
});

test('cockpitThrustBasis: flip guard reverts to the nose at/past +/-90deg (deterministic tie)', () => {
  assert.equal(CTB('view', 0, Math.PI / 2), 0); // exactly +90deg -> nose (tie)
  assert.equal(CTB('view', 0, -Math.PI / 2), 0); // exactly -90deg -> nose (tie)
  assert.equal(CTB('view', 0, 1.5708), 0); // just past +90deg
  assert.equal(CTB('view', 0, -2.1), 0); // past -90deg
  assert.equal(CTB('view', 0, Math.PI), 0); // 180deg behind -> nose
  assert.equal(CTB('view', 0.3, 0.3 + 2.0), 0.3); // non-zero nose, offset past 90deg
});
