// I504 S1: far-view MEASURE probe (pre-registered). Question: on the campaign
// flight path, does the steady-state chase frame still show the track BEHIND
// the ship, and is the ship screen-offset invariant (ST-415) wherever the ship is?
// Pure core, DOM-free. Decision rule (pre-registered): >10% of rest (spdFrac=0)
// samples with the behind-point out-of-frame -> minimal fix; else measurement doc only.
import { pathPoint } from '../../src/core/flightPath.js';
import { chaseTargets, flightPathCam, projectNdc } from '../../src/core/cameraModel.js';
import { CONFIG } from '../../src/core/config.js';

const fov = CONFIG.camera.fovBase;      // 60
const aspect = 16 / 9;
const arenaR = CONFIG.arena.radius;     // 26
const frameDist = CONFIG.flightPath.frameDist;
const SHIP_HOVER = 0.4;                 // main.js SHIP_HOVER
const BEHIND = 12;                      // metres of track behind the ship

const D0 = 0, D1 = 250, N = 500;
const A = { x: 0, y: 0 }, B = { x: 0, y: 0 }, K = { x: 0, y: 0 };
const chase = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ahead: 0 };
const cam = { x: 0, y: 0, z: 0 }, look = { x: 0, y: 0, z: 0 };
const ndc = { x: 0, y: 0, z: 0 };

function run(spdFrac) {
  let oob = 0, nan = 0;
  let maxNdcX = 0, maxNdcY = 0, worstX = 0, worstY = 0, minDepth = Infinity;
  let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
  let sNaN = 0;
  for (let i = 0; i < N; i++) {
    const d = D0 + (D1 * i) / (N - 1);
    pathPoint(d, CONFIG.flightPath, A);                       // ship path point (x, z-plane y, elev, tangent)
    pathPoint(d + frameDist, CONFIG.flightPath, B);           // framing lead
    pathPoint(Math.max(0, d - BEHIND), CONFIG.flightPath, K); // behind (clamped at path start)
    const p = { x: A.x, y: A.y };
    const fwd = { x: A.tx, y: A.ty };
    const dist = Math.hypot(A.x, A.y);
    chaseTargets(p, fwd, spdFrac, dist, arenaR, CONFIG.camera, chase);
    const fr = flightPathCam(chase, A, B, CONFIG.flightPath, cam, look);
    const e = A.elev;
    // behind point (track 12 u behind, at ship hover height)
    const r1 = projectNdc(K.x, SHIP_HOVER + e, K.y, fr.cam, fr.look, fov, aspect, ndc);
    if (Number.isNaN(r1.x)) { nan++; }
    else {
      const ax = Math.abs(r1.x), ay = Math.abs(r1.y);
      if (ax > 1 || ay > 1) { oob++; worstX = Math.max(worstX, ax); worstY = Math.max(worstY, ay); }
      maxNdcX = Math.max(maxNdcX, ax); maxNdcY = Math.max(maxNdcY, ay);
      minDepth = Math.min(minDepth, r1.z);
    }
    // ship NDC (ST-415 invariance on the path)
    const r2 = projectNdc(A.x, SHIP_HOVER + e, A.y, fr.cam, fr.look, fov, aspect, ndc);
    if (Number.isNaN(r2.x)) { sNaN++; continue; }
    sMinX = Math.min(sMinX, r2.x); sMaxX = Math.max(sMaxX, r2.x);
    sMinY = Math.min(sMinY, r2.y); sMaxY = Math.max(sMaxY, r2.y);
  }
  return { oob, nan, maxNdcX, maxNdcY, worstX, worstY, minDepth, sMinX, sMaxX, sMinY, sMaxY, sNaN };
}

let anyFix = false;
for (const spd of [0, 1]) {
  const r = run(spd);
  const pct = (100 * (r.oob + r.nan)) / N;
  console.log('spdFrac=' + spd);
  console.log('  behind out-of-frame: ' + r.oob + '/' + N + '  behind-cam/NaN: ' + r.nan + '  => ' + pct.toFixed(1) + '%');
  console.log('  max|ndc.x|=' + r.maxNdcX.toFixed(3) + '  max|ndc.y|=' + r.maxNdcY.toFixed(3) + '  worst-out x=' + r.worstX.toFixed(3) + ' y=' + r.worstY.toFixed(3) + '  minDepth=' + r.minDepth.toFixed(2));
  console.log('  ship ndc x [' + r.sMinX.toFixed(4) + ', ' + r.sMaxX.toFixed(4) + ']  y [' + r.sMinY.toFixed(4) + ', ' + r.sMaxY.toFixed(4) + ']  NaN=' + r.sNaN);
  if (spd === 0 && pct > 10) anyFix = true;
}
console.log('DECISION: ' + (anyFix ? 'FIX REQUIRED (>10% out-of-frame at rest)' : 'MEASURE-ONLY (no fix needed)'));
