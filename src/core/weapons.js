// Void Runner - weapons core (ST-007). DOM-free, three-free.
import { CONFIG } from './config.js';
import { v2 } from './math.js';

export class Weapons {
  constructor(cfg = CONFIG) {
    this.cfg = cfg;
    this.bullets = []; // { id, pos, vel, life, radius, dead }
    this.cooldown = 0;
    this.nextId = 1;
  }

  /** Single shot in a direction (rad). Returns bullet or null (on cooldown / at cap). */
  fire(pos, angle, rateMul = 1) {
    const w = this.cfg.weapon;
    if (this.cooldown > 0 || this.bullets.length >= w.maxBullets) return null;
    this.cooldown = w.fireInterval / Math.max(0.0001, rateMul);
    return this._spawn(pos, angle);
  }

  /**
   * Multi-shot (spread power-up). `count` bullets across `arc` total radians.
   * Consumes one cooldown cycle for the whole burst.
   */
  fireSpread(pos, angle, count = 1, arc = 0, rateMul = 1) {
    const w = this.cfg.weapon;
    if (this.cooldown > 0) return [];
    const fired = [];
    const room = w.maxBullets - this.bullets.length;
    const n = Math.min(count, room);
    if (n <= 0) return fired;
    this.cooldown = w.fireInterval / Math.max(0.0001, rateMul);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1..1 across the arc
      const b = this._spawn(pos, angle + t * arc);
      if (b) fired.push(b);
    }
    return fired;
  }

  _spawn(pos, angle) {
    const w = this.cfg.weapon;
    const b = {
      id: this.nextId++,
      pos: v2(pos.x, pos.y),
      vel: v2(Math.cos(angle) * w.bulletSpeed, Math.sin(angle) * w.bulletSpeed),
      life: w.bulletLife,
      radius: w.bulletRadius,
      dead: false,
    };
    this.bullets.push(b);
    return b;
  }

  /** Step bullets; while `homing` (MAGNET) is on, each bullet gently steers toward the
   * nearest rock within homing.range (max turn homing.turn rad/s, speed preserved). */
  step(dt, homing = false, rocks = null) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const h = !!(homing && rocks && rocks.length);
    const hw = h ? this.cfg.weapon.homing : null;
    const rangeSq = h ? hw.range * hw.range : 0;
    for (const b of this.bullets) {
      if (b.dead) continue;
      if (h) {
        let bx = 0, by = 0, best = null, bestD2 = rangeSq;
        for (const r of rocks) {
          if (r.dead) continue;
          const dx = r.pos.x - b.pos.x, dy = r.pos.y - b.pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) { bestD2 = d2; best = r; bx = r.pos.x; by = r.pos.y; }
        }
        if (best) {
          const sp = Math.hypot(b.vel.x, b.vel.y) || 1;
          let cur = Math.atan2(b.vel.y, b.vel.x);
          const tgt = Math.atan2(by - b.pos.y, bx - b.pos.x);
          let diff = tgt - cur;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          const maxTurn = hw.turn * dt;
          cur += diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff;
          b.vel.x = Math.cos(cur) * sp;
          b.vel.y = Math.sin(cur) * sp;
        }
      }
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.life -= dt;
      if (b.life <= 0) b.dead = true;
    }
    if (this.bullets.some(b => b.dead)) this.compact();
  }

  compact() {
    let w = 0;
    for (let i = 0; i < this.bullets.length; i++) {
      if (!this.bullets[i].dead) this.bullets[w++] = this.bullets[i];
    }
    this.bullets.length = w;
  }

  markHit(id) {
    const b = this.bullets.find(x => x.id === id && !x.dead);
    if (b) b.dead = true;
  }

  clear() { this.bullets.length = 0; this.cooldown = 0; this.nextId = 1; } // I190: fresh ID space per run
  get count() { return this.bullets.length; }
}
