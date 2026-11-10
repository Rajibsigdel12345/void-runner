// ST-117: homing drones - fast seekers that wobble around the line to the ship.
// DOM-free, three-free. 1 bullet kills one; touching the ship costs a life. No
// bolts (chasers, not shooters). Determinism: spawn bearing, initial wobble phase
// and per-drone phase advance all flow through the world RNG, so seeded replays match.
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

export class DroneField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.drones = [];
    this.nextId = 1;
  }

  /** Spawn a drone at the arena rim (away from the ship when a position is given). */
  spawn(shipPos = null) {
    const d = this.cfg.drone;
    if (this.drones.length >= d.maxConcurrent) return null;
    const r = this.cfg.arena.radius - d.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 6 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < 10; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const homeAng = Math.atan2(-pos.y, -pos.x) + this.rng.range(-0.4, 0.4);
    this.drones.push({
      id: this.nextId++,
      pos,
      vel: v2(Math.cos(homeAng) * d.speed, Math.sin(homeAng) * d.speed),
      radius: d.radius,
      wobblePhase: this.rng.next() * Math.PI * 2, // per-drone wobble phase (deterministic)
      rot: this.rng.next() * Math.PI * 2,
      dead: false,
    });
    return this.drones[this.drones.length - 1];
  }

  /**
   * Advance all drones: constant speed; heading eases toward the ship plus a
   * sinusoidal wobble around the direct line (seek + strafe). Rim reflection like mines.
   */
  step(dt, shipPos) {
    const d = this.cfg.drone;
    const R = this.cfg.arena.radius;
    for (const dr of this.drones) {
      if (dr.dead) continue;
      const sp = v2Len(dr.vel) || d.speed;
      const cur = Math.atan2(dr.vel.y, dr.vel.x);
      dr.wobblePhase += d.wobbleFreq * dt;
      const base = Math.atan2(shipPos.y - dr.pos.y, shipPos.x - dr.pos.x);
      const tgt = base + Math.sin(dr.wobblePhase) * d.wobbleAmp;
      let diff = tgt - cur;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const maxTurn = d.turn * dt;
      const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
      dr.vel.x = Math.cos(ang) * sp;
      dr.vel.y = Math.sin(ang) * sp;
      dr.pos.x += dr.vel.x * dt;
      dr.pos.y += dr.vel.y * dt;
      dr.rot += dt * 2.0;
      // rim reflection (same rule as mines)
      const dist = v2Len(dr.pos) + dr.radius;
      if (dist > R) {
        const inv = 1 / (dist || 1);
        const nx = dr.pos.x * inv, ny = dr.pos.y * inv;
        const dot = dr.vel.x * nx + dr.vel.y * ny;
        if (dot > 0) {
          dr.vel.x -= 2 * dot * nx;
          dr.vel.y -= 2 * dot * ny;
        }
        const push = dist - R;
        dr.pos.x -= nx * push;
        dr.pos.y -= ny * push;
      }
    }
    this.compact();
  }

  /** Destroy a drone by id. Returns the drone or null. */
  destroy(id) {
    const dr = this.drones.find(x => x.id === id && !x.dead);
    if (!dr) return null;
    dr.dead = true;
    this.compact();
    return dr;
  }

  compact() {
    let w = 0;
    for (let i = 0; i < this.drones.length; i++) {
      if (!this.drones[i].dead) this.drones[w++] = this.drones[i];
    }
    this.drones.length = w;
  }

  get count() { return this.drones.length; }
  clear() { this.drones.length = 0; }
}
