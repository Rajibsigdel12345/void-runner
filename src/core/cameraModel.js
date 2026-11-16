// ST-415 (I445): chase-camera target math, edge-aware. Pure core (DOM-free,
// three-free) - the render layer (main.js) applies the returned targets each
// frame through its existing dampers.
//
// Why: the legacy chase rig was a FIXED world-angle offset (ship.x, 9, ship.y+13).
// Measured in I444: with the ship at arena y=+20 (inside the r=26 arena) the
// camera sat at y=33 - OUTSIDE the arena rim - so the half of the arena behind
// the ship fell out of frame (user report: "when the player goes to the very
// far it cannot see all the way back").
//
// Fix: the chase offset (height, dolly-back) AND the look-ahead scale by one
// uniform factor s(t), t = dist/arenaR:
//   s(t) = 1 + (rimScale - 1) * smoothstep(clamp01((t - startFrac) / (1 - startFrac)))^pow
// Because all three lengths scale by the same s, the camera->ship and
// camera->look ray angles are EXACTLY invariant with position: the ship keeps
// the same screen-space offset and the camera keeps the same view angle
// wherever the ship moves. At center (t <= startFrac) s = 1, so the legacy
// (9, 13) framing is preserved bit-identically where it already worked.
// (I444 pre-registered an additive dolly base(9,13)+e*(6,10); refined here to
// the uniform-scale form - same rim magnitudes 15.3/22.1 vs 15/23, but it is
// the only form that makes the screen offset a strict invariant.)

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep01(t) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

/**
 * Chase dolly factor s in [1, rimScale] for normalized distance t = dist/arenaR.
 * s = 1 for t <= dolly.startFrac (legacy framing), monotone to rimScale at the rim.
 */
export function dollyFactor(t, dolly) {
  const span = 1 - dolly.startFrac;
  const u = span <= 0 ? 0 : clamp01((t - dolly.startFrac) / span);
  const e = Math.pow(smoothstep01(u), dolly.pow);
  return 1 + (dolly.rimScale - 1) * e;
}

/**
 * Chase-camera targets for one frame.
 * @param p     {x, y} ship position on the arena plane (arena coords; world = (x, 0, y))
 * @param fwd   {x, y} unit ship facing
 * @param spdFrac 0..1 ship speed fraction
 * @param dist  ship distance from the arena center (caller precomputes; == hypot(p.x, p.y))
 * @param arenaR arena radius (CONFIG.arena.radius)
 * @param cfg   CONFIG.camera (needs camHeight, camBack, lookAhead, lookAheadSpeed, dolly)
 * @param out   {camX,camY,camZ,lookX,lookY,lookZ,s,ahead} written in place (no alloc)
 */
export function chaseTargets(p, fwd, spdFrac, dist, arenaR, cfg, out) {
  const s = dollyFactor(arenaR > 0 ? dist / arenaR : 0, cfg.dolly);
  const h = cfg.camHeight * s;
  const back = cfg.camBack * s;
  const ahead = (cfg.lookAhead + cfg.lookAheadSpeed * spdFrac) * s;
  out.s = s;
  out.ahead = ahead;
  out.camX = p.x;
  out.camY = h;
  out.camZ = p.y + back;
  out.lookX = p.x + fwd.x * ahead;
  out.lookY = 0; // arena plane (main.js overrides for the MENU hero framing)
  out.lookZ = p.y + fwd.y * ahead;
  return out;
}

/**
 * Minimal perspective projection to NDC, matching THREE.PerspectiveCamera
 * (vertical fov in degrees, +Y world up). Pure math so the invariants can be
 * unit-tested DOM-free and the headless probe can reuse the same formulas.
 * @param cam   {x,y,z} camera position (world)
 * @param look  {x,y,z} look target (world)
 * @returns out {x, y, z} NDC x/y in [-1,1] when the point is in front, else NaN x/y; z = camera-space depth
 */
export function projectNdc(px, py, pz, cam, look, fovDeg, aspect, out) {
  let wx = look.x - cam.x, wy = look.y - cam.y, wz = look.z - cam.z;
  const wl = Math.hypot(wx, wy, wz);
  if (wl < 1e-9) { out.x = NaN; out.y = NaN; out.z = NaN; return out; }
  wx /= wl; wy /= wl; wz /= wl;
  // right = normalize(cross(W, up)), up = (0,1,0)
  let rx = -wz, ry = 0, rz = wx;
  const rl = Math.hypot(rx, ry, rz);
  if (rl < 1e-9) { out.x = NaN; out.y = NaN; out.z = NaN; return out; } // looking straight up/down
  rx /= rl; ry /= rl; rz /= rl;
  // cam-up = cross(right, W)
  const ux = ry * wz - rz * wy, uy = rz * wx - rx * wz, uz = rx * wy - ry * wx;
  const dx = px - cam.x, dy = py - cam.y, dz = pz - cam.z;
  const cz = dx * wx + dy * wy + dz * wz;
  if (cz <= 0) { out.x = NaN; out.y = NaN; out.z = cz; return out; } // behind the camera
  const cx = dx * rx + dy * ry + dz * rz;
  const cy = dx * ux + dy * uy + dz * uz;
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360); // 1 / tan(fov/2)
  out.x = (cx / cz) * (f / aspect);
  out.y = (cy / cz) * f;
  out.z = cz;
  return out;
}

// ST-416 (I446): OVERVIEW camera targets - a fixed 3/4 view above the arena center.
// The targets do NOT depend on the ship: the view is the same wherever the ship moves
// (the whole arena frames at |NDC| <= 0.85 at 16:9 / fov 60 with the tuned values).
/**
 * @param cfg CONFIG.camera (needs overviewHeight, overviewBack)
 * @param out {camX,camY,camZ,lookX,lookY,lookZ} written in place (no alloc)
 */
export function overviewTargets(cfg, out) {
  out.camX = 0;
  out.camY = cfg.overviewHeight;
  out.camZ = cfg.overviewBack;
  out.lookX = 0; out.lookY = 0; out.lookZ = 0;
  return out;
}

// ST-416 (I446): COCKPIT camera targets - first-person seat: eye at cockpitHeight,
// setback behind the ship center along the facing, looking lookFar ahead on the arena plane.
/**
 * @param p   {x, y} ship position on the arena plane (world = (x, 0, y))
 * @param fwd {x, y} unit ship facing
 * @param cfg CONFIG.camera (needs cockpitHeight, cockpitSetback, cockpitLookFar)
 * @param out written in place (no alloc)
 */
export function cockpitTargets(p, fwd, cfg, out) {
  out.camX = p.x - fwd.x * cfg.cockpitSetback;
  out.camY = cfg.cockpitHeight;
  out.camZ = p.y - fwd.y * cfg.cockpitSetback;
  out.lookX = p.x + fwd.x * cfg.cockpitLookFar;
  out.lookY = 0; // arena plane horizon
  out.lookZ = p.y + fwd.y * cfg.cockpitLookFar;
  return out;
}
