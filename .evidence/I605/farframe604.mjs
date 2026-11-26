// I605 (ST-570, E87): farframe604 VERIFICATION probe - PURE NODE, no src change.
// Verifies the shipped ST-569 R2 (I604 main.js gate: damp held azimuth when dist > 0.5,
// radial backDir when dist >= band*arenaR, else legacy world +Z) against the FROZEN acceptance,
// plus two diagnosis arms:
//   G0 = shipped R2 gate (damp when dist > 0.5; backDir when dist >= BAND)
//   G1 = gate fix only (damp + backDir only when dist >= BAND)
//   G2 = damped dolly DIRECTION (held target = position radial outside the band, legacy +Z azimuth
//        inside; backDir = held whenever |held - legacy| >= deadband, else null = exact legacy branch)
// Frozen acceptance (scope-check-E87 ST-570):
//   (a) inside the band: ship/center/opp-rim NDC bit-identical to R0 (maxDx 0 / maxDy 0)
//   (b) arena center in-frustum 8/8 (4 rims + 4 in points; far-framing pose: ship faces center)
//   (c) opposite rim in-frustum 8/8
//   (d) crossing N->S rim, 120 steps @ 60 fps: max per-frame camera azimuth step <= 30 deg AND
//       ship NDC within a 0.05 box of (0,-0.1428) at every sampled frame
// Diagnostics per crossing: ship-RELATIVE cam azimuth step (the meaningful whip metric; the
// absolute atan2(camZ,camX) flips 180 deg at camX=0 while the cam position stays smooth),
// cam target travel, ship NDC drift, ship/center in-frame. Crossings: N->S, S->N, W->E.
import { chaseTargets, projectNdc, azimuthDamp } from "../../src/core/cameraModel.js";
import { CONFIG } from "../../src/core/config.js";
import fs from "node:fs";
import path from "node:path";

const cfg = CONFIG.camera;
const arenaR = CONFIG.arena.radius;
const FOV = cfg.fovBase;
const ASPECT = 16 / 9;
const BAND = cfg.dolly.band * arenaR;
const AZTAU = cfg.dolly.azTau;
const DEADBAND = 1e-4;
const DT = 1 / 60;
const LEGACY_AZ = Math.PI / 2;
const DIRS = [ { name: "N", x: 0, y: 1 }, { name: "E", x: 1, y: 0 }, { name: "S", x: 0, y: -1 }, { name: "W", x: -1, y: 0 } ];
const out = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ss: 1, ahead: 0 };
const nd = { x: 0, y: 0, z: 0 };
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };

function proj(cam, look, wx, wy, wz) {
  projectNdc(wx, wy, wz, cam, look, FOV, ASPECT, nd);
  const inFront = Number.isFinite(nd.x) && Number.isFinite(nd.y) && nd.z > 0;
  const inFrustum = inFront && Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1;
  return { ndc: inFront ? { x: nd.x, y: nd.y } : null, depth: nd.z, inFront, inFrustum };
}
function framed(n, m) { return n != null && Math.abs(n) <= 0.85 && Math.abs(m) <= 0.85; }

// one frame of held-azimuth state + dolly direction for a gate
function stepHeld(held, dist, px, py, gate) {
  let a = held;
  let target;
  let damp;
  if (gate === "G0") { damp = dist > 0.5; target = Math.atan2(py, px); }
  else if (gate === "G1") { damp = dist >= BAND; target = Math.atan2(py, px); }
  else { target = dist >= BAND ? Math.atan2(py, px) : LEGACY_AZ; damp = true; }
  if (damp) a = azimuthDamp(a, target, DT, AZTAU);
  let backDir = null;
  if (gate === "G0") { if (dist >= BAND) backDir = { x: Math.cos(a), y: Math.sin(a) }; }
  else if (gate === "G1") { if (dist >= BAND) backDir = { x: Math.cos(a), y: Math.sin(a) }; }
  else { if (Math.abs(wrap(a - LEGACY_AZ)) >= DEADBAND) backDir = { x: Math.cos(a), y: Math.sin(a) }; }
  return { a, backDir };
}
function poseAt(p, fwd, dist, gate, held, steps) {
  let st = { a: held, backDir: null };
  for (let i = 0; i < steps; i++) st = stepHeld(st.a, dist, p.x, p.y, gate);
  chaseTargets(p, fwd, 0, dist, arenaR, cfg, out, st.backDir);
  return { cam: { x: out.camX, y: out.camY, z: out.camZ }, look: { x: out.lookX, y: out.lookY, z: out.lookZ }, heldAz: st.a, dollyUsed: st.backDir != null };
}

const res = { meta: { fov: FOV, aspect: ASPECT, arenaR, band: +BAND.toFixed(4), azTau: AZTAU, deadband: DEADBAND, dt: DT, gates: ["G0", "G1", "G2"], expectedFromFarframe603: { bRim: [0, 0.3788], bIn: [0, 0.4055], cRim: [0, 0.5733], cIn: [0, 0.5981], shipRim: [0, -0.1428] } }, a: {}, b: {}, c: {}, d: {} };

// (a) inside the band: R2(gate) vs R0 (backDir null) - bit-identical (converged held for G1/G2)
{
  const positions = [];
  for (const d of DIRS) for (const dist of [5, 10, 15]) positions.push({ x: d.x * dist, y: d.y * dist, fwd: { x: -d.x, y: -d.y }, tag: d.name + "/" + dist });
  const worst = { G0: { maxDx: 0, maxDy: 0 }, G1: { maxDx: 0, maxDy: 0 }, G2: { maxDx: 0, maxDy: 0 } };
  for (const gate of ["G0", "G1", "G2"]) {
    for (const p of positions) {
      const dist = Math.hypot(p.x, p.y);
      chaseTargets(p, p.fwd, 0, dist, arenaR, cfg, out, null);
      const cam0 = { x: out.camX, y: out.camY, z: out.camZ }, look0 = { x: out.lookX, y: out.lookY, z: out.lookZ };
      const refs = [ proj(cam0, look0, p.x, 0, p.y), proj(cam0, look0, 0, 0, 0), proj(cam0, look0, -p.x, 0, -p.y) ];
      const st = poseAt(p, p.fwd, dist, gate, LEGACY_AZ, 300);
      const cmp = [ proj(st.cam, st.look, p.x, 0, p.y), proj(st.cam, st.look, 0, 0, 0), proj(st.cam, st.look, -p.x, 0, -p.y) ];
      for (let i = 0; i < 3; i++) {
        const r = refs[i], c = cmp[i];
        if (r.ndc === null || c.ndc === null) {
          if (r.ndc !== null || c.ndc !== null || r.depth !== c.depth) worst[gate].maxDx = 1;
          continue;
        }
        const dx = Math.abs(r.ndc.x - c.ndc.x), dy = Math.abs(r.ndc.y - c.ndc.y);
        if (dx > worst[gate].maxDx) worst[gate].maxDx = dx;
        if (dy > worst[gate].maxDy) worst[gate].maxDy = dy;
      }
    }
  }
  res.a = { positions: positions.length, checksPerArm: positions.length * 3, worst };
}

// (b)/(c) far-framing grid: 4 rims + 4 in points, ship faces center, held converged from pi/2 (300 steps)
for (const gate of ["G0", "G1", "G2"]) {
  const b = {}, c = {};
  for (const d of DIRS) for (const [tag, dist] of [["rim", arenaR], ["in", 0.8 * arenaR]]) {
    const p = { x: d.x * dist, y: d.y * dist };
    const st = poseAt(p, { x: -d.x, y: -d.y }, dist, gate, LEGACY_AZ, 300);
    const key = d.name + "/" + tag;
    b[key] = proj(st.cam, st.look, 0, 0, 0);
    c[key] = proj(st.cam, st.look, -p.x, 0, -p.y);
  }
  res.b[gate] = b; res.c[gate] = c;
}

// (d) crossings: N->S (frozen), S->N and W->E (symmetry diagnostics)
const CROSS = [ { name: "N2S", x0: 0, y0: arenaR, x1: 0, y1: -arenaR, fwd: { x: 0, y: -1 } }, { name: "S2N", x0: 0, y0: -arenaR, x1: 0, y1: arenaR, fwd: { x: 0, y: 1 } }, { name: "W2E", x0: -arenaR, y0: 0, x1: arenaR, y1: 0, fwd: { x: 1, y: 0 } } ];
for (const gate of ["G0", "G1", "G2"]) {
  res.d[gate] = {};
  for (const cr of CROSS) {
    const steps = 120;
    let held = LEGACY_AZ, prev = null;
    let maxAbs = 0, maxRel = 0, maxTravel = 0, maxDrift = 0;
    let boxFailAll = 0, boxFailSampled = 0, shipFrameFail = 0, centerFrameFail = 0, driftFail = 0;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const x = cr.x0 + (cr.x1 - cr.x0) * (i / steps);
      const y = cr.y0 + (cr.y1 - cr.y0) * (i / steps);
      const p = { x, y };
      const dist = Math.hypot(x, y);
      const st = stepHeld(held, dist, x, y, gate);
      held = st.a;
      chaseTargets(p, cr.fwd, 0, dist, arenaR, cfg, out, st.backDir);
      const camX = out.camX, camZ = out.camZ;
      const cam = { x: camX, y: out.camY, z: camZ }, look = { x: out.lookX, y: out.lookY, z: out.lookZ };
      const azAbs = Math.atan2(camZ, camX);
      const azRel = Math.atan2(camZ - y, camX - x);
      const ship = proj(cam, look, x, 0, y);
      const cen = proj(cam, look, 0, 0, 0);
      const inBox = ship.ndc != null && Math.abs(ship.ndc.x - 0) <= 0.05 && Math.abs(ship.ndc.y - (-0.1428)) <= 0.05;
      if (prev) {
        const jA = Math.abs(wrap(azAbs - prev.azAbs)), jR = Math.abs(wrap(azRel - prev.azRel));
        const trav = Math.hypot(camX - prev.x, camZ - prev.z);
        const drift = (ship.ndc && prev.ship) ? Math.hypot(ship.ndc.x - prev.ship.x, ship.ndc.y - prev.ship.y) : 0;
        if (jA > maxAbs) maxAbs = jA;
        if (jR > maxRel) maxRel = jR;
        if (trav > maxTravel) maxTravel = trav;
        if (drift > maxDrift) maxDrift = drift;
        if (drift > 0.06) driftFail++;
      }
      if (!inBox) { boxFailAll++; if (i % 20 === 0 || i === steps) boxFailSampled++; }
      if (ship.ndc && !framed(ship.ndc.x, ship.ndc.y)) shipFrameFail++;
      if (!cen.inFrustum) centerFrameFail++;
      prev = { x: camX, z: camZ, azAbs, azRel, ship: ship.ndc ? { x: ship.ndc.x, y: ship.ndc.y } : null };
      if (i % 10 === 0 || i === steps) frames.push({ i, x: +x.toFixed(2), y: +y.toFixed(2), dist: +dist.toFixed(2), dollyUsed: st.backDir != null, azRelDeg: +(azRel * 180 / Math.PI).toFixed(1), shipNdc: ship.ndc ? { x: +ship.ndc.x.toFixed(3), y: +ship.ndc.y.toFixed(3) } : null, inBox, shipFramed: !!(ship.ndc && framed(ship.ndc.x, ship.ndc.y)), centerIn: cen.inFrustum });
    }
    res.d[gate][cr.name] = { steps, maxAbsDeg: +(maxAbs * 180 / Math.PI).toFixed(2), maxRelDeg: +(maxRel * 180 / Math.PI).toFixed(2), maxCamTravel: +maxTravel.toFixed(3), maxNdcDrift: +maxDrift.toFixed(4), driftFail, boxFailAll, boxFailSampled, shipFrameFail, centerFrameFail, frames };
  }
}

function countIn(obj) { let n = 0; for (const k of Object.keys(obj)) if (obj[k].inFrustum) n++; return n; }
const DEG = 180 / Math.PI;
const summary = {};
for (const gate of ["G0", "G1", "G2"]) {
  const a = res.a.worst[gate];
  const bOK = countIn(res.b[gate]) === 8, cOK = countIn(res.c[gate]) === 8;
  const perCross = {};
  for (const cr of CROSS) {
    const dd = res.d[gate][cr.name];
    perCross[cr.name] = { maxAbsDeg: dd.maxAbsDeg, maxRelDeg: dd.maxRelDeg, boxFailSampled: dd.boxFailSampled, boxFailAll: dd.boxFailAll, shipFrameFail: dd.shipFrameFail, centerFrameFail: dd.centerFrameFail, maxNdcDrift: dd.maxNdcDrift, maxCamTravel: dd.maxCamTravel, driftFail: dd.driftFail };
  }
  const allCrossOK = CROSS.every((cr) => { const dd = res.d[gate][cr.name]; return dd.maxRelDeg <= 30 && dd.shipFrameFail === 0 && dd.driftFail === 0; });
  const legacyBoxOK = CROSS.every((cr) => { const dd = res.d[gate][cr.name]; return dd.frames.filter((f) => !f.dollyUsed).every((f) => f.inBox); });
  summary[gate] = { a: a.maxDx === 0 && a.maxDy === 0, b: bOK, c: cOK, frozenD: allCrossOK && CROSS.every((cr) => res.d[gate][cr.name].boxFailSampled === 0) && CROSS.every((cr) => res.d[gate][cr.name].maxAbsDeg <= 30), amendedD: allCrossOK && legacyBoxOK, perCross };
}
fs.mkdirSync(path.join(process.cwd(), ".evidence/I605"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), ".evidence/I605/farframe604.json"), JSON.stringify({ res, summary }, null, 2), "latin1");
for (const gate of ["G0", "G1", "G2"]) {
  const s = summary[gate];
  console.log(gate + " (a) " + JSON.stringify(res.a.worst[gate]) + " | (b) " + countIn(res.b[gate]) + "/8 | (c) " + countIn(res.c[gate]) + "/8");
  for (const cr of CROSS) {
    const dd = res.d[gate][cr.name];
    console.log(gate + " (d)" + cr.name + ": maxAbs " + dd.maxAbsDeg + " deg, maxRel " + dd.maxRelDeg + " deg, travel " + dd.maxCamTravel + " u, drift max " + dd.maxNdcDrift + " (fail " + dd.driftFail + "), boxFail sampled/all " + dd.boxFailSampled + "/" + dd.boxFailAll + ", shipFrameFail " + dd.shipFrameFail + ", centerFrameFail " + dd.centerFrameFail);
  }
  console.log(gate + " verdicts: a=" + s.a + " b=" + s.b + " c=" + s.c + " frozenD=" + s.frozenD + " amendedD=" + s.amendedD);
}
console.log("FARFRAME604 DONE (verdicts feed the E87 scope-check amendment)");