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
});

export class Storage {
  /**
   * @param {{get:(k:string)=>(string|null), set:(k:string,v:string)=>void, remove:(k:string)=>void}} store
   * @param {{bestKey?:string, settingsKey?:string}} keys
   */
  constructor(store, keys = {}) {
    this.store = store;
    this.bestKey = keys.bestKey || 'voidrunner.best';
    this.settingsKey = keys.settingsKey || 'voidrunner.settings';
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
    this._write(this.settingsKey, { version: STORE_VERSION, ...clean });
    return clean;
  }

  remove(key) {
    try { this.store.remove(key); return true; } catch { return false; }
  }
}
