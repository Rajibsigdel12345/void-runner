import { chaseTargets, projectNdc, azimuthDamp } from "../../src/core/cameraModel.js";
import { CONFIG } from "../../src/core/config.js";
const cfg = CONFIG.camera, arenaR = CONFIG.arena.radius;
const out = { camX:0,camY:0,camZ:0,lookX:0,lookY:0,lookZ:0,s:1,ss:1,ahead:0 };
const nd = { x:0,y:0,z:0 };
function shipNdc(p, fwd, backDir) {
  const dist = Math.hypot(p.x, p.y);
  chaseTargets(p, fwd, 0, dist, arenaR, cfg, out, backDir);
  const cam = { x: out.camX, y: out.camY, z: out.camZ }, look = { x: out.lookX, y: out.lookY, z: out.lookZ };
  projectNdc(p.x, 0, p.y, cam, look, cfg.fovBase, 16/9, nd);
  return { ship: { x: +nd.x.toFixed(4), y: +nd.y.toFixed(4) }, cam: { x:+cam.x.toFixed(3), y:+cam.y.toFixed(3), z:+cam.z.toFixed(3) } };
}
// converged radial poses at the rim (held = radial exactly): ship faces OUTWARD (crossing end) and INWARD (grid convention)
const cases = [
  ["S rim, facing south (outward, N2S crossing end)", {x:0,y:-arenaR}, {x:0,y:-1}, {x:0,y:-1}],
  ["S rim, facing north (toward center, grid convention)", {x:0,y:-arenaR}, {x:0,y:1}, {x:0,y:-1}],
  ["E rim, facing east (outward, W2E crossing end)", {x:arenaR,y:0}, {x:1,y:0}, {x:1,y:0}],
  ["N rim, facing north (outward, S2N crossing end)", {x:0,y:arenaR}, {x:0,y:1}, {x:0,y:1}],
];
for (const [tag, p, fwd, bd] of cases) {
  const r = shipNdc(p, fwd, bd);
  console.log(tag, JSON.stringify(r));
}
// legacy reference values (backDir null) at the same poses
for (const [tag, p, fwd] of cases) {
  const r = shipNdc(p, fwd, null);
  console.log("LEGACY", tag, JSON.stringify(r.ship));
}