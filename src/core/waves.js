// Void Runner - wave director (ST-014). Owns all asteroid spawning during play.
import { CONFIG } from './config.js';

export class WaveDirector {
  constructor(rng, field, cfg = CONFIG) {
    this.rng = rng;
    this.field = field;
    this.cfg = cfg;
    this.wave = 0;
    this.toSpawn = 0;
    this.intermission = 0;
    this.state = 'idle'; // idle | intermission | active
  }

  start() {
    this.wave = 0;
    this.toSpawn = 0;
    this.intermission = this.cfg.wave.intermission;
    this.state = 'intermission';
  }

  reset() { this.state = 'idle'; this.wave = 0; this.toSpawn = 0; this.intermission = 0; }

  get speedMult() {
    return Math.min(this.cfg.wave.speedCap, 1 + this.cfg.wave.speedPerWave * this.wave);
  }

  get concurrentLimit() {
    return Math.min(this.cfg.wave.maxConcurrentCap, 6 + this.cfg.wave.maxConcurrentGrowth * this.wave);
  }

  pickSize() {
    const r = this.rng.next();
    if (this.wave < 3) return r < 0.5 ? 'L' : 'M'; // early waves: no S
    if (r < 0.3) return 'L';
    if (r < 0.7) return 'M';
    return 'S';
  }

  /** @returns {{startedWave:number, waveCleared:number}} */
  step(dt) {
    const ev = { startedWave: 0, waveCleared: 0 };
    if (this.state === 'idle') return ev;

    if (this.state === 'intermission') {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        this.wave += 1;
        this.toSpawn = this.cfg.wave.base + this.cfg.wave.growth * this.wave;
        this.state = 'active';
        ev.startedWave = this.wave;
      } else {
        return ev;
      }
    }

    // active: trickle-spawn up to the concurrent limit
    let guard = 0;
    while (this.toSpawn > 0 && this.field.count < this.concurrentLimit && guard++ < 16) {
      const rock = this.field.spawn(this.pickSize(), this.speedMult);
      if (!rock) break; // hard cap (e.g. fragments temporarily full)
      this.toSpawn -= 1;
    }

    if (this.toSpawn === 0 && this.field.count === 0) {
      this.state = 'intermission';
      this.intermission = this.cfg.wave.intermission;
      ev.waveCleared = this.wave;
    }
    return ev;
  }
}
