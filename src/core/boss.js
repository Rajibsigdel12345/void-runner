// ST-055: the Monolith boss. DOM-free, three-free.
// A single slow-homing entity. Pure state: step() reports a ring burst, hit()
// reports a kill - World owns the spawned rocks/score so this stays testable.
import { v2, v2Len } from './math.js';

export class Monolith {
  constructor(rng, cfg, pos) {
    this.rng = rng;
    this.cfg = cfg;
    this.pos = pos;
    const b = cfg.boss;
    this.hp = b.maxHp;
    this.maxHp = b.maxHp;
    this.radius = b.radius;
    this.alive = true;
    this.ringTimer = b.ringEvery; // first burst after one full interval
    this.rot = this.rng.next() * Math.PI * 2;
  }

  get hpFrac() { return this.alive ? this.hp / this.maxHp : 0; }

  /**
   * Advance: slow bounded homing toward the ship (mines math, lower rates) and
   * the ring-burst timer. Returns 'ring' on the frame a burst fires, else null.
   */
  step(dt, shipPos) {
    const b = this.cfg.boss;
    const speed = b.speed;
    const cur = this._heading();
    const tgt = Math.atan2(shipPos.y - this.pos.y, shipPos.x - this.pos.x);
    let diff = tgt - cur;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const maxTurn = b.turn * dt;
    const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
    this._vel = v2(Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.pos.x += this._vel.x * dt;
    this.pos.y += this._vel.y * dt;
    this.rot += dt * 0.3;
    // arena clamp (keep the boss inside the rim)
    const R = this.cfg.arena.radius - this.radius;
    const d = v2Len(this.pos) || 1;
    if (d > R) { this.pos.x *= R / d; this.pos.y *= R / d; }
    this.ringTimer -= dt;
    if (this.ringTimer <= 0) { this.ringTimer += b.ringEvery; return 'ring'; }
    return null;
  }

  _heading() {
    if (!this._vel) return Math.atan2(-this.pos.y, -this.pos.x);
    return Math.atan2(this._vel.y, this._vel.x);
  }

  /** Apply one bullet hit (1 damage). Returns true when this hit kills it. */
  hit() {
    if (!this.alive) return false;
    this.hp -= 1;
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }
}
