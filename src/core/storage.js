// Void Runner - persistent storage (ST-018). Pure core: the raw store is injected,
// so this module never touches window.localStorage directly (main.js adapts it,
// tests use fakes). Every read/write is try/catch-guarded: private browsing and
// quota errors degrade to in-memory-only behavior instead of throwing.
//
// Payload shape (all values): { version: STORE_VERSION, ...data }
// getBest/getSettings fall back to safe defaults when the payload is missing or
// corrupt. I079 implements versioning + migration: reads validate the payload version
// and migrate older known versions up to STORE_VERSION (an unknown future version, or a
// corrupt/non-integer version, falls back to defaults). migratePayload is pure + tested.

import { CONFIG } from './config.js'; // ST-190: replay tape length cap
import { levelCount } from './level.js'; // ST-457 (E64): campaign progress clamps to the campaign length
import { LOCALES } from './strings.js'; // ST-375: locale persistence (validated against strings.js LOCALES)
import { decodeReplay } from './replay.js'; // ST-190: strict replay validation

export const STORE_VERSION = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  volume: 0.7,      // master audio volume 0..1 (I27 consumes)
  sfx: true,        // sound effects on/off (I27 consumes)
  fx: 'high',       // 'high' | 'low' | 'off' particle/fx tier (I26 panel, I25 particles honor, ST-224 off)
  reducedMotion: false, // disable shake/flash (I25 honors)
  cameraMode: 'chase',    // ST-416 (I446): 'chase'|'overview'|'cockpit' (V cycles; panel select)
  fontScale: 1,         // UI text scale 1 | 1.25 | 1.5 (I70; applied as --vr-fs)
  shapeCues: true,      // colorblind-friendly silhouette cues (I155; asteroidRenderer/wardenMesh honor)
  music: true,          // generative ambient music bed on/off (I158; audio.js bed)
  colorblindPreview: false, // simulate deuteranopia (Machado 2009) on the canvas (I158; a11y preview)
  slowmoHint: true,     // short slow-mo power-up caption when on screen / active (I158; HUD hint)
  locale: 'en',         // UI language (ST-375; validated against strings.js LOCALES)
});

export const FONT_SCALES = Object.freeze([1, 1.25, 1.5]);

/** I157/ST-224: F hotkey - cycle the FX quality tier high -> low -> off -> high. Anything that is not exactly 'low' or 'off' is treated as 'high' (defensive; mirrors applySettings). */
export function toggleFxQuality(fx) {
  const t = fx === 'low' || fx === 'off' ? fx : 'high';
  return t === 'high' ? 'low' : t === 'low' ? 'off' : 'high';
}

// Migration registry: key = the "from" version, value = (data) => next-version data.
// Steps run in order from the stored version up to STORE_VERSION. v1 is the initial
// shape so there is no live step yet; when the schema grows, add a step (e.g.
// 2: (d) => ({ ...d, newField })) and bump STORE_VERSION.
const MIGRATIONS = Object.freeze({
  // 1: ... // (none yet - v1 is current)
});

/**
 * Validate a stored payload's version and migrate it up to targetVersion.
 * Pure (unit-tested): returns the current-shape object, or null when the payload is
 * unknown/incompatible (non-object, corrupt version, or a future version > target).
 * A missing version is treated as the legacy v1 shape (we have always stamped v1).
 */
export function migratePayload(version, data, migrations = MIGRATIONS, targetVersion = STORE_VERSION) {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null;
  let v = (version === undefined || version === null) ? 1 : version;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return null; // corrupt version
  if (v > targetVersion) return null; // unknown future schema: safer to fall back than mis-parse
  let out = data;
  while (v < targetVersion) {
    const step = migrations[v];
    if (typeof step !== 'function') return null; // no migration path from v
    try { out = step(out); } catch { return null; }
    if (out == null || typeof out !== 'object' || Array.isArray(out)) return null;
    v++;
  }
  return out;
}

export class Storage {
  /**
   * @param {{get:(k:string)=>(string|null), set:(k:string,v:string)=>void, remove:(k:string)=>void}} store
   * @param {{bestKey?:string, settingsKey?:string, highScoresKey?:string, highScoresMax?:number, tutorialKey?:string}} keys
   */
  constructor(store, keys = {}) {
    this.store = store;
    this.bestKey = keys.bestKey || 'voidrunner.best';
    this.settingsKey = keys.settingsKey || 'voidrunner.settings';
    this.highScoresKey = keys.highScoresKey || 'voidrunner.scores'; // I66
    this.dailyBestKey = keys.dailyBestKey || 'voidrunner.daily'; // ST-141: daily best (per calendar day)
    this.tutorialKey = keys.tutorialKey || 'voidrunner.tutorial'; // I151: first-run tutorial seen flag
    this.maxScores = (Number.isInteger(keys.highScoresMax) && keys.highScoresMax > 0) ? keys.highScoresMax : 5; // I66
    this.replaysKey = keys.replaysKey || 'voidrunner.replays'; // ST-190: saved replays (newest-first, capped)
this.campaignKey = keys.campaignKey || 'voidrunner.campaign'; // ST-457 (E64): campaign highest-level continue
    this.maxReplays = (Number.isInteger(keys.replaysMax) && keys.replaysMax > 0) ? keys.replaysMax : 2; // ST-190
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

  /** Read + version-validate + migrate a stored payload (ST-079). null when absent/corrupt/unknown. */
  _readVersioned(key) {
    const raw = this._read(key);
    if (raw == null) return null;
    const data = migratePayload(raw.version, raw);
    if (data === null) return null;
    if (typeof raw.version === 'number' && raw.version >= 1 && raw.version < STORE_VERSION) {
      this._write(key, { ...data, version: STORE_VERSION }); // best-effort in-place upgrade
    }
    return data;
  }

  /** @returns {number} stored best score; 0 when absent/corrupt/non-finite. */
  getBest() {
    const d = this._readVersioned(this.bestKey);
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

  /** @returns {{volume:number, sfx:boolean, fx:string, cameraMode:string, reducedMotion:boolean, fontScale:number, shapeCues:boolean, music:boolean, colorblindPreview:boolean, slowmoHint:boolean, locale:string}} saved settings merged over defaults. */
  getSettings() {
    const d = this._readVersioned(this.settingsKey);
    const out = { ...DEFAULT_SETTINGS };
    if (!d || typeof d !== 'object') return out;
    if (typeof d.volume === 'number' && isFinite(d.volume)) out.volume = Math.min(1, Math.max(0, d.volume));
    if (typeof d.sfx === 'boolean') out.sfx = d.sfx;
    if (d.fx === 'high' || d.fx === 'low' || d.fx === 'off') out.fx = d.fx; // ST-224: 3-tier
    if (d.cameraMode === 'chase' || d.cameraMode === 'overview' || d.cameraMode === 'cockpit') out.cameraMode = d.cameraMode; // ST-416 (I446)
    if (typeof d.reducedMotion === 'boolean') out.reducedMotion = d.reducedMotion;
    if (FONT_SCALES.includes(d.fontScale)) out.fontScale = d.fontScale; // I70
    if (typeof d.shapeCues === "boolean") out.shapeCues = d.shapeCues; // I155
    if (typeof d.music === "boolean") out.music = d.music; // I158
    if (typeof d.colorblindPreview === "boolean") out.colorblindPreview = d.colorblindPreview; // I158
    if (typeof d.slowmoHint === "boolean") out.slowmoHint = d.slowmoHint; // I158
    if (typeof d.locale === 'string' && LOCALES.includes(d.locale)) out.locale = d.locale; // ST-375
    return out;
  }

  /** Merge a partial settings object, persist, and return the merged result. */
  setSettings(partial = {}) {
    const merged = { ...this.getSettings(), ...partial };
    // re-validate merged values the same way getSettings does
    const clean = { ...DEFAULT_SETTINGS };
    if (typeof merged.volume === 'number' && isFinite(merged.volume)) clean.volume = Math.min(1, Math.max(0, merged.volume));
    if (typeof merged.sfx === 'boolean') clean.sfx = merged.sfx;
    if (merged.fx === 'high' || merged.fx === 'low' || merged.fx === 'off') clean.fx = merged.fx; // ST-224: 3-tier
    if (merged.cameraMode === 'chase' || merged.cameraMode === 'overview' || merged.cameraMode === 'cockpit') clean.cameraMode = merged.cameraMode; // ST-416 (I446)
    if (typeof merged.reducedMotion === 'boolean') clean.reducedMotion = merged.reducedMotion;
    if (FONT_SCALES.includes(merged.fontScale)) clean.fontScale = merged.fontScale; // I70
    if (typeof merged.shapeCues === "boolean") clean.shapeCues = merged.shapeCues; // I155
    if (typeof merged.music === "boolean") clean.music = merged.music; // I158
    if (typeof merged.colorblindPreview === "boolean") clean.colorblindPreview = merged.colorblindPreview; // I158
    if (typeof merged.slowmoHint === "boolean") clean.slowmoHint = merged.slowmoHint; // I158
    if (typeof merged.locale === 'string' && LOCALES.includes(merged.locale)) clean.locale = merged.locale; // ST-375
    this._write(this.settingsKey, { version: STORE_VERSION, ...clean });
    return clean;
  }

  /** @returns {Array<{score:number, wave:number, kills:number}>} top-N high scores. No timestamps: core stays deterministic (I66). */
  getHighScores() {
    const d = this._readVersioned(this.highScoresKey);
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

  /** ST-141: read the stored daily best. @returns {{key:string, value:number}|null} */
  getDailyBest() {
    const d = this._readVersioned(this.dailyBestKey);
    if (!d) return null;
    const key = typeof d.key === 'string' ? d.key : '';
    const value = Number.isFinite(d.value) ? Math.floor(d.value) : 0;
    return { key, value: Math.max(0, value) };
  }

  /**
   * ST-141: record a daily run score (per calendar-day key). Raises today's daily
   * best when higher, or rolls the day over when the key differs (a new day starts fresh).
   * @param {string} key @param {number} score
   * @returns {{newBest:boolean, value:number}}
   */
  recordDaily(key, score) {
    const s = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
    const cur = this.getDailyBest();
    if (s <= 0) return { newBest: false, value: (cur && cur.key === key) ? cur.value : 0 };
    const sameDay = cur && cur.key === key;
    const newBest = !sameDay || s > cur.value;
    if (newBest) this._write(this.dailyBestKey, { version: STORE_VERSION, key, value: s });
    return { newBest, value: newBest ? s : (cur ? cur.value : 0) };
  }

  /** I151: has the player dismissed the first-run tutorial? (dedicated key, mirrors the daily pattern). */
  getTutorialSeen() {
    const d = this._readVersioned(this.tutorialKey);
    return !!(d && d.seen === true);
  }

  /** I151: persist that the first-run tutorial has been dismissed (idempotent; returns the store write result). */
  setTutorialSeen() {
    return this._write(this.tutorialKey, { version: STORE_VERSION, seen: true });
  }

  /** ST-190: list saved replays, newest-first. Entries that fail strict decode are dropped (defensive). */
  getReplays() {
    const arr = this._read(this.replaysKey);
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const entry of arr) {
      if (entry && entry.data) {
        const d = decodeReplay(entry.data, { maxLen: CONFIG.replay.maxSteps });
        if (d.ok) out.push({ data: d.data });
      }
    }
    return out;
  }
  /** ST-190: save a (validated) replay, newest-first, capped at maxReplays. Returns {saved:bool}. */
  saveReplay(replay) {
    const d = decodeReplay(replay, { maxLen: CONFIG.replay.maxSteps });
    if (!d.ok) return { saved: false };
    const list = [{ data: d.data }, ...this.getReplays()].slice(0, this.maxReplays);
    return { saved: this._write(this.replaysKey, list) };
  }

  /** ST-457 (E64): the highest campaign level reached (1..levelCount); 0 when none/corrupt. */
  getCampaignProgress() {
    const d = this._readVersioned(this.campaignKey);
    const n = d && typeof d.level === 'number' ? Math.floor(d.level) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > levelCount()) return 0;
    return n;
  }

  /** ST-457 (E64): persist the reached campaign level - monotonic raise only, clamped 1..levelCount. */
  setCampaignProgress(level) {
    if (!Number.isFinite(level)) return this.getCampaignProgress();
    const n = Math.max(1, Math.min(levelCount(), Math.floor(level)));
    if (n <= this.getCampaignProgress()) return this.getCampaignProgress();
    return this._write(this.campaignKey, { version: STORE_VERSION, level: n }) ? n : this.getCampaignProgress();
  }
  remove(key) {
    try { this.store.remove(key); return true; } catch { return false; }
  }
}
