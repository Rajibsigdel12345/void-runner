// Void Runner - wave director (ST-014). Owns all asteroid spawning during play.
import { CONFIG } from './config.js';
import { RNG } from './rng.js';

export class WaveDirector {
  constructor(rng, field, cfg = CONFIG) {
    this.rng = rng;
    this.field = field;
    this.cfg = cfg;
    this.wave = 0;
    this.toSpawn = 0;
    this.intermission = 0;
    this.state = 'idle'; // idle | intermission | active
    this.waveElapsed = 0; // I42: active time of the current wave (stall timer)
    this.activeMod = 'none'; // ST-051: none | fast | small | inward
  }

  start() {
    this.wave = 0;
    this.toSpawn = 0;
    this.intermission = this.intermissionFor(1); // ST-058
    this.state = 'intermission';
    this.activeMod = 'none';
  }

  reset() { this.state = 'idle'; this.wave = 0; this.toSpawn = 0; this.intermission = 0; this.waveElapsed = 0; this.activeMod = 'none'; }

  get speedMult() {
    let m = Math.min(this.cfg.wave.speedCap, 1 + this.cfg.wave.speedPerWave * this.wave);
    if (this.activeMod === 'fast') m *= this.cfg.waveMods.fastSpeedMult; // ST-051
    return m;
  }

  /** ST-051: modifier for a wave - pure function of (world seed, wave number). */
  modifierFor(wave) {
    const m = this.cfg.waveMods;
    if (wave < m.first) return 'none';
    // ST-092 (F9): the wave right after a boss wave is a modifier-free breather, so the
    // boss beat is followed by a recovery wave instead of a compounding spike.
    const b = this.cfg.boss;
    if (b && b.everyWave && wave - 1 >= b.everyWave && (wave - 1) % b.everyWave === 0) return 'none';
    const r = new RNG((this.rng.seed ^ Math.imul(wave, 0x9e3779b9)) >>> 0);
    return m.list[Math.floor(r.next() * m.list.length) % m.list.length];
  }

  /** ST-051: per-frame inward pull while the 'inward' modifier is active. */
  get inwardAccel() {
    return this.activeMod === 'inward' ? this.cfg.waveMods.inwardAccel : 0;
  }

  get concurrentLimit() {
    return Math.min(this.cfg.wave.maxConcurrentCap, 6 + this.cfg.wave.maxConcurrentGrowth * this.wave);
  }

  /** ST-058: has the endless difficulty curve engaged for the current wave? */
  endless() {
    return this.wave >= this.cfg.waveEndless.first;
  }

  /** ST-058: total content for a wave - base ramp, capped once endless is on. */
  contentFor(wave) {
    const c = this.cfg.wave;
    const raw = c.base + c.growth * wave;
    return wave >= this.cfg.waveEndless.first ? Math.min(this.cfg.waveEndless.contentCap, raw) : raw;
  }

  /** ST-058: intermission before `wave` - base, shrinking toward a floor once endless. */
  intermissionFor(wave) {
    const c = this.cfg.waveEndless;
    if (wave < c.first) return this.cfg.wave.intermission;
    return Math.max(c.minIntermission, this.cfg.wave.intermission - c.intermissionStep * (wave - c.first));
  }

  /** ST-058: small-rock probability - 0.3 pre-endless, +step per wave, capped. */
  sProb() {
    const c = this.cfg.waveEndless;
    if (this.wave < c.first) return 0.3;
    return Math.min(c.sBiasCap, 0.3 + c.sBiasStep * (this.wave - c.first));
  }

  pickSize() {
    const r = this.rng.next();
    if (this.activeMod === 'small') { // ST-051: S-favored wave
      if (r < this.cfg.waveMods.smallSBias) return 'S';
      const r2 = this.rng.next();
      return r2 < 0.5 ? 'L' : 'M';
    }
    if (this.wave < 3) return r < 0.5 ? 'L' : 'M'; // early waves: no S
    const sP = this.sProb(); // ST-058: 0.3 pre-endless; rises per wave after
    const rest = 1 - sP;
    if (r < rest) return r < rest * (0.3 / 0.7) ? 'L' : 'M'; // L:M stay 3:4 within non-S
    return 'S';
  }

  /** @returns {{startedWave:number, waveCleared:number, stallAdvance:number}} */
  step(dt, playerPos = null) {
    const ev = { startedWave: 0, waveCleared: 0, stallAdvance: 0 };
    if (this.state === 'idle') return ev;

    if (this.state === 'intermission') {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave += 1;
        this.toSpawn = this.contentFor(this.wave); // ST-058
        this.waveElapsed = 0;
        this.state = 'active';
        this.activeMod = this.modifierFor(this.wave); // ST-051
        ev.startedWave = this.wave;
      } else {
        return ev;
      }
    }

    // active
    this.waveElapsed += dt; // I42: stall timer counts active time only

    // trickle-spawn up to the concurrent limit
    let guard = 0;
    while (this.toSpawn > 0 && this.field.count < this.concurrentLimit && guard++ < 16) {
      const noNear = playerPos
        ? { x: playerPos.x, y: playerPos.y, min: this.cfg.wave.spawnMinPlayerDist }
        : null;
      const g = this.cfg.asteroid.golden; // ST-052: rare golden rock (rim spawns only)
      const sh = this.cfg.asteroid.shielded; // ST-121: rare shielded rock (rim spawns only)
      const shielded = this.wave >= sh.minWave && this.rng.chance(sh.chance);
      const gold = !shielded && this.wave >= g.minWave && this.rng.chance(g.chance); // shielded takes precedence
      let sm = this.speedMult;
      if (gold) sm *= g.speedMult;
      const rock = this.field.spawn(shielded ? sh.size : this.pickSize(), sm, null, noNear, gold, null, 0, shielded);
      if (!rock) break; // hard cap (e.g. fragments temporarily full)
      this.toSpawn -= 1;
    }

    if (this.toSpawn === 0 && this.field.count === 0) {
      this.state = 'intermission';
      this.intermission = this.intermissionFor(this.wave + 1); // ST-058
      this.waveElapsed = 0;
      ev.waveCleared = this.wave;
    } else if (this.waveElapsed >= this.cfg.wave.stallTime) {
      // I42: stall advance - the wave moves on even if rocks survive. Leftovers
      // carry into the next wave (not deleted, not sped up); no intermission.
      this.wave += 1;
      this.toSpawn = this.contentFor(this.wave); // ST-058
      this.waveElapsed = 0;
      this.activeMod = this.modifierFor(this.wave); // ST-051
      ev.stallAdvance = this.wave;
      ev.startedWave = this.wave; // same "WAVE n" banner flow as a normal start
    }
    return ev;
  }
}
