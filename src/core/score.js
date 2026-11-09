// Void Runner - score + combo (ST-013). Pure core.
import { CONFIG } from './config.js';

export class ScoreKeeper {
  constructor(cfg = CONFIG) {
    this.cfg = cfg;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.lastKillTime = -Infinity;
    this.overdriveMult = 1; // ST-057: World sets this to the OVERDRIVE mult while active
  }

  get multiplier() {
    if (this.combo <= 1) return 1;
    return 1 + this.cfg.combo.step * (Math.min(this.combo, this.cfg.combo.cap) - 1);
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

  /** Expire the combo when the window lapses (call each step; drives HUD). */
  tick(t) {
    if (this.combo > 0 && t - this.lastKillTime > this.cfg.combo.window) this.combo = 0;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.lastKillTime = -Infinity;
    this.overdriveMult = 1;
  }
}
