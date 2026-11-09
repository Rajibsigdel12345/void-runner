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
    this.intermission = this.cfg.wave.intermission;
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

  pickSize() {
    const r = this.rng.next();
    if (this.activeMod === 'small') { // ST-051: S-favored wave
      if (r < this.cfg.waveMods.smallSBias) return 'S';
      const r2 = this.rng.next();
      return r2 < 0.5 ? 'L' : 'M';
    }
    if (this.wave < 3) return r < 0.5 ? 'L' : 'M'; // early waves: no S
    if (r < 0.3) return 'L';
    if (r < 0.7) return 'M';
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
        this.toSpawn = this.cfg.wave.base + this.cfg.wave.growth * this.wave;
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
      const rock = this.field.spawn(this.pickSize(), this.speedMult, null, noNear);
      if (!rock) break; // hard cap (e.g. fragments temporarily full)
      this.toSpawn -= 1;
    }

    if (this.toSpawn === 0 && this.field.count === 0) {
      this.state = 'intermission';
      this.intermission = this.cfg.wave.intermission;
      this.waveElapsed = 0;
      ev.waveCleared = this.wave;
    } else if (this.waveElapsed >= this.cfg.wave.stallTime) {
      // I42: stall advance - the wave moves on even if rocks survive. Leftovers
      // carry into the next wave (not deleted, not sped up); no intermission.
      this.wave += 1;
      this.toSpawn = this.cfg.wave.base + this.cfg.wave.growth * this.wave;
      this.waveElapsed = 0;
      this.activeMod = this.modifierFor(this.wave); // ST-051
      ev.stallAdvance = this.wave;
      ev.startedWave = this.wave; // same "WAVE n" banner flow as a normal start
    }
    return ev;
  }
}
