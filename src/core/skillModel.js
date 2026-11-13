// ST-303: skill-model telemetry (E33, adaptive-director arc). Pure, DOM-free,
// three-free.
//
// Architecture mirrors bossTally/juiceTally: external event subscriber +
// per-tick sample(). The harness feeds drainEvents() + ship pos + a flat
// threat list per step, so game.js stays a 0 KB diff (integration is ST-304).
// The module allocates nothing per tick; the caller passes a flat reused
// threats array of {x, y, r, w} entries (w = threat weight, default 1).
//
// Two 0..1 signals:
//   performance P - signed "skill momentum" M with exponential decay:
//     M *= exp(-dt/tau) per sample();  P = 0.5 + clamp(M, +-mMax)/mMax * 0.5
//     kill:     +wKill * (1 + wKillCombo * min(combo, comboCap))
//     nearmiss: +wGraze
//     hit:      -wHit (extra -wDeathExtra when data.lives === 0, i.e. lethal)
//     fire:     -wShot (accuracy is rewarded implicitly)
//   load L - instantaneous (no EMA) threat-load proxy:
//     L_raw = SUM (t.w||1) / (1 + (gap/sigma)^2),  gap = dist(ship,threat)-t.r
//     clamped to >= 0;  L = L_raw / (1 + L_raw)
//     ("perceived stress = count x proximity", WbHMxo11HcU [6:03])
//
// Bounded-swing proof (R2d): the worst single event is a lethal hit,
// dM = wHit + wDeathExtra = 1.05; mapped to P that is 1.05/mMax*0.5 = 0.175
// < 0.25, so a single event can never move P across a 0.25-wide band.
// R2d is bounded by construction, independent of tuning.

const DEFAULTS = {
  tau: 6, mMax: 3, wKill: 0.35, wKillCombo: 0.05, comboCap: 10,
  wGraze: 0.15, wHit: 0.75, wDeathExtra: 0.3, wShot: 0.004, sigma: 6,
};

class SkillModel {
  /**
   * @param {object} cfg skill tunables (merged over DEFAULTS; no config import)
   * @param {number} dt seconds per simulated tick (momentum decay rate)
   */
  constructor(cfg = {}, dt = 1 / 60) {
    this.cfg = { ...DEFAULTS, ...cfg };
    this.dt = dt;
    this._decay = Math.exp(-dt / this.cfg.tau); // computed once
    this.tick = 0; // advanced once per sample()
    this._m = 0; // signed skill momentum (unclamped; clamped in the getter)
    this.load = 0;
    this.wave = 0;
    this.kills = 0;
    this.hits = 0;
    this.lethalHits = 0;
    this.nearmisses = 0;
    this.shots = 0;
  }

  /** Reset to a fresh-run state (zero momentum, counters, tick, wave). */
  reset() {
    this._m = 0;
    this.load = 0;
    this.tick = 0;
    this.wave = 0;
    this.kills = 0;
    this.hits = 0;
    this.lethalHits = 0;
    this.nearmisses = 0;
    this.shots = 0;
  }

  /** 0..1 performance proxy (pure read of the decayed momentum). */
  get performance() {
    const c = this.cfg;
    let m = this._m;
    if (m > c.mMax) m = c.mMax;
    else if (m < -c.mMax) m = -c.mMax;
    return 0.5 + (m / c.mMax) * 0.5;
  }

  /** Route one World event. Unknown types are ignored (never throws). */
  onEvent(type, data) {
    const d = data || {};
    const c = this.cfg;
    switch (type) {
      case 'wave':
        this.wave = d.n | 0;
        break;
      case 'kill': {
        this.kills += 1;
        const combo = Math.min(d.combo || 0, c.comboCap);
        this._m += c.wKill * (1 + c.wKillCombo * combo);
        break;
      }
      case 'nearmiss':
        this.nearmisses += 1;
        this._m += c.wGraze;
        break;
      case 'hit':
        this.hits += 1;
        this._m -= c.wHit;
        if (d.lives === 0) {
          this.lethalHits += 1;
          this._m -= c.wDeathExtra;
        }
        break;
      case 'fire':
        this.shots += 1;
        this._m -= c.wShot;
        break;
      default:
        break;
    }
  }

  /**
   * Call once per simulated step, after step()/drainEvents(). Advances the
   * tick counter, decays momentum, and recomputes the instantaneous threat
   * load. `threats` is a flat array of {x, y, r, w} (w defaults to 1).
   */
  sample(shipPos, threats) {
    this.tick += 1;
    this._m *= this._decay;
    let raw = 0;
    const sig = this.cfg.sigma;
    const list = threats || [];
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const dx = shipPos.x - t.x;
      const dy = shipPos.y - t.y;
      const gap = Math.sqrt(dx * dx + dy * dy) - (t.r || 0);
      const g = gap < 0 ? 0 : gap;
      raw += (t.w || 1) / (1 + (g / sig) * (g / sig));
    }
    this.load = raw / (1 + raw);
    return this.load;
  }

  /** Plain JSON-safe copy of the live counters. */
  snapshot() {
    return {
      tick: this.tick,
      wave: this.wave,
      performance: this.performance,
      load: this.load,
      kills: this.kills,
      hits: this.hits,
      lethalHits: this.lethalHits,
      nearmisses: this.nearmisses,
      shots: this.shots,
    };
  }
}

export { SkillModel };
