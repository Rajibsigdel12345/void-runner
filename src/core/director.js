// ST-304: adaptive director (E33, adaptive-director arc). Pure, DOM-free, three-free.
//
// Reads the skill model (performance P 0..1, windowed threat-load L 0..1) and
// emits BOUNDED per-wave parameter adjustments - spawn density (d), enemy-bullet
// speed (b), pickup generosity (drop) and a wave-mod weight tag (mod) - inside a
// monotone envelope fixed by config.director. It is WAVE-START-ONLY: the caller
// invokes decideForWave(wave, ctx) once per wave and applies the returned
// multipliers for that whole wave (no same-wave retroactivity).
//
// Monotone-envelope proof: pressure p is clamped to [pressureMin, pressureMax]
// and moves at most pressureStep per decide, so d/b/drop (pure monotone maps of
// p) can never leave their [min, max] bands. A lull (after a hit, or sustained
// high windowed load) snaps p to pressureMin; the next non-lull wave climbs back
// by at most one step, so recovery takes >= 1 wave (no instant re-spike). The
// director never touches score: it has no score field and only returns multipliers.
//
// off / replayMode / wave < firstWave -> NEUTRAL_ADJ (a shared frozen object):
// no state change, no log entry, no allocation - bit-identical to a pre-I329 run
// (the built-in demo runs in replay mode, so its pin is structurally safe).

const DEFAULTS = {
  enabled: true,
  firstWave: 3,            // waves 1-2 stay fixed (teach the base loop + the demo pin)
  pressureMin: 0.1,
  pressureMax: 0.9,
  pressureStart: 0.3,
  pressureStep: 0.15,      // max |dp| per decide (bounded ramp, so recovery >= 1 wave)
  lullWindow: 20,          // s: EMA time-constant for the windowed load (I328: windowed, NOT run-mean)
  lullLHigh: 0.55,         // sustained windowed load >= this triggers a lull (no hit needed)
  lullPStruggle: 0.4,      // P <= this -> struggling (target the min)
  lullPHard: 0.65,         // P >= this -> skilled (target the max)
  density: { min: 0.65, max: 1.2 },
  bullet:  { min: 0.85, max: 1.15 },
  drop:    { min: 0.9, max: 2.0 },
  lullDensity: 0.6,        // lull wave spawn-density multiplier (dips below the min band)
  lullBullet: 0.9,
  lullDrop: 2.0,           // lull wave drop multiplier (lifts above the max band)
  logCap: 256,
};

const NEUTRAL_ADJ = Object.freeze({
  wave: 0, lull: false, p: 0, L: 0, d: 1, b: 1, drop: 1, mod: 'none', reason: 'off',
});

const lerp = (a, b, t) => a + (b - a) * t;

class Director {
  constructor(cfg = {}) {
    const c = { ...DEFAULTS, ...cfg };
    c.density = { ...DEFAULTS.density, ...(cfg.density || {}) };
    c.bullet  = { ...DEFAULTS.bullet,  ...(cfg.bullet  || {}) };
    c.drop    = { ...DEFAULTS.drop,    ...(cfg.drop    || {}) };
    this.cfg = c;
    this.pressure = c.pressureStart;
    this.loadEMA = 0;
    this.hits = 0;
    this.lethals = 0;
    this.tick = 0;
    this.log = [];
    this.lastDecision = null;
  }

  /** Route one World event. Only 'hit' (and its lethal flag) is tracked; unknown
   *  types are ignored and this never throws. */
  onEvent(type, data) {
    if (type === 'hit') {
      this.hits += 1;
      if (data && data.lives === 0) this.lethals += 1;
    }
  }

  /** Windowed threat-load EMA, once per simulated step (after the skill sample). */
  sample(dt, load) {
    this.tick += 1;
    const k = 1 - Math.exp(-dt / this.cfg.lullWindow);
    this.loadEMA += ((load || 0) - this.loadEMA) * k;
  }

  /**
   * WAVE-START ONLY. `ctx` = { replayMode, performance }. Returns an adjustment
   * object for the wave, or NEUTRAL_ADJ when the director is off / in replay mode /
   * before the first adaptive wave. Resets the hit-window on EVERY decide so a lull
   * can never span two waves from one old hit.
   */
  decideForWave(wave, ctx = {}) {
    const c = this.cfg;
    if (c.enabled && !ctx.replayMode && wave >= c.firstWave) {
      const P = ctx.performance == null ? 0.5 : ctx.performance;
      const lull = this.hits >= 1 || this.loadEMA >= c.lullLHigh;
      let reason;
      if (lull) {
        this.pressure = c.pressureMin; // trough snap
        reason = this.hits >= 1 ? 'hit' : 'load';
      } else {
        const target = P >= c.lullPHard ? c.pressureMax : P <= c.lullPStruggle ? c.pressureMin : this.pressure;
        let dp = target - this.pressure;
        if (dp > c.pressureStep) dp = c.pressureStep;
        else if (dp < -c.pressureStep) dp = -c.pressureStep;
        this.pressure = Math.min(c.pressureMax, Math.max(c.pressureMin, this.pressure + dp));
        reason = P <= c.lullPStruggle ? 'struggle' : P >= c.lullPHard ? 'skilled' : 'hold';
      }
      let d, b, drop, mod;
      if (lull) {
        d = c.lullDensity; b = c.lullBullet; drop = c.lullDrop; mod = 'gentle';
      } else {
        const p = this.pressure;
        const t = (p - c.pressureMin) / (c.pressureMax - c.pressureMin); // p clamped -> t in [0,1]
        d = lerp(c.density.min, c.density.max, t);
        b = lerp(c.bullet.min, c.bullet.max, t);
        drop = lerp(c.drop.max, c.drop.min, t); // inverse: skilled -> fewer drops
        mod = t >= 0.75 ? 'hard' : t <= 0.35 ? 'gentle' : 'none';
      }
      const dec = { wave, lull, p: this.pressure, L: this.loadEMA, d, b, drop, mod, reason };
      this.log.push(dec);
      if (this.log.length > c.logCap) this.log.shift();
      this.lastDecision = dec;
      this.hits = 0;
      this.lethals = 0;
      return dec;
    }
    this.hits = 0;
    this.lethals = 0;
    return NEUTRAL_ADJ;
  }

  /** Reset to a fresh-run state (constructor defaults, empty log). */
  reset() {
    const c = this.cfg;
    this.pressure = c.pressureStart;
    this.loadEMA = 0;
    this.hits = 0;
    this.lethals = 0;
    this.tick = 0;
    this.log.length = 0;
    this.lastDecision = null;
  }
}

export { Director, DEFAULTS as DIRECTOR_DEFAULTS, NEUTRAL_ADJ };