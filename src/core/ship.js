// Void Runner - ship simulation core (ST-005). DOM-free, three-free.
import { v2, v2Len, dampAngle, angDiff } from './math.js';
import { CONFIG } from './config.js';

export class Ship {
  constructor(x = 0, y = 0, cfg = CONFIG) {
    this.cfg = cfg;
    this.pos = v2(x, y);
    this.vel = v2(0, 0);
    this.aim = -Math.PI / 2; // default nose-up
    this.invuln = 0;
  }

  /**
   * Advance simulation.
   * @param {number} dt seconds
   * @param {{x:number,y:number}} thrust input vector, |thrust| <= 1
   * @param {{x:number,y:number}|null} aimPoint world point the nose eases toward
   */
  step(dt, thrust = v2(), aimPoint = null) {
    const c = this.cfg.ship;
    this.vel.x += thrust.x * c.accel * dt;
    this.vel.y += thrust.y * c.accel * dt;
    const k = Math.exp(-c.damping * dt);
    this.vel.x *= k;
    this.vel.y *= k;
    const sp = v2Len(this.vel);
    if (sp > c.maxSpeed) {
      const s = c.maxSpeed / sp;
      this.vel.x *= s;
      this.vel.y *= s;
    }
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    const r = this.cfg.arena.radius - c.radius;
    const d = v2Len(this.pos);
    if (d > r) {
      const inv = 1 / d;
      this.pos.x *= r * inv;
      this.pos.y *= r * inv;
      this.vel.x *= 0.6;
      this.vel.y *= 0.6;
    }

    if (aimPoint) {
      const target = Math.atan2(aimPoint.y - this.pos.y, aimPoint.x - this.pos.x);
      this.aim = dampAngle(this.aim, target, c.aimEase, dt);
    }
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    return this;
  }

  forward(out = v2()) {
    out.x = Math.cos(this.aim);
    out.y = Math.sin(this.aim);
    return out;
  }

  get speed() { return v2Len(this.vel); }
  get isInvulnerable() { return this.invuln > 0; }

  /** Apply knockback impulse away from hit and grant invulnerability. Returns knock angle for fx. */
  damage(knockDir) {
    const c = this.cfg.ship;
    this.vel.x += knockDir.x * c.knockback;
    this.vel.y += knockDir.y * c.knockback;
    this.invuln = c.invulnTime;
    return Math.atan2(knockDir.y, knockDir.x);
  }

  aimError(targetAngle) { return angDiff(this.aim, targetAngle); }
}
