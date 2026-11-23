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
    this.activeMod = 'none'; // ST-051: none | fast | small | inward | big (ST-228)
    this.openGate = null; // ST-242: opening-batch budget (null = normal trickle, pre-ST-242 bit-identical)
    this.onDecide = null; // ST-304 (I329): wave start decision hook; null = pre-I329 bit-identical
    this.activeAdj = null; // ST-304 (I329): the decision applied to the active wave (null or adj)
    this.rockAllowed = true; // ST-453 (I486): campaign zone identity - false = zone mix has no 'rock' (content consumed, no spawn)
  }

  start() {
    this.wave = 0;
    this.toSpawn = 0;
    this.intermission = this.intermissionFor(1); // ST-058
    this.state = 'intermission';
    this.activeMod = 'none';
    this.openGate = null;
    this.activeAdj = null; // ST-304 (I329)
    this.rockAllowed = true; // ST-453 (I486)
  }

  reset() { this.state = 'idle'; this.wave = 0; this.toSpawn = 0; this.intermission = 0; this.waveElapsed = 0; this.activeMod = 'none'; this.openGate = null; this.activeAdj = null; this.rockAllowed = true; }

  get speedMult() {
    let m = Math.min(this.cfg.wave.speedCap, 1 + this.cfg.wave.speedPerWave * this.wave);
    if (this.activeMod === 'fast') m *= this.cfg.waveMods.fastSpeedMult; // ST-051
    return m;
  }

  /** ST-092 (F9) / ST-242: is `wave` the breather wave right after a boss wave? */
  isBreatherWave(wave) {
    const b = this.cfg.boss;
    return !!(b && b.everyWave && wave - 1 >= b.everyWave && (wave - 1) % b.everyWave === 0);
  }

  /** ST-242: opening-batch budget for `wave` - null = no budget (bit-identical to pre-ST-242),
   *  integer = the wave's first burst capped at that many rocks (rest trickle in as before).
   *  Breather: max(breatherMinRocks, floor(normalOpen * breatherOpenFrac)), normalOpen =
   *  pre-ST-242 first-tick batch min(content, limit, 16). Pure fn of (cfg, wave). */
  openBudgetFor(wave) {
    if (!this.isBreatherWave(wave)) return null;
    const w = this.cfg.wave;
    const limit = Math.min(w.maxConcurrentCap, 6 + w.maxConcurrentGrowth * wave);
    const normal = Math.min(16, this.contentFor(wave), limit);
    return Math.max(w.breatherMinRocks, Math.floor(normal * w.breatherOpenFrac));
  }

  /** ST-051: modifier for a wave - pure function of (world seed, wave number). */
  modifierFor(wave) {
    const m = this.cfg.waveMods;
    if (wave < m.first) return 'none';
    // ST-092 (F9): the wave right after a boss wave is a modifier-free breather, so the
    // boss beat is followed by a recovery wave instead of a compounding spike.
    if (this.isBreatherWave(wave)) return 'none'; // ST-092 (F9) / ST-242
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

  /** ST-131: spawn-mix row for the current wave (config.spawnMix.rows). */
  mixRow() {
    const rows = this.cfg.spawnMix.rows;
    for (const row of rows) if (this.wave <= row.toWave) return row;
    return rows[rows.length - 1];
  }

  pickSize() {
    const r = this.rng.next();
    if (this.activeMod === 'small') { // ST-051: S-favored wave
      if (r < this.cfg.waveMods.smallSBias) return 'S';
      const r2 = this.rng.next();
      return r2 < 0.5 ? 'L' : 'M';
    }
    if (this.activeMod === 'big') { // ST-228: L-favored wave (mirror of 'small')
      if (r < this.cfg.waveMods.bigLBias) return 'L';
      const r2 = this.rng.next();
      return r2 < 0.5 ? 'S' : 'M';
    }
    const row = this.mixRow(); // ST-131: data-driven L/M/S mix (1 draw, pre-I131 width)
    if (r < row.L) return 'L';
    if (r < row.L + row.M) return 'M';
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
        this.activeAdj = this.onDecide ? this.onDecide(this.wave) : null; // ST-304 (I329)
        this.toSpawn = this.activeAdj ? Math.round(this.contentFor(this.wave) * this.activeAdj.d) : this.contentFor(this.wave); // ST-058 / ST-304
        this.waveElapsed = 0;
        this.state = 'active';
        this.activeMod = this._modFor(this.wave); // ST-051 / ST-304 (I329)
        this.openGate = this.openBudgetFor(this.wave); // ST-242
        ev.startedWave = this.wave;
      } else {
        return ev;
      }
    }

    // active
    this.waveElapsed += dt; // I42: stall timer counts active time only

    // trickle-spawn up to the concurrent limit
    let guard = 0;
    while (this.toSpawn > 0 && this.field.count < this.concurrentLimit && guard++ < 16 && (this.openGate == null || this.openGate > 0)) {
      if (!this.rockAllowed) { this.toSpawn -= 1; if (this.openGate != null) this.openGate -= 1; continue; } // ST-453 (I486): rockless zone - consume budget, no spawn (no RNG draws)
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
      if (this.openGate != null) this.openGate -= 1; // ST-242: burst counts down; at 0 the loop condition ends it
    }
    if (this.openGate === 0) this.openGate = null; // ST-242: burst exhausted -> normal trickle from the next tick

    // I563: killableCount - the ST-138 belt rocks persist by design (ambient hazard), so a wave clears
    // the moment its killables are gone; the I42 stallTime above stays only as the safety backstop.
    if (this.toSpawn === 0 && this.field.killableCount === 0) {
      this.state = 'intermission';
      this.intermission = this.intermissionFor(this.wave + 1); // ST-058
      this.waveElapsed = 0;
      ev.waveCleared = this.wave;
    } else if (this.waveElapsed >= this.cfg.wave.stallTime) {
      // I42: stall advance - the wave moves on even if rocks survive. Leftovers
      // carry into the next wave (not deleted, not sped up); no intermission.
      this.wave += 1;
      this.activeAdj = this.onDecide ? this.onDecide(this.wave) : null; // ST-304 (I329)
      this.toSpawn = this.activeAdj ? Math.round(this.contentFor(this.wave) * this.activeAdj.d) : this.contentFor(this.wave); // ST-058 / ST-304
      this.waveElapsed = 0;
      this.activeMod = this._modFor(this.wave); // ST-051 / ST-304 (I329)
      this.openGate = this.openBudgetFor(this.wave); // ST-242
      ev.stallAdvance = this.wave;
      ev.startedWave = this.wave; // same "WAVE n" banner flow as a normal start
    }
    return ev;
  }
  /** ST-304 (I329): the wave mod with the director gentle/hard bias applied. */
  _modFor(wave) {
    const base = this.modifierFor(wave);
    const adj = this.activeAdj;
    if (!adj || adj.mod === 'none') return base;
    if (this.isBreatherWave(wave)) return 'none'; // ST-092/ST-242: breather stays mod-free
    const bias = this.cfg.waveMods.modBias;
    if (adj.mod === 'gentle') return bias.gentle.avoid.indexOf(base) >= 0 ? 'none' : base;
    const prefer = bias.hard.prefer;
    return prefer[wave % prefer.length]; // deterministic alternation (no extra RNG draws)
  }

}
