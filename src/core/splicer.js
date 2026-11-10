// ST-143: the Splicer - boss variant 2. DOM-free, three-free.
// Alternate pattern to the Monolith: it holds a slow orbit around the arena
// center and emits a continuous two-arm spiral of undestroyable bolts (a
// "spinning sun" the ship weaves through), plus a slow aimed bolt. No rock
// rings, no radial burst. Enrages below the HP threshold (one-way).
// World owns the spawned bolts/score so this stays unit-testable.

/** ST-143: Splicer HP by wave - mirrors the Monolith's endless-arc HP curve,
 * scaled from the Splicer's own base/cap over the boss cadence. Pure + deterministic. */
export function splicerHpForWave(cfg, wave) {
  const s = cfg.splicer;
  if (!s.hpFirstWave || wave < s.hpFirstWave) return s.maxHp;
  const steps = Math.floor((wave - s.hpFirstWave) / cfg.boss.everyWave);
  return Math.min(s.hpCap, s.maxHp + Math.max(0, steps) * s.hpStep);
}

export class Splicer {
  constructor(rng, cfg, pos, hp) {
    this.rng = rng;
    this.cfg = cfg;
    this.pos = pos;
    const s = cfg.splicer;
    this.hp = this.maxHp = (typeof hp === 'number' && hp > 0) ? hp : s.maxHp;
    this.radius = s.radius;
    this.alive = true;
    this.phase = 1; // 1 normal, 2 enrage (one-way)
    this.entered = 0; // entrance progress 0..1 (bolts gate on it)
    this.kind = 'splicer';
    this.score = s.score; // headline kill score (World.bossDeath reads it)
    this.splitCount = s.splitCount;
    this.splitSize = s.splitSize;
    this.rot = rng.next() * Math.PI * 2;
    this.spawnR = Math.hypot(pos.x, pos.y) || s.holdRadius; // ST-143: spawn radius - glides to the hold radius
    this.orbitR = this.spawnR;
    this.orbitA = Math.atan2(pos.y, pos.x);
    this.orbitDir = rng.chance(0.5) ? 1 : -1;
    this.arm = rng.next() * Math.PI * 2;
    this.spiralTimer = s.spiralEvery;
    this._pending = [];
  }

  get hpFrac() { return this.alive ? this.hp / this.maxHp : 0; }

  /** Advance: slow orbit around the arena center + the spiral-arm timer.
   * Queues undestroyable bolt directions (drained by World via drainBolts()). */
  step(dt) {
    const s = this.cfg.splicer;
    const p2 = this.phase === 2 ? s.phase2 : null;
    this.entered = Math.min(1, this.entered + dt / s.enterTime);
    const r = this.spawnR + (s.holdRadius - this.spawnR) * this.entered; // ST-143: glide spawn -> hold over the entrance (no teleport)
    this.orbitR = r;
    this.orbitA += this.orbitDir * s.orbitSpeed * (p2 ? p2.orbitSpeedMult : 1) * dt;
    this.pos.x = Math.cos(this.orbitA) * r;
    this.pos.y = Math.sin(this.orbitA) * r;
    this.rot += dt * (p2 ? p2.spin : s.spin);
    if (this.entered >= 1) {
      this.arm += s.armSpin * (p2 ? p2.armSpinMult : 1) * dt;
      this.spiralTimer -= dt;
      if (this.spiralTimer <= 0) {
        this.spiralTimer += s.spiralEvery * (p2 ? p2.spiralEveryMult : 1);
        for (let i = 0; i < s.arms; i++) {
          const a = this.arm + (i / s.arms) * Math.PI * 2;
          this._pending.push({ x: Math.cos(a), y: Math.sin(a) });
        }
      }
    }
    return null;
  }

  /** Undestroyable bolt unit-directions queued since the last drain (or null). */
  drainBolts() {
    if (!this._pending.length) return null;
    const out = this._pending;
    this._pending = [];
    return out;
  }

  /** One bullet hit (1 damage). Returns true when the hit kills it. */
  hit() {
    if (!this.alive) return false;
    this.hp -= 1;
    if (this.hp <= 0) { this.alive = false; return true; }
    const p2 = this.cfg.splicer.phase2;
    if (this.phase === 1 && p2 && this.hp / this.maxHp < p2.hpFrac) this.phase = 2;
    return false;
  }
}
