// ST-444 (I477): cockpit bearing math (pure, DOM-free, unit-tested).
// Arena space: (x, z) on the arena plane (the game's 2D sim axes); bearings via atan2(z, x).

/** Wrap an angle to (-PI, PI]. */
export function wrapPi(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Relative bearing (radians, (-PI, PI]) from the ship's heading to the arena target point.
 * +rel = target to the ship's LEFT (arena CCW from the heading).
 */
export function relBearing(shipX, shipZ, fwdX, fwdZ, targetX, targetZ) {
  const h = Math.atan2(fwdZ, fwdX);
  const a = Math.atan2(targetZ - shipZ, targetX - shipX);
  return wrapPi(a - h);
}

/**
 * Nearest arena-rim point from the ship (rim = circle of radius arenaR centered at the origin).
 * Writes {x, y, ok} to out; ok=false within minDist of the center (the nearest rim is undefined there).
 */
export function nearestRim(shipX, shipZ, arenaR, out, minDist = 0.5) {
  const d = Math.hypot(shipX, shipZ);
  if (d < minDist) { out.x = 0; out.y = 0; out.ok = false; return out; }
  out.x = (shipX / d) * arenaR;
  out.y = (shipZ / d) * arenaR;
  out.ok = true;
  return out;
}

/** True when the arena center is a meaningful bearing target (ship at least minDist away from it). */
export function centerVisible(shipX, shipZ, minDist = 0.5) {
  return Math.hypot(shipX, shipZ) >= minDist;
}
