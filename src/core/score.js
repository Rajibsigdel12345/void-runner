// Void Runner - score + combo (ST-013). Pure core.
import { CONFIG } from './config.js';

export class ScoreKeeper {
  constructor(cfg = CONFIG) {
    this.cfg = cfg;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.shotsFired = 0; // I152: accuracy denominator
    this.shotsHit = 0; // I152: accuracy numerator
    this.lastKillTime = -Infinity;
    this.overdriveMult = 1; // ST-057: World sets this to the OVERDRIVE mult while active
  }

  get multiplier() {
    if (this.combo <= 1) return 1;
    return 1 + this.cfg.combo.step * (Math.min(this.combo, this.cfg.combo.cap) - 1);
  }

  // I111: discrete multiplier tier (0 = no chain, 1..tierCount) for HUD level-up pops.
  get tier() {
    const cap = this.cfg.combo.cap;
    const tiers = this.cfg.combo.tierCount;
    if (this.combo <= 1) return 0;
    const width = (cap - 1) / tiers;
    const t = Math.floor((this.combo - 1) / width);
    return Math.min(tiers, t + 1);
  }

  // I111: fraction of the combo window still alive at sim time t (1 = just killed, 0 = expired).
  heatAt(t) {
    if (this.combo <= 0) return 0;
    const f = 1 - (t - this.lastKillTime) / this.cfg.combo.window;
    return Math.max(0, Math.min(1, f));
  }

  /** Award a kill at sim time t. Returns points actually added (base * combo multiplier * overdrive, floored). */
  kill(base, t) {
    if (t - this.lastKillTime > this.cfg.combo.window) this.combo = 0;
    this.combo = Math.min(this.combo + 1, this.cfg.combo.cap);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.kills++;
    this.lastKillTime = t;
    const pts = Math.floor(base * this.multiplier * this.overdriveMult);
    this.score += pts;
    return pts;
  }

  /** Flat score bonus that does NOT touch the combo chain (ST-053 near-miss). Doubled under OVERDRIVE (ST-057). */
  bonus(pts) {
    const out = Math.floor(pts * this.overdriveMult);
    this.score += out;
    return out;
  }

  /** Damage breaks the chain (next kill restarts at combo 1). */
  onDamage() { this.combo = 0; this.lastKillTime = -Infinity; }

  /** I152: n player bullet(s) left the muzzle (spread fires count n at once). */
  onShotFired(n = 1) { this.shotsFired += Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }

  /** I152: one player bullet connected with a target. */
  onShotHit() { this.shotsHit++; }

  /** I152: hits / fired, clamped to 0..1 (0 when nothing fired yet). */
  accuracy() { if (this.shotsFired <= 0) return 0; return Math.min(1, this.shotsHit / this.shotsFired); }

  /** Expire the combo when the window lapses (call each step; drives HUD). */
  tick(t) {
    if (this.combo > 0 && t - this.lastKillTime > this.cfg.combo.window) this.combo = 0;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.lastKillTime = -Infinity;
    this.overdriveMult = 1;
  }
}
