// ST-136: the WARDEN - an armored drone mini-boss. DOM-free, three-free.
// Spawns on 5th waves where the Monolith did not (a previous Monolith is
// still alive): that wave's heavyweight is this drone instead. Armor
// absorbs the first N hits (no HP loss - just a ping), then bullets chip HP.
// Slow bounded homing like the Monolith, but faster and smaller.
import { v2, v2Len } from './math.js';

export class Warden {
  constructor(rng, cfg, pos, hp) {
    this.rng = rng;
    this.cfg = cfg;
    this.pos = pos;
    const w = cfg.warden;
    this.hp = this.maxHp = (typeof hp === 'number' && hp > 0) ? hp : w.hp;
    this.armor = this.maxArmor = w.armor; // ST-136: absorbs hits before HP loss
    this.radius = w.radius;
    this.alive = true;
    this.rot = this.rng.next() * Math.PI * 2;
  }

  /** Apply one bullet hit (1 damage): armor first, then HP.
   *  Returns { absorbed, killed } - absorbed when the armor ate the hit. */
  hit() {
    if (!this.alive) return { absorbed: false, killed: false };
    if (this.armor > 0) { this.armor -= 1; return { absorbed: true, killed: false }; }
    this.hp -= 1;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; return { absorbed: false, killed: true }; }
    return { absorbed: false, killed: false };
  }

  /** Advance: slow bounded homing toward the ship (Monolith pattern, faster). */
  step(dt, shipPos) {
    const w = this.cfg.warden;
    const cur = this._heading();
    const tgt = Math.atan2(shipPos.y - this.pos.y, shipPos.x - this.pos.x);
    let diff = tgt - cur;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const maxTurn = w.turn * dt;
    const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
    this._vel = v2(Math.cos(ang) * w.speed, Math.sin(ang) * w.speed);
    this.pos.x += this._vel.x * dt;
    this.pos.y += this._vel.y * dt;
    this.rot += dt * w.spin;
    // arena clamp (keep the warden inside the rim)
    const R = this.cfg.arena.radius - this.radius;
    const d = v2Len(this.pos) || 1;
    if (d > R) { this.pos.x *= R / d; this.pos.y *= R / d; }
  }

  _heading() {
    if (!this._vel) return Math.atan2(-this.pos.y, -this.pos.x);
    return Math.atan2(this._vel.y, this._vel.x);
  }
}
