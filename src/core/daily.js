// ST-140: daily seeded run. A stable, PURE derivation of a 32-bit seed from a calendar
// day so every player on the same day shares an identical run (comparable daily run).
// DOM-free: all functions take explicit date components so tests can pin them.
import { RNG } from './rng.js';
import { CONFIG } from './config.js'; // ST-228: the default salt is single-sourced from config.daily.salt (namespaced daily scheme)

/** FNV-1a 32-bit over a string -> unsigned 32-bit int. Deterministic, no crypto. */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Zero-padded calendar key 'YYYY-MM-DD'. month is 1-12, day is 1-31. */
export function dailyKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return String(year) + '-' + m + '-' + d;
}

/** Stable 32-bit seed for a calendar day. Same (y, m, d, salt) -> same seed. */
export function dailySeed(year, month, day, salt = CONFIG.daily.salt) {
  return fnv1a(salt + ':' + dailyKey(year, month, day));
}

/** An RNG for a calendar day (pure: pass explicit components). */
export function dailyRng(year, month, day, salt = CONFIG.daily.salt) {
  return new RNG(dailySeed(year, month, day, salt));
}

/** From a JS Date (UI convenience; NOT the deterministic test path).
 *  Returns { key, seed } for the local calendar day of the date. */
export function dailyForDate(date, salt = CONFIG.daily.salt) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return { key: dailyKey(y, m, d), seed: dailySeed(y, m, d, salt) };
}
