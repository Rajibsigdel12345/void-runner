// I530 (ST-496, E71 R-CAM-2): far-view cross-mode verification (WITH MEASUREMENT, headless, pure core, DOM-free).
// Pre-registered (design/e71-camera-fpv-research.md sec.3 R-CAM-2):
//   (a) ENDLESS at the arena rim (t->1, the I445 dolly engages)
//   (b) CAMPAIGN at the max flight-path excursion (race line + flightPathCam lift)
// For each: cam->ship + cam->look angles at two positions (invariance) + behind-ship coverage / far-view %.
// Decision rule (inherited from I504, pre-registered): >10% out-of-frame at rest => minimal lever; else document-only.
import { pathPoint } from '../../src/core/flightPath.js';
import { chaseTargets, flightPathCam, projectNdc } from '../../src/core/cameraModel.js';
import { CONFIG } from '../../src/core/config.js';

const fov = CONFIG.camera.fovBase;          // 60
const aspect = 16 / 9;
const arenaR = CONFIG.arena.radius;         // 26
const frameDist = CONFIG.flightPath.frameDist; // 11
const SHIP_HOVER = 0.4;
const BEHIND = 12;                          // metres of "behind" measured at the ship
const A = { x: 0, y: 0 }, B = { x: 0, y: 0 };
const chase = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ahead: 0 };
const cam = { x: 0, y: 0, z: 0 }, look = { x: 0, y: 0, z: 0 };
const ndc = { x: 0, y: 0, z: 0 };

function dirDeg(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  return { az: Math.atan2(v.x, v.z) * 180 / Math.PI, el: Math.asin(Math.max(-1, Math.min(1, v.y / len))) * 180 / Math.PI };
}
function outOfFrame(px, py, pz, c, l) {
  const r = projectNdc(px, py, pz, c, l, fov, aspect, ndc);
  if (Number.isNaN(r.x)) return 'behind';
  return (Math.abs(r.x) > 1 || Math.abs(r.y) > 1) ? 'oob' : 'in';
}

console.log('=== A. ENDLESS - arena rim (t -> 1) ===');
// A1: invariance at two positions, same heading + speed (center t=0 vs rim t=1)
for (const spd of [0, 1]) {
  const rows = [];
  for (const [name, p, fwd] of [['center(0,0) fwd(0,1)', { x: 0, y: 0 }, { x: 0, y: 1 }], ['rim(0,' + arenaR + ') fwd(0,1)', { x: 0, y: arenaR }, { x: 0, y: 1 }], ['rim(' + arenaR + ',0) fwd(0,1)', { x: arenaR, y: 0 }, { x: 0, y: 1 }]]) {
    const dist = Math.hypot(p.x, p.y);
    chaseTargets(p, fwd, spd, dist, arenaR, CONFIG.camera, chase);
    const c = { x: chase.camX, y: chase.camY, z: chase.camZ }, l = { x: chase.lookX, y: chase.lookY, z: chase.lookZ };
    const ship = { x: p.x, y: SHIP_HOVER, z: p.y };
    const dShip = dirDeg({ x: ship.x - c.x, y: ship.y - c.y, z: ship.z - c.z });
    const dLook = dirDeg({ x: l.x - c.x, y: l.y - c.y, z: l.z - c.z });
    const r = projectNdc(ship.x, ship.y, ship.z, c, l, fov, aspect, ndc);
    rows.push([name, chase.s.toFixed(3), dShip.az.toFixed(2), dShip.el.toFixed(2), dLook.az.toFixed(2), dLook.el.toFixed(2), r.x.toFixed(4), r.y.toFixed(4)]);
  }
  console.log('spdFrac=' + spd + ' (s, camShipAz, camShipEl, camLookAz, camLookEl, shipNdcX, shipNdcY)');
  for (const r of rows) console.log('  ' + r.join(' '));
  const dAzS = Math.abs(parseFloat(rows[1][2]) - parseFloat(rows[0][2])) + Math.abs(parseFloat(rows[2][2]) - parseFloat(rows[0][2]));
  const dElS = Math.abs(parseFloat(rows[1][3]) - parseFloat(rows[0][3])) + Math.abs(parseFloat(rows[2][3]) - parseFloat(rows[0][3]));
  const dNdc = Math.max(Math.abs(parseFloat(rows[1][6]) - parseFloat(rows[0][6])), Math.abs(parseFloat(rows[2][6]) - parseFloat(rows[0][6])), Math.abs(parseFloat(rows[1][7]) - parseFloat(rows[0][7])), Math.abs(parseFloat(rows[2][7]) - parseFloat(rows[0][7])));
  console.log('  INVARIENCE center->rim: dCamShip az+el=' + dAzS.toFixed(3) + 'deg/' + dElS.toFixed(3) + 'deg  maxShipNdcDelta=' + dNdc.toFixed(4));
}
// A2: far-view % at the rim (theta sweep x 4 headings x 2 speeds)
function endlessSweep(rMin, rMax, label) {
  const stats = { n: 0, behind: { in: 0, oob: 0, behind: 0 }, diam: { in: 0, oob: 0, behind: 0 }, center: { in: 0, oob: 0, behind: 0 } };
  for (let ti = 0; ti < 24; ti++) {
    const th = (ti / 24) * Math.PI * 2;
    for (const r of [rMin, (rMin + rMax) / 2, rMax]) {
      const p = { x: r * Math.cos(th), y: r * Math.sin(th) };
      const dist = Math.hypot(p.x, p.y);
      const radIn = dist > 0 ? { x: -p.x / dist, y: -p.y / dist } : { x: 0, y: -1 };
      const heads = [[radIn.x, radIn.y], [-radIn.x, -radIn.y], { x: -radIn.y, y: radIn.x }, { x: radIn.y, y: -radIn.x }];
      for (const fwd of heads) {
        for (const spd of [0, 1]) {
          chaseTargets(p, fwd, spd, dist, arenaR, CONFIG.camera, chase);
          const c = { x: chase.camX, y: chase.camY, z: chase.camZ }, l = { x: chase.lookX, y: chase.lookY, z: chase.lookZ };
          const b = { x: p.x - fwd.x * BEHIND, y: SHIP_HOVER, z: p.y - fwd.y * BEHIND };
          stats.behind[outOfFrame(b.x, b.y, b.z, c, l)]++;
          const df = dist > 0 ? { x: -p.x / dist, y: -p.y / dist } : { x: 0, y: 0 };
          const dm = { x: df.x * arenaR, y: SHIP_HOVER, z: df.y * arenaR };
          stats.diam[outOfFrame(dm.x, dm.y, dm.z, c, l)]++;
          stats.center[outOfFrame(0, 0, 0, c, l)]++;
          stats.n++;
        }
      }
    }
  }
  const pct = k => (100 * (k.oob + k.behind)) / stats.n;
  console.log(label + ' n=' + stats.n);
  console.log('  behind-12m (ship - fwd*12):   in=' + stats.behind.in + ' oob=' + stats.behind.oob + ' behindCam=' + stats.behind.behind + ' => out ' + pct(stats.behind).toFixed(1) + '%');
  console.log('  diametric rim point (far rim): in=' + stats.diam.in + ' oob=' + stats.diam.oob + ' behindCam=' + stats.diam.behind + ' => out ' + pct(stats.diam).toFixed(1) + '%');
  console.log('  arena center:                  in=' + stats.center.in + ' oob=' + stats.center.oob + ' behindCam=' + stats.center.behind + ' => out ' + pct(stats.center).toFixed(1) + '%');
  return pct(stats.behind);
}
endlessSweep(arenaR, arenaR, 'RIM ONLY (t=1, dolly engaged):');
endlessSweep(0, arenaR, 'FULL ARENA (t=0..1):');

console.log('');
console.log('=== B. CAMPAIGN - flight-path excursion (re-verifies I504 8.6% at rest) ===');
const D0 = 0, D1 = 250, N = 500;
let maxExc = 0, maxExcD = 0, maxElev = 0;
const exc = new Array(N);
for (let i = 0; i < N; i++) {
  const d = D0 + (D1 * i) / (N - 1);
  pathPoint(d, CONFIG.flightPath, A);
  exc[i] = Math.hypot(A.x, A.y);
  if (exc[i] > maxExc) { maxExc = exc[i]; maxExcD = d; }
  if ((A.elev || 0) > maxElev) maxElev = A.elev || 0;
}
console.log('max path excursion: ' + maxExc.toFixed(2) + ' u at d=' + maxExcD.toFixed(1) + '  maxElev=' + maxElev.toFixed(2));
for (const spd of [0, 1]) {
  let oob = 0, nan = 0, sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity, sNaN = 0;
  for (let i = 0; i < N; i++) {
    const d = D0 + (D1 * i) / (N - 1);
    pathPoint(d, CONFIG.flightPath, A);
    pathPoint(d + frameDist, CONFIG.flightPath, B);
    const K = { x: 0, y: 0 };
    pathPoint(Math.max(0, d - BEHIND), CONFIG.flightPath, K);
    const p = { x: A.x, y: A.y };
    const fwd = { x: A.tx, y: A.ty };
    chaseTargets(p, fwd, spd, Math.hypot(p.x, p.y), arenaR, CONFIG.camera, chase);
    const fr = flightPathCam(chase, A, B, CONFIG.flightPath, cam, look);
    const e = A.elev || 0;
    const r1 = projectNdc(K.x, SHIP_HOVER + e, K.y, fr.cam, fr.look, fov, aspect, ndc);
    if (Number.isNaN(r1.x)) nan++;
    else if (Math.abs(r1.x) > 1 || Math.abs(r1.y) > 1) oob++;
    const r2 = projectNdc(A.x, SHIP_HOVER + e, A.y, fr.cam, fr.look, fov, aspect, ndc);
    if (Number.isNaN(r2.x)) sNaN++;
    else { sMinX = Math.min(sMinX, r2.x); sMaxX = Math.max(sMaxX, r2.x); sMinY = Math.min(sMinY, r2.y); sMaxY = Math.max(sMaxY, r2.y); }
  }
  const pct = (100 * (oob + nan)) / N;
  console.log('spdFrac=' + spd + ': behind-12m out-of-frame ' + oob + '/' + N + ' behindCam/NaN ' + nan + ' => ' + pct.toFixed(1) + '%  shipNdc x[' + sMinX.toFixed(4) + ',' + sMaxX.toFixed(4) + '] y[' + sMinY.toFixed(4) + ',' + sMaxY.toFixed(4) + '] NaN=' + sNaN);
}
// B2: invariance at two campaign positions (d=0 vs d=maxExcursion), with the flightPathCam lift (the actual campaign rig)
for (const [label, dTest] of [['d=0', 0], ['d=maxExc(' + maxExcD.toFixed(1) + ')', maxExcD]]) {
  pathPoint(dTest, CONFIG.flightPath, A);
  pathPoint(dTest + frameDist, CONFIG.flightPath, B);
  const p = { x: A.x, y: A.y }, fwd = { x: A.tx, y: A.ty };
  chaseTargets(p, fwd, 0, Math.hypot(p.x, p.y), arenaR, CONFIG.camera, chase);
  const fr = flightPathCam(chase, A, B, CONFIG.flightPath, cam, look);
  const c = { x: fr.cam.x, y: fr.cam.y, z: fr.cam.z }, l = { x: fr.look.x, y: fr.look.y, z: fr.look.z };
  const e = A.elev || 0;
  const ship = { x: p.x, y: SHIP_HOVER + e, z: p.y };
  const dShip = dirDeg({ x: ship.x - c.x, y: ship.y - c.y, z: ship.z - c.z });
  const dLook = dirDeg({ x: l.x - c.x, y: l.y - c.y, z: l.z - c.z });
  const r = projectNdc(ship.x, ship.y, ship.z, c, l, fov, aspect, ndc);
  console.log('campaign ' + label + ': exc=' + Math.hypot(p.x, p.y).toFixed(2) + ' s=' + chase.s.toFixed(3) + ' camShip(' + dShip.az.toFixed(2) + ',' + dShip.el.toFixed(2) + ') camLook(' + dLook.az.toFixed(2) + ',' + dLook.el.toFixed(2) + ') shipNdc(' + r.x.toFixed(4) + ',' + r.y.toFixed(4) + ')');
}
console.log('');
console.log('RULE: >10% out-of-frame at rest => minimal lever; else MEASURE-ONLY (document).');