// ST-452 (I485, E64): src/core/level.js + CONFIG.levels - the linear level model.
// Pure-model tests: structure, forward-distance -> zone, checkpoints,
// clear/victory, i18n parity (config name = en source of truth), determinism.
// No simulation reads CONFIG.levels in ST-452 -> causal + playframe stay EXACT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/core/config.js';
import { STRINGS, LOCALES } from '../src/core/strings.js';
import {
  levelCount, levelRow, levelLength, campaignLength, levelStartDistance, zoneCount, zoneRow,
  zoneStartDistance, zoneAtDistance, bossDistance, bossKind, checkpointsForLevel, lastCheckpointAt,
  isLevelCleared, isFinalLevel, isCampaignComplete, levelNameKey, zoneNameKey
} from '../src/core/level.js';

const ENEMIES = new Set(['drone', 'mine', 'stinger', 'flyer', 'hunter', 'gunship', 'sentry', 'wasp', 'pod', 'phantom', 'hauler', 'bulwark', 'rock']); // ST-486 (E69): L4 mix vocabulary
const TARGETS = new Set(['golden', 'shielded', 'rapid', 'spread', 'shield', 'magnet', 'overdrive', 'slowmo', 'pod']);
const HAZARDS = new Set(['calm', 'moderate', 'dense', 'gauntlet']);
const phSet = (v) => [...String(v).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort().join(',');

test('level: structure - 5 levels x 4 zones, lengths 330/370/400/420/440, campaign 1960 (ST-517 E75)', () => {
  assert.equal(levelCount(), 5); // ST-517 (E75): +L5
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => zoneCount(l)), [4, 4, 4, 4, 4]); // ST-517: +L5
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => levelLength(l)), [330, 370, 400, 420, 440]); // ST-517: +L5
  assert.equal(campaignLength(), 1960); // ST-517 (E75): +L5 (440)
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => levelStartDistance(l)), [0, 330, 700, 1100, 1520]); // ST-517: +L5
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => bossKind(l)), ['monolith', 'splicer', 'monolith-prime', 'abyssal', 'archon']); // ST-517: +L5
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => bossDistance(l)), [330, 370, 400, 420, 440]); // ST-517: +L5
});

test('level: every zone carries the full ST-452 field set with valid vocabulary', () => {
  for (let l = 1; l <= levelCount(); l++) {
    for (let z = 1; z <= zoneCount(l); z++) {
      const row = zoneRow(l, z);
      assert.ok(typeof row.name === 'string' && row.name.length > 0, 'L' + l + 'Z' + z + ' name');
      assert.ok(Number.isFinite(row.length) && row.length > 0, 'L' + l + 'Z' + z + ' length');
      assert.ok(typeof row.paletteId === 'string' && row.paletteId.length > 0, 'L' + l + 'Z' + z + ' paletteId');
      assert.ok(HAZARDS.has(row.hazardProfile), 'L' + l + 'Z' + z + ' hazardProfile ' + row.hazardProfile);
      assert.ok(Array.isArray(row.enemyMix) && row.enemyMix.length >= 1, 'L' + l + 'Z' + z + ' enemyMix');
      for (const e of row.enemyMix) assert.ok(ENEMIES.has(e), 'L' + l + 'Z' + z + ' enemy ' + e);
      assert.ok(Array.isArray(row.optionalTargets), 'L' + l + 'Z' + z + ' optionalTargets');
      for (const o of row.optionalTargets) assert.ok(TARGETS.has(o), 'L' + l + 'Z' + z + ' target ' + o);
      assert.ok(row.checkpointAt != null && Number.isFinite(row.checkpointAt) && row.checkpointAt >= 0 && row.checkpointAt <= 1, 'L' + l + 'Z' + z + ' checkpointAt');
    }
  }
});

test('level: palette references resolve; palette shape matches the E57 stage-theme contract', () => {
  const pals = CONFIG.levels.palettes;
  for (let l = 1; l <= levelCount(); l++) {
    for (let z = 1; z <= zoneCount(l); z++) {
      const id = zoneRow(l, z).paletteId;
      assert.ok(id in pals, 'palette ' + id + ' missing');
      const p = pals[id];
      if (p == null) continue; // null = arena identity (drift-1, E57 stage-1 precedent)
      for (const k of ['sky', 'stars', 'floor', 'grid', 'accent']) {
        assert.ok(Number.isInteger(p[k]) && p[k] >= 0 && p[k] <= 0xffffff, id + '.' + k);
      }
    }
  }
  assert.equal(pals['drift-1'], null);
  assert.equal(Object.keys(CONFIG.levels.hazardProfiles).length, HAZARDS.size);
  for (const h of HAZARDS) { const p = CONFIG.levels.hazardProfiles[h]; for (const k of ['rockRate', 'mineRate', 'enemyRate']) assert.ok(p[k] >= 0, h + '.' + k); }
});

test('level: checkpoints - one per zone at zone starts (fraction 0)', () => {
  assert.deepEqual(checkpointsForLevel(1), [{ zone: 1, distance: 0 }, { zone: 2, distance: 80 }, { zone: 3, distance: 170 }, { zone: 4, distance: 270 }]);
  assert.deepEqual(checkpointsForLevel(2), [{ zone: 1, distance: 0 }, { zone: 2, distance: 90 }, { zone: 3, distance: 190 }, { zone: 4, distance: 300 }]);
  assert.deepEqual(checkpointsForLevel(3), [{ zone: 1, distance: 0 }, { zone: 2, distance: 90 }, { zone: 3, distance: 200 }, { zone: 4, distance: 320 }]);
  assert.deepEqual(checkpointsForLevel(4), [{ zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 210 }, { zone: 4, distance: 330 }]); // ST-486 (E69)
  assert.deepEqual(checkpointsForLevel(5), [{ zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 220 }, { zone: 4, distance: 350 }]); // ST-517 (E75)
});

test('level: zoneAtDistance - zone takes over at its start distance; last zone holds its end', () => {
  assert.deepEqual(zoneAtDistance(1, 0), { level: 1, zone: 1, zoneLocal: 0, zoneFrac: 0, levelFrac: 0, levelLength: 330 });
  assert.equal(zoneAtDistance(1, 79.999).zone, 1);
  assert.deepEqual({ z: zoneAtDistance(1, 80).zone, l: zoneAtDistance(1, 80).zoneLocal }, { z: 2, l: 0 });
  assert.equal(zoneAtDistance(1, 169.999).zone, 2);
  assert.equal(zoneAtDistance(1, 170).zone, 3);
  assert.equal(zoneAtDistance(1, 270).zone, 4);
  const end = zoneAtDistance(1, 330);
  assert.deepEqual({ zone: end.zone, zoneLocal: end.zoneLocal, zoneFrac: end.zoneFrac }, { zone: 4, zoneLocal: 60, zoneFrac: 1 });
});

test('level: zoneAtDistance clamps - negative, NaN, and beyond-campaign input never throw', () => {
  assert.deepEqual({ zone: zoneAtDistance(1, -5).zone, local: zoneAtDistance(1, -5).zoneLocal }, { zone: 1, local: 0 });
  assert.deepEqual({ zone: zoneAtDistance(3, NaN).zone, local: zoneAtDistance(3, NaN).zoneLocal }, { zone: 1, local: 0 });
  const over = zoneAtDistance(3, 9999);
  assert.deepEqual({ zone: over.zone, zoneLocal: over.zoneLocal, levelFrac: over.levelFrac }, { zone: 4, zoneLocal: 80, levelFrac: 1 });
});

test('level: zoneFrac / levelFrac are exact fractions of forward distance', () => {
  assert.equal(zoneAtDistance(1, 40).zoneFrac, 0.5);          // mid zone 1
  assert.equal(zoneAtDistance(1, 165).levelFrac, 0.5);         // mid level
  assert.equal(zoneAtDistance(2, 185).zoneLocal, 95);          // 5 into zone 2 (starts 90)
});

test('level: lastCheckpointAt - furthest checkpoint at or before d', () => {
  assert.equal(lastCheckpointAt(1, 60), 0);
  assert.equal(lastCheckpointAt(1, 80), 80);
  assert.equal(lastCheckpointAt(1, 269.9), 170);
  assert.equal(lastCheckpointAt(1, 330), 270);
  assert.equal(lastCheckpointAt(2, 0), 0);
  assert.equal(lastCheckpointAt(3, 100), 90);
});

test('level: clear / final / victory logic', () => {
  assert.equal(isLevelCleared(1, 329.9999), false);
  assert.equal(isLevelCleared(1, 330), true);
  assert.equal(isFinalLevel(3), false); // ST-486 (E69): L3 is no longer final
  assert.equal(isFinalLevel(4), false); // ST-517 (E75): L5 is final now
  assert.equal(isFinalLevel(5), true);
  assert.equal(isFinalLevel(2), false);
  assert.equal(isCampaignComplete(1, 330), false); // cleared, but not final
  assert.equal(isCampaignComplete(3, 399), false);
  assert.equal(isCampaignComplete(3, 400), false); // ST-486 (E69): L3 cleared is not campaign-complete
  assert.equal(isCampaignComplete(4, 419.9999), false);
  assert.equal(isCampaignComplete(4, 420), false); // ST-517 (E75): L4 cleared is not campaign-complete
  assert.equal(isCampaignComplete(5, 439.9999), false);
  assert.equal(isCampaignComplete(5, 440), true);
});

test('level: i18n parity - config name = STRINGS.en, zh/ja complete, structural keys 3-locale', () => {
  for (let l = 1; l <= levelCount(); l++) {
    const kL = levelNameKey(l);
    assert.equal(STRINGS.en[kL], levelRow(l).name, kL + ' config name = en truth');
    for (let z = 1; z <= zoneCount(l); z++) {
      const kZ = zoneNameKey(l, z);
      assert.equal(STRINGS.en[kZ], zoneRow(l, z).name, kZ + ' config name = en truth');
      for (const loc of LOCALES) assert.ok(typeof STRINGS[loc][kZ] === 'string' && STRINGS[loc][kZ].length > 0, loc + ' ' + kZ);
    }
    for (const loc of LOCALES) assert.ok(typeof STRINGS[loc][kL] === 'string' && STRINGS[loc][kL].length > 0, loc + ' ' + kL);
  }
  const STRUCT = ['level.intro', 'level.clear', 'level.boss_warning', 'level.checkpoint', 'level.hud_line', 'level.continue'];
  for (const loc of LOCALES) for (const k of STRUCT) assert.ok(typeof STRINGS[loc][k] === 'string' && STRINGS[loc][k].length > 0, loc + ' ' + k);
  assert.equal(phSet(STRINGS.en['level.intro']), 'n,name');
  assert.equal(phSet(STRINGS.en['level.hud_line']), 'n,zone');
  for (const loc of LOCALES) {
    assert.equal(phSet(STRINGS[loc]['level.intro']), 'n,name', loc + ' level.intro placeholders');
    assert.equal(phSet(STRINGS[loc]['level.hud_line']), 'n,zone', loc + ' level.hud_line placeholders');
  }
});

test('level: determinism - repeated queries return identical results', () => {
  assert.deepEqual(zoneAtDistance(2, 150), zoneAtDistance(2, 150));
  assert.deepEqual(checkpointsForLevel(3), checkpointsForLevel(3));
  assert.equal(zoneStartDistance(3, 3), 200);
});

test('level: empty-config guard - no throw, sane fallbacks', () => {
  const empty = { levels: { levels: [] } };
  assert.equal(levelCount(empty), 0);
  assert.equal(levelRow(1, empty), null);
  assert.equal(levelLength(1, empty), 0);
  assert.equal(zoneAtDistance(1, 10, empty).zone, 0);
  assert.deepEqual(checkpointsForLevel(1, empty), []);
  assert.equal(isFinalLevel(1, empty), false);
});
