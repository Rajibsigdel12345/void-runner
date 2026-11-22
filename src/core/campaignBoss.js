// ST-456 (E64, I489): the campaign end-of-level BOSS. Pure core - no three, no DOM.
// A drop-in speaking the Monolith interface (pos/hp/hpFrac/entered/hitFlash/kind/
// radius/score/splitCount/splitSize/spawnWave) so the endless path + render stay
// bit-identical; the NEW campaign behavior is gated behind `isCampaignBoss`.
//
// Headline mechanic: a glowing WEAK POINT that cycles closed (armored - bullets
// clang, 0 dmg) -> telegraph (glow rises, still armored) -> open (vulnerable, full
// dmg). Move sets reuse existing enemy projectiles (aimed bolt + rock ring), distinct
// per phase. L1 = full 3-phase with a posture/scale change at each transition; L2/L3
// = single phase. Derives from boss.glb (per-level retint + posture scale = 0 new
// tris, no new asset) - see src/render/bossMesh.js.
import { v2, v2Len } from './math.js';
import { teleProgress } from './bossTelegraph.js';

export class CampaignBoss {
  constructor(rng, cfg, pos, level, tint) {
    this.rng = rng;
    this.cfg = cfg;
    this.pos = pos;
    const cb = cfg.campaignBoss;
    this.level = level;
    this.tint = tint; // 'monolith' | 'splicer' | 'prime' | 'abyssal' | 'archon' (ST-519 E75; ST-486 E69)
    this.kind = (tint === 'splicer') ? 'splicer' : 'monolith'; // canonical kind -> reuses the Monolith render color/rim
    this.prime = (tint === 'prime');                            // L3 gold identity (kind stays monolith)
    this.abyssal = (tint === 'abyssal');                    // ST-486 (E69): L4 "Necro Reef" final boss (kind stays monolith)
    this.archon = (tint === 'archon');                        // ST-519 (E75): L5 "Zenith Spire" final boss (kind stays monolith)
    this._spawnParity = 0;                                  // ST-486: deterministic spawn alternation (no RNG draw)
    this._spawnTimer = this.abyssal ? cb.abyssal.spawnFirst : -1;
    this.isCampaignBoss = true;                                 // gates every NEW campaign behavior
    this.hp = this.maxHp = (cb.hp[level] != null) ? cb.hp[level] : 96;
    this.radius = cb.radius;
    this.alive = true;
    this.hitFlash = 0;
    this.entered = 0;                                           // entrance progress 0..1
    this.phaseCount = (cb.phases[level] != null) ? cb.phases[level] : 1;
    this.phaseIndex = 0;                                        // 0-based
    this.postureScale = (cb.posture && cb.posture[0]) || 1;
    this.rot = rng.next() * Math.PI * 2;
    this.score = (cb.score[level] != null) ? cb.score[level] : 1000;
    this.splitCount = cb.splitCount;
    this.splitSize = cb.splitSize || 'M';
    this.spawnWave = 0; // level-boss tag (the campaign hook reads levelState)
    // weak point (front of the body, orbits with the heading toward the ship)
    const w = cb.weak;
    this.weak = { x: 0, y: 0, r: w.r, state: 'closed', open: false, tele: 0 };
    this._weakTimer = w.armTime;
    // move-set timers (aimed bolt + rock ring), seeded from the STARTING tier
    // (L1 starts phase 0; L2/L3 single-phase start at singlePhaseMoveTier)
    const moves = this.archon ? cb.archon.moves : cb.moves; // ST-519 (E75): archon cadence
    const t0 = Math.min(this._moveTier(), moves.aimEvery.length - 1);
    this._aimTimer = moves.aimEvery[t0];
    this._ringTimer = moves.ringEvery[t0];
    this.teleAim = this._aimTimer; // seconds to next aimed bolt (render telegraph)
    this.teleRing = (moves.ringEvery[t0] < 90) ? this._ringTimer : -1;
    this._updateWeak(0);
  }

  get hpFrac() { return this.alive ? this.hp / this.maxHp : 0; }

  _heading() {
    if (!this._vel) return Math.atan2(-this.pos.y, -this.pos.x);
    return Math.atan2(this._vel.y, this._vel.x);
  }

  _moveTier() {
    if (this.archon) return Math.min(this.phaseIndex, this.cfg.campaignBoss.archon.moves.aimEvery.length - 1); // ST-519 (E75): archon tier cadence
    if (this.phaseCount > 1) return this.phaseIndex;
    const t = this.cfg.campaignBoss.singlePhaseMoveTier;
    return (t != null) ? t : 1;
  }

  _phaseForHpFrac() {
    const at = this.cfg.campaignBoss.phaseAt; // e.g. [1.0, 0.66, 0.33]
    const f = this.hpFrac;
    if (at && at.length >= 3) {
      if (f >= at[1]) return 0;
      if (f >= at[2]) return 1;
      return 2;
    }
    return 0;
  }

  _updateWeak(dt) {
    const w = this.cfg.campaignBoss.weak;
    this._weakTimer -= dt;
    if (this._weakTimer <= 0) {
      if (this.weak.state === 'closed') { this.weak.state = 'tele'; this._weakTimer = w.teleTime; }
      else if (this.weak.state === 'tele') { this.weak.state = 'open'; this._weakTimer = w.openTime; }
      else { this.weak.state = 'closed'; this._weakTimer = w.armTime; }
    }
    const h = this._heading();
    this.weak.x = this.pos.x + Math.cos(h) * w.orbitR;
    this.weak.y = this.pos.y + Math.sin(h) * w.orbitR;
    this.weak.r = w.r;
    this.weak.open = (this.weak.state === 'open');
    this.weak.tele = (this.weak.state === 'open') ? 1
      : (this.weak.state === 'tele') ? teleProgress(this._weakTimer, w.teleTime)
      : 0;
  }

  _rearmWeak() {
    const w = this.cfg.campaignBoss.weak;
    this.weak.state = 'closed';
    this.weak.open = false;
    this.weak.tele = 0;
    this._weakTimer = w.armTime;
  }

  /**
   * Advance: bounded homing (per-phase speed/turn) + weak-point cycle + one-way
   * phase progression + move-set timers. Returns an event object
   * { aim, ring, phase, phaseIndex } (0/1 flags) so World routes to the existing
   * projectile spawners; the endless boss keeps its 'ring'|null return.
   */
  step(dt, shipPos) {
    const cb = this.cfg.campaignBoss;
    const moves = this.archon ? cb.archon.moves : cb.moves; // ST-519 (E75): archon cadence (P0 aimed-only, ringEvery 99)
    this.hitFlash = Math.max(0, this.hitFlash - this.cfg.fx.enemyHitFlash.decay * dt);
    this.entered = Math.min(1, this.entered + dt / cb.enterTime);
    const enraged = (this.phaseCount > 1 && this.phaseIndex >= 2);
    const speed = cb.speed * (enraged ? 1.3 : 1);
    const cur = this._heading();
    const tgt = Math.atan2(shipPos.y - this.pos.y, shipPos.x - this.pos.x);
    let diff = tgt - cur;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const maxTurn = cb.turn * (enraged ? 1.3 : 1) * dt;
    const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
    this._vel = v2(Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.pos.x += this._vel.x * dt;
    this.pos.y += this._vel.y * dt;
    this.rot += dt * (enraged ? 0.9 : 0.3);
    // arena clamp (keep the boss inside the rim)
    const R = this.cfg.arena.radius - this.radius;
    const d = v2Len(this.pos) || 1;
    if (d > R) { this.pos.x *= R / d; this.pos.y *= R / d; }
    this._updateWeak(dt);
    // one-way phase progression (L1 only), with posture change + weak re-arm
    let phase = 0;
    if (this.phaseCount > 1) {
      const np = Math.min(this.phaseCount - 1, this._phaseForHpFrac());
      if (np > this.phaseIndex) {
        this.phaseIndex = np;
        const posture = cb.posture;
        this.postureScale = (posture && posture[np]) || this.postureScale;
        this._rearmWeak();
        phase = 1;
        if (this.archon && this._spawnTimer < 0) this._spawnTimer = cb.archon.spawnFirst; // ST-519 (E75): archon summons arm at the P1 "HALO" transition
      }
    }
    // move set (gated on entrance)
    let aim = 0, ring = 0;
    if (this.entered >= 1) {
      const tier = Math.min(this._moveTier(), moves.aimEvery.length - 1); // ST-519 (E75): archon-aware cadence
      const aimEvery = moves.aimEvery[tier];
      const ringEvery = moves.ringEvery[tier];
      this._aimTimer -= dt;
      this._ringTimer -= dt;
      if (this._aimTimer <= 0) { this._aimTimer += aimEvery; aim = 1; }
      if (ringEvery < 90 && this._ringTimer <= 0) { this._ringTimer += ringEvery; ring = 1; }
    }
    const rtier = Math.min(this._moveTier(), moves.ringEvery.length - 1); // ST-519 (E75): archon-aware cadence
    this.teleAim = this._aimTimer;
    this.teleRing = (moves.ringEvery[rtier] < 90) ? this._ringTimer : -1;
    let spawn = 0;
    if ((this.abyssal || (this.archon && this.phaseIndex >= 1)) && this.entered >= 1 && this._spawnTimer >= 0) { // ST-486 (E69): summon reinforcements at the rim (field maxConcurrent self-caps); ST-519 (E75): archon summons arm at P1
      this._spawnTimer -= dt;
      if (this._spawnTimer <= 0) {
        this._spawnTimer += this.archon ? cb.archon.spawnEvery : this.cfg.campaignBoss.abyssal.spawnEvery; // ST-519 (E75): archon cadence
        this._spawnParity ^= 1;
        spawn = (this._spawnParity === 1) ? 'phantom' : 'bulwark'; // phantom first (weaker), then bulwark, alternating
      }
    }
    return { aim, ring, phase, phaseIndex: this.phaseIndex, spawn };
  }

  /** Apply one weak-point hit (1 damage). Returns true when this hit kills it.
   * The armored/closed gating lives in World.resolveBulletBoss (hit() is only
   * called while weak.open), so this is a plain HP hit. */
  hit() {
    if (!this.alive) return false;
    this.hp -= 1;
    this.hitFlash = 1;
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }
}
