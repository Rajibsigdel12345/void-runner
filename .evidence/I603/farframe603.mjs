// I603 (E87 open): far-framing FIX prediction probe - PURE NODE, no src change.
// Evaluates backDir candidates over the I601 (b)/(c) grid + (a)-style ship-offset metrics,
// so the E87 scope-check can freeze the design WITH MEASUREMENT before any code lands.
// Candidates:
//   R0 (baseline, I601): backDir null = legacy world +Z dolly.
//   R1 (full radial): backDir = normalize(p); p=0 -> (0,1).
//   R2 (banded radial): dist >= BAND (0.7*26) ? normalize(p) : null (world +Z inside the band);
//      a runtime azimuth-hold (last radial azimuth while inside the band) is evaluated
//      separately in the crossing sub-probe.
import { chaseTargets, projectNdc } from "../../src/core/cameraModel.js";
import { CONFIG } from "../../src/core/config.js";
import fs from "node:fs";
import path from "node:path";

const cfg = CONFIG.camera;
const arenaR = CONFIG.arena.radius;
const FOV = cfg.fovBase;
const ASPECT = 16 / 9;
const BAND = 0.7 * arenaR;
const DIRS = [ { name: "N", x: 0, y: 1 }, { name: "E", x: 1, y: 0 }, { name: "S", x: 0, y: -1 }, { name: "W", x: -1, y: 0 } ];
const out = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ss: 1, ahead: 0 };
const nd = { x: 0, y: 0, z: 0 };
const norm = (x, y) => { const l = Math.hypot(x, y); return l < 1e-9 ? { x: 0, y: 1 } : { x: x / l, y: y / l }; };
function backdirOf(p, cand) {
  if (cand === "R0") return null;
  const d = Math.hypot(p.x, p.y);
  if (cand === "R1") return norm(p.x, p.y);
  if (cand === "R2") return d >= BAND ? norm(p.x, p.y) : null;
  throw new Error("cand");
}
function place(p, fwd, dist, cand, heldAz) {
  const bd = backdirOf(p, cand);
  const backDir = bd !== null ? bd : (cand === "R2" && heldAz ? { x: Math.cos(heldAz), y: Math.sin(heldAz) } : null);
  chaseTargets(p, fwd, 0, dist, arenaR, cfg, out, backDir);
  return { cam: { x: out.camX, y: out.camY, z: out.camZ }, look: { x: out.lookX, y: out.lookY, z: out.lookZ } };
}
function proj(cam, look, wx, wy, wz) {
  projectNdc(wx, wy, wz, cam, look, FOV, ASPECT, nd);
  const inFront = Number.isFinite(nd.x) && Number.isFinite(nd.y) && nd.z > 0;
  const inFrustum = inFront && Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1;
  return { ndc: inFront ? { x: +nd.x.toFixed(4), y: +nd.y.toFixed(4) } : null, depth: +nd.z.toFixed(4), inFront, inFrustum };
}
const res = { meta: { fov: FOV, aspect: ASPECT, arenaR, band: +BAND.toFixed(4), cands: ["R0", "R1", "R2"] }, cands: {} };
for (const cand of ["R0", "R1", "R2"]) {
  const c = { b: {}, c: {}, a1: {}, a2: {} };
  for (const d of DIRS) {
    for (const [tag, dist] of [["rim", arenaR], ["in", 0.8 * arenaR]]) {
      const p = { x: d.x * dist, y: d.y * dist };
      const fwd = { x: -d.x, y: -d.y };
      const { cam, look } = place(p, fwd, dist, cand);
      c.b[d.name + "/" + tag] = proj(cam, look, 0, 0, 0);
      c.c[d.name + "/" + tag] = proj(cam, look, -p.x, 0, -p.y);
      if (tag === "rim") c.a2[d.name + "/rim"] = proj(cam, look, p.x, 0, p.y).ndc;
    }
  }
  for (const [tag, dist] of [["in", 0.8 * arenaR], ["rim", arenaR]]) {
    const pos = [ { x: dist, y: 0 }, { x: 0, y: dist }, { x: -dist * 0.7071, y: -dist * 0.7071 } ];
    const ships = pos.map((p) => { const { cam, look } = place(p, { x: 0, y: -1 }, dist, cand); return proj(cam, look, p.x, 0, p.y).ndc; });
    const xs = ships.map((r) => r.x), ys = ships.map((r) => r.y);
    c.a1[tag] = { maxDx: +(Math.max(...xs) - Math.min(...xs)).toPrecision(4), maxDy: +(Math.max(...ys) - Math.min(...ys)).toPrecision(4), ships };
  }
  res.cands[cand] = c;
}
// X: R2 + azimuth hold, N rim -> S rim along y (heading (0,-1)), 121 steps
{
  const steps = 120;
  let heldAz = null, maxJump = 0, travel = 0, prevAz = null, prevX = null, prevZ = null;
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const y = arenaR - (2 * arenaR * i) / steps;
    const dist = Math.abs(y);
    const radial = dist >= BAND;
    if (radial) heldAz = Math.atan2(y, 0);
    const backDir = heldAz !== null ? { x: Math.cos(heldAz), y: Math.sin(heldAz) } : null;
    chaseTargets({ x: 0, y }, { x: 0, y: -1 }, 0, dist, arenaR, cfg, out, backDir);
    const azNow = Math.atan2(out.camZ, out.camX);
    if (prevAz !== null) {
      let j = Math.abs(azNow - prevAz); if (j > Math.PI) j = 2 * Math.PI - j;
      if (j > maxJump) maxJump = j;
      travel += Math.hypot(out.camX - prevX, out.camZ - prevZ);
    }
    prevAz = azNow; prevX = out.camX; prevZ = out.camZ;
    if (i % 20 === 0 || i === steps) {
      const cam = { x: out.camX, y: out.camY, z: out.camZ }, look = { x: out.lookX, y: 0, z: out.lookZ };
      samples.push({ i, y: +y.toFixed(2), dist: +dist.toFixed(2), camAz: +azNow.toFixed(3), shipNdc: proj(cam, look, 0, 0, y).ndc, centerIn: proj(cam, look, 0, 0, 0).inFrustum });
    }
  }
  res.crossingR2hold = { steps, maxJumpDeg: +(maxJump * 57.29578).toFixed(3), totalCamTravel: +travel.toFixed(3), samples };
}
fs.mkdirSync(path.join(process.cwd(), ".evidence/I603"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), ".evidence/I603/farframe603.json"), JSON.stringify(res, null, 2), "latin1");
for (const cand of ["R0", "R1", "R2"]) {
  const c = res.cands[cand];
  const bRim = DIRS.map((d) => c.b[d.name + "/rim"].inFrustum).filter(Boolean).length;
  const cRim = DIRS.map((d) => c.c[d.name + "/rim"].inFrustum).filter(Boolean).length;
  const bIn = DIRS.map((d) => c.b[d.name + "/in"].inFrustum).filter(Boolean).length;
  const cIn = DIRS.map((d) => c.c[d.name + "/in"].inFrustum).filter(Boolean).length;
  console.log(cand + ": (b) rim " + bRim + "/4 in " + bIn + "/4 | (c) rim " + cRim + "/4 in " + cIn + "/4 | A1 in " + JSON.stringify(c.a1.in) + " | A1 rim " + JSON.stringify(c.a1.rim));
}
console.log("A2 ship NDC facing center from rim: R0 " + JSON.stringify(res.cands.R0.a2) + " | R2 " + JSON.stringify(res.cands.R2.a2));
console.log("crossing R2+hold: maxJump " + res.crossingR2hold.maxJumpDeg + " deg, travel " + res.crossingR2hold.totalCamTravel);
console.log("FARFRAME603 DONE (prediction probe - no verdict gate; numbers feed the E87 scope-check)");