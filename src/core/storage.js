// Void Runner - persistent storage (ST-018). Pure core: the raw store is injected,
// so this module never touches window.localStorage directly (main.js adapts it,
// tests use fakes). Every read/write is try/catch-guarded: private browsing and
// quota errors degrade to in-memory-only behavior instead of throwing.
//
// Payload shape (all values): { version: STORE_VERSION, ...data }
// getBest/getSettings fall back to safe defaults when the payload is missing or
// corrupt. I079 formalizes versioning/migration (v1 is the initial shape).

export const STORE_VERSION = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  volume: 0.7,      // master audio volume 0..1 (I27 consumes)
  sfx: true,        // sound effects on/off (I27 consumes)
  fx: 'high',       // 'high' | 'low' particle/fx tier (I26 panel, I25 particles honor)
  reducedMotion: false, // disable shake/flash (I25 honors)
  fontScale: 1,         // UI text scale 1 | 1.25 | 1.5 (I70; applied as --vr-fs)
});

export const FONT_SCALES = Object.freeze([1, 1.25, 1.5]);

export class Storage {
  /**
   * @param {{get:(k:string)=>(string|null), set:(k:string,v:string)=>void, remove:(k:string)=>void}} store
   * @param {{bestKey?:string, settingsKey?:string, highScoresKey?:string, highScoresMax?:number}} keys
   */
  constructor(store, keys = {}) {
    this.store = store;
    this.bestKey = keys.bestKey || 'voidrunner.best';
    this.settingsKey = keys.settingsKey || 'voidrunner.settings';
    this.highScoresKey = keys.highScoresKey || 'voidrunner.scores'; // I66
    this.maxScores = (Number.isInteger(keys.highScoresMax) && keys.highScoresMax > 0) ? keys.highScoresMax : 5; // I66
  }

  _read(key) {
    try {
      const raw = this.store.get(key);
      if (raw == null) return null;
      return JSON.parse(raw);
    } catch {
      return null; // corrupt or store threw
    }
  }

  _write(key, value) {
    try {
      this.store.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /** @returns {number} stored best score; 0 when absent/corrupt/non-finite. */
  getBest() {
    const d = this._read(this.bestKey);
    const n = d && typeof d.value === 'number' && isFinite(d.value) ? d.value : 0;
    return Math.max(0, Math.floor(n));
  }

  /**
   * Persist a score if it beats the stored best.
   * @returns {boolean} true when the stored best was raised (i.e. NEW BEST).
   */
  setBest(score) {
    const s = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
    if (s <= this.getBest()) return false;
    return this._write(this.bestKey, { version: STORE_VERSION, value: s });
  }

  /** @returns {{volume:number, sfx:boolean, fx:string, reducedMotion:boolean}} saved settings merged over defaults. */
  getSettings() {
    const d = this._read(this.settingsKey);
    const out = { ...DEFAULT_SETTINGS };
    if (!d || typeof d !== 'object') return out;
    if (typeof d.volume === 'number' && isFinite(d.volume)) out.volume = Math.min(1, Math.max(0, d.volume));
    if (typeof d.sfx === 'boolean') out.sfx = d.sfx;
    if (d.fx === 'high' || d.fx === 'low') out.fx = d.fx;
    if (typeof d.reducedMotion === 'boolean') out.reducedMotion = d.reducedMotion;
    if (FONT_SCALES.includes(d.fontScale)) out.fontScale = d.fontScale; // I70
    return out;
  }

  /** Merge a partial settings object, persist, and return the merged result. */
  setSettings(partial = {}) {
    const merged = { ...this.getSettings(), ...partial };
    // re-validate merged values the same way getSettings does
    const clean = { ...DEFAULT_SETTINGS };
    if (typeof merged.volume === 'number' && isFinite(merged.volume)) clean.volume = Math.min(1, Math.max(0, merged.volume));
    if (typeof merged.sfx === 'boolean') clean.sfx = merged.sfx;
    if (merged.fx === 'high' || merged.fx === 'low') clean.fx = merged.fx;
    if (typeof merged.reducedMotion === 'boolean') clean.reducedMotion = merged.reducedMotion;
    if (FONT_SCALES.includes(merged.fontScale)) clean.fontScale = merged.fontScale; // I70
    this._write(this.settingsKey, { version: STORE_VERSION, ...clean });
    return clean;
  }

  /** @returns {Array<{score:number, wave:number, kills:number}>} top-N high scores. No timestamps: core stays deterministic (I66). */
  getHighScores() {
    const d = this._read(this.highScoresKey);
    if (!d || !Array.isArray(d.list)) return [];
    const rows = [];
    for (const e of d.list) {
      if (!e || typeof e !== 'object') continue;
      const score = Number.isFinite(e.score) ? Math.floor(e.score) : NaN;
      const wave = Number.isFinite(e.wave) ? Math.floor(e.wave) : NaN;
      const kills = Number.isFinite(e.kills) ? Math.floor(e.kills) : NaN;
      if (!Number.isFinite(score) || !Number.isFinite(wave) || !Number.isFinite(kills)) continue; // NaN fails < comparisons
      if (score < 0 || wave < 1 || kills < 0) continue;
      rows.push({ score, wave, kills });
    }
    rows.sort((a, b) => b.score - a.score);
    return rows.slice(0, this.maxScores);
  }

  /**
   * Record a finished run in the high-score board.
   * @param {{score?:number, wave?:number, kills?:number}} entry
   * @returns {{list:Array, rank:number, newBest:boolean}} rank is 1..maxScores, 0 when off the board.
   */
  recordScore(entry = {}) {
    const score = Number.isFinite(entry.score) ? Math.floor(entry.score) : 0;
    const wave = Number.isFinite(entry.wave) ? Math.max(1, Math.floor(entry.wave)) : 1;
    const kills = Number.isFinite(entry.kills) ? Math.max(0, Math.floor(entry.kills)) : 0;
    if (score <= 0) return { list: this.getHighScores(), rank: 0, newBest: false }; // don't pollute the board
    const prev = this.getHighScores();
    let rank = prev.filter((e) => e.score > score).length + 1;
    if (rank > this.maxScores) rank = 0;
    const newBest = rank === 1;
    const list = prev.concat([{ score, wave, kills }]).sort((a, b) => b.score - a.score).slice(0, this.maxScores);
    this._write(this.highScoresKey, { version: STORE_VERSION, list });
    return { list, rank, newBest };
  }

  remove(key) {
    try { this.store.remove(key); return true; } catch { return false; }
  }
}
