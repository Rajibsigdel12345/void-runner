// ST-055: the Monolith boss. DOM-free, three-free.
// A single slow-homing entity. Pure state: step() reports a ring burst, hit()
// reports a kill - World owns the spawned rocks/score so this stays testable.
import { v2, v2Len } from './math.js';

/** ST-134: radial burst geometry - pure, no rng, no DOM. `count` unit directions evenly
 * around the circle, rotated by `offset`; each vector already scaled to burst speed.
 * Exported so World and tests share one source of truth for the volley layout. */
export function bossBurstVectors(cfg, offset) {
  const b = cfg.boss.burst;
  const out = [];
  for (let i = 0; i < b.count; i++) {
    const a = offset + (i / b.count) * Math.PI * 2;
    out.push({ x: Math.cos(a) * b.speed, y: Math.sin(a) * b.speed });
  }
  return out;
}

/** ST-064: Monolith HP by wave - base for the campaign loop, climbing per boss from the
 * endless-curve wave, capped so the fight always stays beatable. Pure + deterministic. */
export function bossHpForWave(cfg, wave) {
  const b = cfg.boss;
  if (!b.hpFirstWave || wave < b.hpFirstWave) return b.maxHp;
  const steps = Math.floor((wave - b.hpFirstWave) / b.everyWave);
  return Math.min(b.hpCap, b.maxHp + Math.max(0, steps) * b.hpStep);
}

export class Monolith {
  constructor(rng, cfg, pos, hp) {
    this.rng = rng;
    this.cfg = cfg;
    this.pos = pos;
    const b = cfg.boss;
    this.hp = this.maxHp = (typeof hp === 'number' && hp > 0) ? hp : b.maxHp; // ST-064: scaled by wave
    this.radius = b.radius;
    this.alive = true;
    this.hitFlash = 0; // ST-385/E51: render juice - 1 on an HP hit, decays in step()
    this.ringTimer = b.ringEvery; // first burst after one full interval
    this.rot = this.rng.next() * Math.PI * 2;
    this.phase = 1; // ST-133: 1 normal, 2 enrage (one-way)
    this.kind = 'monolith'; // ST-143: variant tag (render + World.bossDeath)
    this.score = b.score; // ST-143: headline kill score (World.bossDeath reads it)
    this.splitCount = b.splitCount;
    this.splitSize = 'M';
    this.entered = 0; // ST-135: entrance progress 0..1 (attacks gate on it)
  }

  get hpFrac() { return this.alive ? this.hp / this.maxHp : 0; }

  /**
   * Advance: slow bounded homing toward the ship (mines math, lower rates) and
   * the ring-burst timer. Returns 'ring' on the frame a burst fires, else null.
   */
  step(dt, shipPos) {
    const b = this.cfg.boss;
    this.hitFlash = Math.max(0, this.hitFlash - this.cfg.fx.enemyHitFlash.decay * dt); // ST-385/E51
    const p2 = this.phase === 2 ? b.phase2 : null; // ST-133: enrage multipliers
    this.entered = Math.min(1, this.entered + dt / b.enterTime); // ST-135: entrance progress
    const speed = b.speed * (p2 ? p2.speedMult : 1);
    const cur = this._heading();
    const tgt = Math.atan2(shipPos.y - this.pos.y, shipPos.x - this.pos.x);
    let diff = tgt - cur;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const maxTurn = b.turn * (p2 ? p2.turnMult : 1) * dt;
    const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
    this._vel = v2(Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.pos.x += this._vel.x * dt;
    this.pos.y += this._vel.y * dt;
    this.rot += dt * (p2 ? p2.spin : 0.3);
    // arena clamp (keep the boss inside the rim)
    const R = this.cfg.arena.radius - this.radius;
    const d = v2Len(this.pos) || 1;
    if (d > R) { this.pos.x *= R / d; this.pos.y *= R / d; }
    if (this.entered >= 1) { // ST-135: the ring begins once the entrance finishes (timer held until then)
      this.ringTimer -= dt;
      if (this.ringTimer <= 0) { this.ringTimer += b.ringEvery * (p2 ? p2.ringEveryMult : 1); return 'ring'; }
    }
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
    this.hitFlash = 1; // ST-385/E51: every HP hit (incl. the killing hit) -> white flash
    if (this.hp <= 0) { this.alive = false; return true; }
    const p2 = this.cfg.boss.phase2; // ST-133: one-way enrage below the threshold
    if (this.phase === 1 && p2 && this.hp / this.maxHp < p2.hpFrac) this.phase = 2;
    return false;
  }
}
