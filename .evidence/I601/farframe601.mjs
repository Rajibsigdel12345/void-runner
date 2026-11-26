// ST-566 (I601): far-framing end-to-end verification - PURE NODE (no server/browser).
// Verifies the frozen ST-566 acceptance over the REAL endless-mode call shape
// (main.js: chaseTargets(ship.pos, f, 0, dist, CONFIG.arena.radius, CONFIG.camera, out, null)
//  -> backDir = null = legacy world +Z dolly; projectNdc fovBase 60 @ 16:9):
//  (a) ship NDC offset invariance tol 0.005: same (dist, heading) at different
//      positions -> identical ship NDC (the I445 position-invariance design invariant;
//      by construction cam = (p.x, h, p.y+back), look = p + fwd*ahead, so the
//      cam->ship and cam->look vectors are p-independent at fixed (dist, fwd)).
//  (b) arena center in-frustum from the rim: 4 rim dirs (ship facing center) ->
//      project (0,0,0), require cz > 0 and |ndc.x| <= 1 and |ndc.y| <= 1.
//  (c) opposite rim in-front + stretch in-frustum metric: project the rim point
//      directly across the arena (2*arenaR from the ship, ground), require cz > 0
//      and record |ndc.x|, |ndc.y| (in-frustum iff both <= 1).
// Encoding decision (documented per the frozen "numbers into scope-check evidence"):
//  exit 1 ONLY if (a) fails (a true design-invariant regression). (b)/(c) print
//  per-direction measured results + inFrustum booleans; failures are recorded as
//  residuals (I596 accept-with-documentation pattern), not hard failures.
import { chaseTargets, projectNdc } from "../../src/core/cameraModel.js";
import { CONFIG } from "../../src/core/config.js";
import fs from "node:fs";
import path from "node:path";

const cfg = CONFIG.camera;
const arenaR = CONFIG.arena.radius;
const FOV = cfg.fovBase;
const ASPECT = 16 / 9;
const TOL = 0.005;
const DIRS = [ { name: "N", x: 0, y: 1 }, { name: "E", x: 1, y: 0 }, { name: "S", x: 0, y: -1 }, { name: "W", x: -1, y: 0 } ];

const out = { camX: 0, camY: 0, camZ: 0, lookX: 0, lookY: 0, lookZ: 0, s: 1, ss: 1, ahead: 0 };
const nd = { x: 0, y: 0, z: 0 };

function place(p, fwd, dist) {
  chaseTargets(p, fwd, 0, dist, arenaR, cfg, out);
  const cam = { x: out.camX, y: out.camY, z: out.camZ };
  const look = { x: out.lookX, y: out.lookY, z: out.lookZ };
  return { cam, look, s: out.s, ahead: out.ahead };
}
function proj(cam, look, wx, wy, wz) {
  projectNdc(wx, wy, wz, cam, look, FOV, ASPECT, nd);
  const inFront = Number.isFinite(nd.x) && Number.isFinite(nd.y) && nd.z > 0;
  const inFrustum = inFront && Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1;
  return {
    ndc: inFront ? { x: +nd.x.toFixed(4), y: +nd.y.toFixed(4) } : null,
    depth: +nd.z.toFixed(4),
    inFront,
    inFrustum,
    stretch: inFront ? { ax: +Math.abs(nd.x).toFixed(4), ay: +Math.abs(nd.y).toFixed(4) } : null
  };
}

const res = {
  meta: { fov: FOV, aspect: ASPECT, arenaR, dolly: cfg.dolly, camHeight: cfg.camHeight, camBack: cfg.camBack, lookAhead: cfg.lookAhead, tol: TOL, backDir: "null (legacy world +Z, endless per main.js)" },
  a_invariance: { in: null, rim: null, centerRef: null },
  b_centerFromRim: {},
  c_oppRim: {},
  results: {}
};

// (a) invariance: fixed heading (0,-1) [the home chase direction, ship faces away
// from the world +Z camera], 3 positions at the same dist.
function invariance(dist, label) {
  const pos = [ { x: dist, y: 0 }, { x: 0, y: dist }, { x: -dist * 0.7071, y: -dist * 0.7071 } ];
  const fwd = { x: 0, y: -1 };
  const ships = pos.map((p) => { const f = { x: fwd.x, y: fwd.y }; const { cam, look, s } = place(p, f, dist); return { s, ship: proj(cam, look, p.x, 0, p.y) }; });
  const xs = ships.map((r) => r.ship.ndc.x);
  const ys = ships.map((r) => r.ship.ndc.y);
  const dx = Math.max(...xs) - Math.min(...xs);
  const dy = Math.max(...ys) - Math.min(...ys);
  return { dist, s: ships[0].s, shipNdc: ships.map((r) => r.ship.ndc), maxDx: +dx.toPrecision(3), maxDy: +dy.toPrecision(3), pass: dx <= TOL && dy <= TOL };
}
res.a_invariance.in = invariance(0.8 * arenaR, "in");
res.a_invariance.rim = invariance(arenaR, "rim");
{ // center reference (dist 0, s = 1, legacy framing)
  const { cam, look, s } = place({ x: 0, y: 0 }, { x: 0, y: -1 }, 0);
  res.a_invariance.centerRef = { s, ship: proj(cam, look, 0, 0, 0).ndc };
}

// (b)+(c): 4 rim dirs x in/out, ship facing the arena center
for (const d of DIRS) {
  for (const [tag, dist] of [["rim", arenaR], ["in", 0.8 * arenaR]]) {
    const p = { x: d.x * dist, y: d.y * dist };
    const fwd = { x: -d.x, y: -d.y };
    const { cam, look, s } = place(p, fwd, dist);
    const center = proj(cam, look, 0, 0, 0);
    const opp = proj(cam, look, -p.x, 0, -p.y);
    const key = d.name + "/" + tag;
    res.b_centerFromRim[key] = { s, center, centerInFrustum: center.inFrustum };
    res.c_oppRim[key] = { s, opp, oppInFrustum: opp.inFrustum };
  }
}

// verdicts
const aPass = res.a_invariance.in.pass && res.a_invariance.rim.pass;
const bRim = DIRS.map((d) => res.b_centerFromRim[d.name + "/rim"]);
const bPassCount = bRim.filter((r) => r.centerInFrustum).length;
const cRim = DIRS.map((d) => res.c_oppRim[d.name + "/rim"]);
const cPassCount = cRim.filter((r) => r.oppInFrustum).length;
res.results = { a: aPass ? "PASS" : "FAIL", b_rim: bPassCount + "/4 (center in-frustum from rim)", c_rim: cPassCount + "/4 (opposite rim in-front + in-frustum)" };

fs.mkdirSync(path.join(process.cwd(), ".evidence/I601"), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), ".evidence/I601/farframe601.json"), JSON.stringify(res, null, 2), "latin1");

console.log("=== FARFRAME601 (ST-566, I601) - pure node, no server ===");
console.log("meta: " + JSON.stringify(res.meta));
console.log("(a) invariance in  : " + JSON.stringify(res.a_invariance.in));
console.log("(a) invariance rim : " + JSON.stringify(res.a_invariance.rim));
console.log("(a) center ref     : " + JSON.stringify(res.a_invariance.centerRef));
console.log("(b) center from rim: " + JSON.stringify(res.b_centerFromRim));
console.log("(c) opp rim from rim: " + JSON.stringify(res.c_oppRim));
console.log("RESULTS: (a) " + res.results.a + " | (b) " + res.results.b_rim + " | (c) " + res.results.c_rim);
console.log("FARFRAME601 " + (aPass ? "PASS" : "FAIL"));
process.exit(aPass ? 0 : 1);