// ST-415 (I445): chase-camera model tests (pure math, DOM-free)
import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, smoothstep01, dollyFactor, chaseTargets, projectNdc, overviewTargets, cockpitTargets } from '../src/core/cameraModel.js';
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

test('chaseTargets: speed still scales the look-ahead on top of the dolly', () => {
  const c0 = { ...targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 0) }; // clone: targets() writes the shared scratch in place
  const c1 = { ...targets({ x: 0, y: 0 }, { x: 0, y: 1 }, 1) };
  assert.ok(Math.abs(c0.lookZ - CFG.lookAhead) < 1e-12);
  assert.ok(Math.abs(c1.lookZ - (CFG.lookAhead + CFG.lookAheadSpeed)) < 1e-12);
  assert.equal(c0.camY, c1.camY); // dolly is speed-independent
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
    assert.ok(Math.abs(o.lookY) < 1e-12);
    assert.ok(Math.abs(o.lookZ - (c.p.y + c.f.y * CFG.cockpitLookFar)) < 1e-12);
    const dx = o.lookX - o.camX, dz = o.lookZ - o.camZ;
    assert.ok(dx * c.f.x + dz * c.f.y > 0, 'look point is in front of the seat along the heading');
    assert.ok(Number.isFinite(o.camX) && Number.isFinite(o.camY) && Number.isFinite(o.camZ));
  }
});
