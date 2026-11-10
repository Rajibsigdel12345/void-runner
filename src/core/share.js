// ST-142: shareable result codec. Pure, DOM-free. Encodes a finished run's
// result (score, wave, seed, kills) into a compact URL-safe string (lowercase
// base36 + dots + a 2-char FNV-1a integrity checksum), and decodes it back.
// The seed is included so a shared result is REPRODUCIBLE: reseed the World to
// that seed to replay the identical run (verifiable score claims).
import { CONFIG } from './config.js';
import { fnv1a } from './daily.js';

const MAGIC = (CONFIG && CONFIG.share && typeof CONFIG.share.magic === 'string' && CONFIG.share.magic) || 'vr1';

function toB36(n) { return Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)).toString(36); }

function clampInt(v, min, max) {
  const n = Number.isFinite(v) ? Math.floor(v) : min;
  return Math.min(max, Math.max(min, n));
}

/** Encode a finished run into a compact, URL-safe share string. */
export function encodeResult(result = {}, magic = MAGIC) {
  const seed = clampInt(result.seed, 0, 0xffffffff);
  const score = clampInt(result.score, 0, 0x7fffffff);
  const wave = clampInt(result.wave, 1, 0x7fffffff);
  const kills = clampInt(result.kills, 0, 0x7fffffff);
  const body = [magic, toB36(seed), toB36(score), toB36(wave), toB36(kills)].join('.');
  const ck = (fnv1a(body) % 1296).toString(36).padStart(2, '0');
  return body + '.' + ck;
}

/** Decode a share string. @returns {{ok:boolean, seed?:number, score?:number, wave?:number, kills?:number}} */
export function decodeResult(str, magic = MAGIC) {
  if (typeof str !== 'string') return { ok: false };
  const parts = str.split('.');
  if (parts.length !== 6) return { ok: false };
  if (parts[0] !== magic) return { ok: false };
  if (!/^[0-9a-z.]+$/.test(str)) return { ok: false }; // base36 + dots only (rejects case/symbols/spaces)
  const body = parts.slice(0, 5).join('.');
  const ck = (fnv1a(body) % 1296).toString(36).padStart(2, '0');
  if (ck !== parts[5]) return { ok: false };
  const seed = parseInt(parts[1], 36);
  const score = parseInt(parts[2], 36);
  const wave = parseInt(parts[3], 36);
  const kills = parseInt(parts[4], 36);
  if ([seed, score, wave, kills].some((v) => !Number.isFinite(v))) return { ok: false };
  if (seed < 0 || seed > 0xffffffff) return { ok: false };
  if (score < 0 || wave < 1 || kills < 0) return { ok: false };
  return { ok: true, seed, score, wave, kills };
}
