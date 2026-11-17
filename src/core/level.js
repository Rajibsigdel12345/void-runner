// ST-452 (I485, E64): linear level model. Pure core - no three, no DOM, no RNG.
// Derived view over CONFIG.levels (3 levels x 4 zones, E64 data). `distance` is
// the forward arc length along the flight path (arena units - same space as
// arena.radius 26; ship maxSpeed 14 u/s). The ST-453 level driver supplies the
// distance and consumes these queries. MODEL ONLY: nothing in the simulation
// imports this in ST-452, so causal + playframe stay EXACT by construction.
import { CONFIG } from './config.js';

const clamp1 = (i, len) => { let n = Math.floor(Number(i)); if (!isFinite(n)) n = 1; return Math.max(1, Math.min(len, n)); };

export function levelRows(cfg = CONFIG) { return (cfg.levels && cfg.levels.levels) || []; }
export function levelCount(cfg = CONFIG) { return levelRows(cfg).length; }
export function levelRow(level, cfg = CONFIG) { const rows = levelRows(cfg); return rows.length ? rows[clamp1(level, rows.length) - 1] : null; }
export function zoneRows(level, cfg = CONFIG) { const r = levelRow(level, cfg); return (r && r.zones) || []; }
export function zoneCount(level, cfg = CONFIG) { return zoneRows(level, cfg).length; }
export function zoneRow(level, zone, cfg = CONFIG) { const zs = zoneRows(level, cfg); return zs.length ? zs[clamp1(zone, zs.length) - 1] : null; }

/** Total forward length of `level` (sum of zone lengths). */
export function levelLength(level, cfg = CONFIG) { return zoneRows(level, cfg).reduce((a, z) => a + z.length, 0); }
/** Total forward length of the whole campaign. */
export function campaignLength(cfg = CONFIG) { let d = 0; for (let l = 1; l <= levelCount(cfg); l++) d += levelLength(l, cfg); return d; }
/** Forward distance where `level` begins (0 for level 1). */
export function levelStartDistance(level, cfg = CONFIG) { let d = 0; for (let l = 1; l < level; l++) d += levelLength(l, cfg); return d; }
/** Forward distance where zone `zone` of `level` begins (level-relative). */
export function zoneStartDistance(level, zone, cfg = CONFIG) { const zs = zoneRows(level, cfg); let d = 0; for (let z = 1; z < zone; z++) d += zs[clamp1(z, zs.length) - 1].length; return d; }

/**
 * Forward distance within a level -> zone location (a zone takes over the
 * moment its start distance is reached; the last zone holds its own end).
 * @returns {{level:number, zone:number, zoneLocal:number, zoneFrac:number, levelFrac:number, levelLength:number}}
 * `distance` clamps to [0, levelLength]; NaN / out-of-range input never throws.
 */
export function zoneAtDistance(level, distance, cfg = CONFIG) {
  const len = levelLength(level, cfg);
  const d = Math.max(0, Math.min(len, isFinite(Number(distance)) ? Number(distance) : 0));
  const zs = zoneRows(level, cfg);
  if (!zs.length) return { level, zone: 0, zoneLocal: 0, zoneFrac: 1, levelFrac: 1, levelLength: len };
  let acc = 0;
  for (let z = 0; z < zs.length; z++) {
    const zl = zs[z].length;
    if (d < acc + zl || z === zs.length - 1) {
      const zoneLocal = Math.max(0, Math.min(zl, d - acc));
      return { level, zone: z + 1, zoneLocal, zoneFrac: zl > 0 ? zoneLocal / zl : 1, levelFrac: len > 0 ? d / len : 1, levelLength: len };
    }
    acc += zl;
  }
  return { level, zone: zs.length, zoneLocal: zs[zs.length - 1].length, zoneFrac: 1, levelFrac: 1, levelLength: len };
}

/** The boss stands at the level end: forward distance + boss kind id. */
export function bossDistance(level, cfg = CONFIG) { return levelLength(level, cfg); }
export function bossKind(level, cfg = CONFIG) { const r = levelRow(level, cfg); return r ? r.boss : ''; }

/** Checkpoints: one per zone with `checkpointAt` (fraction within [0,1]; 0 = zone start). */
export function checkpointsForLevel(level, cfg = CONFIG) {
  const out = [];
  let d = 0;
  zoneRows(level, cfg).forEach((z, i) => {
    if (z.checkpointAt != null) {
      const f = Math.max(0, Math.min(1, isFinite(Number(z.checkpointAt)) ? Number(z.checkpointAt) : 0));
      out.push({ zone: i + 1, distance: d + f * z.length });
    }
    d += z.length;
  });
  return out;
}
/** Furthest checkpoint distance at or before `d` (level-relative), or null if none yet. */
export function lastCheckpointAt(level, d, cfg = CONFIG) {
  const ds = isFinite(Number(d)) ? Number(d) : 0;
  let best = null;
  for (const c of checkpointsForLevel(level, cfg)) if (c.distance <= ds + 1e-9) best = c.distance;
  return best;
}
/** A level clears when the ship reaches its end distance (boss line). */
export function isLevelCleared(level, d, cfg = CONFIG) { const ds = isFinite(Number(d)) ? Number(d) : 0; return ds >= levelLength(level, cfg) - 1e-9; }
export function isFinalLevel(level, cfg = CONFIG) { const n = levelCount(cfg); return n > 0 && level >= n; }
/** Victory: the FINAL level has been cleared (campaign complete). */
export function isCampaignComplete(level, d, cfg = CONFIG) { return isFinalLevel(level, cfg) && isLevelCleared(level, d, cfg); }

// i18n key convention (ST-452): 'level.name.l<n>' / 'level.zone.l<n>z<m>'.
// The config `name` fields are the en source of truth (pinned against
// STRINGS.en in tests/level.test.js); zh/ja display strings live in strings.js.
export function levelNameKey(level) { return 'level.name.l' + level; }
export function zoneNameKey(level, zone) { return 'level.zone.l' + level + 'z' + zone; }
