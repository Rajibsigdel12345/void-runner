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
 * @param out   {camX,camY,camZ,lookX,lookY,lookZ,s,ss,ahead} written in place (no alloc)
 * @param backDir optional {x,y} unit 2D dolly-back direction (default legacy world +Z; campaign = rail tangent)
 */
export function chaseTargets(p, fwd, spdFrac, dist, arenaR, cfg, out, backDir) {
  const s = dollyFactor(arenaR > 0 ? dist / arenaR : 0, cfg.dolly);
  // ST-525 (I559): speed dolly (CAM-1 "zoom out on the boost") - uniform extra scale ss
  // of the cam->ship offset ONLY (height + dolly-back). ss = 1 EXACTLY at rest
  // (spdFrac 0 -> bit-identical framing; frozen rest-state pins hold). Look-ahead
  // NOT scaled -> view leans slightly forward at speed (dolly-out reads as motion;
  // ship settles toward screen center). "Zoom in on the brake" dropped by design:
  // no brake input and rest must stay bit-identical.
  const sp = cfg.dolly.speed;
  const ss = sp ? 1 + (sp.boost - 1) * (spdFrac < 0 ? 0 : spdFrac > 1 ? 1 : spdFrac) : 1;
  const h = cfg.camHeight * s * ss;
  const back = cfg.camBack * s * ss;
  const ahead = (cfg.lookAhead + cfg.lookAheadSpeed * spdFrac) * s;
  out.s = s; out.ss = ss; out.ahead = ahead;
  // ST-525 (I559): backDir = unit 2D dir the dolly-back offset is applied ALONG.
  // Default (0,1) = legacy world +Z, kept bit-identical via the null branch.
  // Campaign passes the RAIL TANGENT (CAM-1 rail-parent invariant) - the D3a audit
  // measured the legacy fixed offset rotating 354 deg in the rail frame.
  if (backDir) { out.camX = p.x + back * backDir.x; out.camZ = p.y + back * backDir.y; }
  else { out.camX = p.x; out.camZ = p.y + back; }
  out.camY = h;
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
// I504 (ST-470): the look point drops cockpitLookDrop below the eye - a gentle down-pitch so the
// ship nose/canopy frame the bottom of the first-person view (the ship is visible in cockpit now).
/**
 * @param p   {x, y} ship position on the arena plane (world = (x, 0, y))
 * @param fwd {x, y} unit ship facing
 * @param cfg CONFIG.camera (needs cockpitHeight, cockpitSetback, cockpitLookFar)
 * @param out written in place (no alloc)
 */
export function cockpitTargets(p, fwd, cfg, out, spdFrac = 0) {
  const ahead = cfg.cockpitLookFar + cfg.cockpitLookSpeed * spdFrac; // ST-444 (I477): speed look-ahead (spdFrac 0 -> exactly cockpitLookFar, bit-identical to the legacy fixed 60)
  out.camX = p.x - fwd.x * cfg.cockpitSetback;
  out.camY = cfg.cockpitHeight;
  out.camZ = p.y - fwd.y * cfg.cockpitSetback;
  out.lookX = p.x + fwd.x * ahead;
  out.lookY = out.camY - (cfg.cockpitLookDrop || 0); // I504 (ST-470): gentle down-pitch (legacy 0 when the key is absent)
  out.lookZ = p.y + fwd.y * ahead;
  return out;
}

// I504 (ST-470): COCKPIT camera-relative thrust rotation. In the first-person seat the player
// only sees what is in front, so the on-screen thrust basis is the camera basis (screen-up =
// along the seat axis, screen-right = camera right), not the fixed chase basis (screen-up = sim -y).
// (tx, ty) = thrust in the screen basis; aim = ship aim angle (fwd = (cos aim, sin aim)).
// screen-up -> fwd = (cos a, sin a); screen-right -> (-sin a, cos a). Identity at the default
// aim -PI/2 (nose-up), so the legacy screen-basis convention is preserved where it already worked.
export function cockpitThrust(tx, ty, aim, out) {
  const sa = Math.sin(aim), ca = Math.cos(aim);
  out.x = -tx * sa - ty * ca;
  out.y = tx * ca - ty * sa;
  return out;
}

// ST-525 (I559, D3 C-1): the UNDAMPED cockpit aim direction. cockpitThrust must
// follow the pilot's INTENDED view direction, not the damped nose: while the view
// swings, world.ship.aim lags by ship.aimEase and the WASD basis rotates with the
// lag ("the controls don't match"). aimPoint (pointer raycast / touch) is the
// undamped intent; absent or coincident (dist <= ~0.001) -> damped-nose fallback
// (legacy, bit-identical). Pure: no ship mutation, no alloc.
export function cockpitAim(shipPos, aimPoint, fallbackAim) {
  if (aimPoint) {
    const dx = aimPoint.x - shipPos.x;
    const dy = aimPoint.y - shipPos.y;
    if (dx * dx + dy * dy > 1e-6) return Math.atan2(dy, dx);
  }
  return fallbackAim;
}

// ST-454 (E64, I487): flight-path camera adjustment (E62-preserving). `chase` = chaseTargets
// output ({camX,camY,camZ, lookX,lookY,lookZ}); `path` = pathPoint at the ship's distance;
// `pathAhead` = pathPoint frameDist ahead. (a) vertical LIFT of the whole rig by path.elev
// (cam.y += e, look world-up -> e): a pure translation, so the cam->ship and cam->look vectors
// (view angle + screen offset) are UNCHANGED - the E62 invariants hold, no rig rebuild.
// (b) framing: the look target is pulled toward pathAhead (x/z/elev) by cfg.frameFrac.
// outCam / outLook are written in place (no per-frame alloc).
export function flightPathCam(chase, path, pathAhead, cfg, outCam, outLook) {
  const e = path.elev || 0;
  outCam.x = chase.camX; outCam.y = chase.camY + e; outCam.z = chase.camZ;
  const frac = (cfg && cfg.frameFrac != null) ? (cfg.frameFrac < 0 ? 0 : cfg.frameFrac > 1 ? 1 : cfg.frameFrac) : 0;
  let lx = chase.lookX, ly = e, lz = chase.lookZ;
  if (frac > 0) {
    lx += (pathAhead.x - lx) * frac;
    ly += (pathAhead.elev - ly) * frac;
    lz += (pathAhead.y - lz) * frac;
  }
  outLook.x = lx; outLook.y = ly; outLook.z = lz;
  return { cam: outCam, look: outLook };
}

/**
 * ST-569 (I604, E87): shortest-arc exponential angular damping (pure; no DOM/three).
 * k = 1 - exp(-dt/tau): move a fixed fraction of the remaining (wrapped) angular error
 * per step, independent of frame rate. Identity when prev == target. Drives the endless
 * banded radial dolly held camera azimuth (caps the per-frame swing across
 * arena-center crossings; tau 0.25 s -> 12 deg/frame at 60 fps from a 180 deg flip).
 * @param prev held azimuth (rad)
 * @param target target azimuth (rad)
 * @param dt step (s)
 * @param tau time constant (s); must be > 0
 * @returns damped azimuth (rad)
 */
export function azimuthDamp(prev, target, dt, tau) {
  const k = 1 - Math.exp(-((dt > 0 ? dt : 0) / (tau > 0 ? tau : 1e-6)));
  let diff = target - prev;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  return prev + diff * k;
}

/**
 * ST-572 (I606, E87): G2 damped dolly DIRECTION (pure; no DOM/three; no per-frame alloc).
 * The held camera azimuth damps toward the ship's radial line while outside the band
 * (dist >= band) and toward the legacy +Z azimuth (PI/2) while inside it - ALWAYS, so a
 * crossing never re-applies a stale held azimuth in one frame (the I605 re-entry whip:
 * 169 deg ship-relative cam step + 27.8 u teleport at the S band re-entry). The radial
 * backDir applies while abs(wrap(a - PI/2)) >= deadband; inside the deadband
 * out.backDir = null = the exact legacy branch (chaseTargets' null path).
 * @param prevHeld held azimuth from the previous frame (rad)
 * @param targetAz ship radial azimuth Math.atan2(py, px) (rad); used only when dist >= band
 * @param dist ship distance from the arena center
 * @param band band distance (CONFIG.camera.dolly.band * CONFIG.arena.radius)
 * @param dt step (s)
 * @param tau azimuthDamp time constant (s)
 * @param deadband deadband (rad), CONFIG.camera.dolly.azDeadband
 * @param out { a, backDir, bd } - out.a = new held azimuth (always written); out.backDir =
 *        out.bd (the caller's persistent {x,y}, written in place) when the radial dolly
 *        applies, else null; out.bd is never reallocated.
 */
export function radialDollyDir(prevHeld, targetAz, dist, band, dt, tau, deadband, out) {
  const a = azimuthDamp(prevHeld, dist >= band ? targetAz : Math.PI / 2, dt, tau);
  let diff = a - Math.PI / 2;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  out.a = a;
  if (Math.abs(diff) >= deadband) {
    out.bd.x = Math.cos(a);
    out.bd.y = Math.sin(a);
    out.backDir = out.bd;
  } else {
    out.backDir = null;
  }
  return out;
}
