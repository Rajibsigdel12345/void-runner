// Void Runner - collision helpers (ST-011). Pure functions, DOM-free.
import { v2Dist } from './math.js';

/** Circle vs circle. Touching counts as a hit (arcade forgiveness). */
export function circlesHit(ax, ay, ar, bx, by, br) {
  const d = v2Dist({ x: ax, y: ay }, { x: bx, y: by });
  return d <= ar + br;
}

/**
 * First rock hit by a bullet, or null.
 * @returns {number|null} rock id
 */
export function bulletHitRock(bx, by, br, rocks) {
  for (const r of rocks) {
    if (r.dead) continue;
    if (circlesHit(bx, by, br, r.pos.x, r.pos.y, r.radius)) return r.id;
  }
  return null;
}

/**
 * First rock hit by the ship, or null.
 * @returns {{id:number, nx:number, ny:number}|null} hit + normalized knock direction (rock -> ship)
 */
export function shipHitRock(sx, sy, sr, rocks) {
  for (const r of rocks) {
    if (r.dead) continue;
    if (circlesHit(sx, sy, sr, r.pos.x, r.pos.y, r.radius)) {
      let dx = sx - r.pos.x, dy = sy - r.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      return { id: r.id, nx: dx / d, ny: dy / d };
    }
  }
  return null;
}
