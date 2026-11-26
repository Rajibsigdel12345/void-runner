// I593 (ST-560) THE SWAP - re-pin tests WITH MEASUREMENT (byte-exact, count===1 asserts)
const fs = require('node:fs');
function patch(file, pairs) {
  let s = fs.readFileSync(file, 'latin1');
  for (const [old, neu, tag] of pairs) {
    const n = s.split(old).length - 1;
    if (n !== 1) { console.error('FAIL ' + file + ' [' + tag + '] count=' + n); process.exit(1); }
    s = s.replace(old, neu);
  }
  fs.writeFileSync(file, s, 'latin1');
  console.log('PATCHED ' + file + ' (' + pairs.length + ' replacements)');
}
const G = 'tests/assetGlbs.test.js';
patch(G, [
  // BUDGETS: drone/warden re-pin + stinger/flyer keys
  ['drone: 1800, arenaRing: 120, warden: 1800, chunk: 60',
   'drone: 2080, arenaRing: 120, warden: 2290, chunk: 60, stinger: 2396, flyer: 2264', 'BUDGETS keys'],
  ['span 4.0125 / len 2.7160 hold the I454 windows; .evidence/I587/repin_measure587b.mjs)',
   'span 4.0125 / len 2.7160 hold the I454 windows; .evidence/I587/repin_measure587b.mjs) // I593 (ST-560 E84) legacy-4 v2 RE-PIN WITH MEASUREMENT: drone 1800 -> 2080 / warden 1800 -> 2290; stinger 2396 / flyer 2264 keys ADDED (measure593.cjs post-GLB: set 6,574 -> 9,030 t)', 'BUDGETS comment'],
  // drone test header
  ['// 118,828 B / 1,516 t; extents x 2.1000 / y 1.1421 / z 1.7000 (raw vertex space).',
   '// 118,828 B / 1,516 t; extents x 2.1000 / y 1.1421 / z 1.7000 (raw vertex space).\r\n// I593 (ST-560 E84) v2 boomerang SWAP re-pin WITH measurement (measure593.cjs): 52,284 B / 2,080 t;\r\n// extents x 2.0857 / y 1.1354 / z 1.7000 (raw vertex space; y/z swapped vs the I508 build orientation).', 'drone header'],
  ["assert.ok(s.totalTris <= BUDGETS.drone, 'drone tris ' + s.totalTris + ' <= 1800 (E68 legacy-4 cap)');",
   "assert.ok(s.totalTris <= BUDGETS.drone, 'drone tris ' + s.totalTris + ' <= 2080 (I593 v2 re-pin)');", 'drone cap msg'],
  ["assert.ok(s.totalTris >= 1400, 'drone tris ' + s.totalTris + ' >= 1400 (E68 legacy-4 aim - no silent simplification)');",
   "assert.ok(s.totalTris >= 1516, 'drone tris ' + s.totalTris + ' >= 1516 (I508 legacy-4 measured floor - no silent simplification)');", 'drone floor'],
  ["assert.ok(Math.abs(e.x - 2.10) / 2.10 <= 0.10, 'drone X extent ' + e.x.toFixed(3) + ' ~ 2.10 (I508 pin)');",
   "assert.ok(Math.abs(e.x - 2.0857) / 2.0857 <= 0.10, 'drone X extent ' + e.x.toFixed(3) + ' ~ 2.0857 (I593 v2 pin)');", 'drone ex'],
  ["assert.ok(Math.abs(e.y - 1.1421) / 1.1421 <= 0.10, 'drone Y extent ' + e.y.toFixed(3) + ' ~ 1.1421 (I508 pin)');",
   "assert.ok(Math.abs(e.y - 1.1354) / 1.1354 <= 0.10, 'drone Y extent ' + e.y.toFixed(3) + ' ~ 1.1354 (I593 v2 pin)');", 'drone ey'],
  ["assert.ok(Math.abs(e.z - 1.70) / 1.70 <= 0.10, 'drone Z extent ' + e.z.toFixed(3) + ' ~ 1.70 (I508 pin)');",
   "assert.ok(Math.abs(e.z - 1.7000) / 1.7000 <= 0.10, 'drone Z extent ' + e.z.toFixed(3) + ' ~ 1.7000 (I593 v2 pin)');", 'drone ez'],
  // ENEMY_FACET re-pins
  ['  drone:   { VR_Drone:        { p10: 0.30,   p50: 0.5332, p90: 0.6467 } }, // I508 (ST-474) per-prim re-pin WITH measurement',
   '  drone:   { VR_Drone:        { p10: 0.5167, p50: 1.0186, p90: 1.4275 } }, // I593 (ST-560 E84) v2 re-pin WITH measurement (I508: 0.30/0.5332/0.6467)', 'facets drone'],
  ['  stinger: { VR_Stinger_Body: { p10: 0.34,   p50: 0.4504, p90: 0.579 },',
   '  stinger: { VR_Stinger_Body: { p10: 0.55,   p50: 0.5573, p90: 1.00 }, // I593 v2 re-pin WITH measurement (I508: 0.34/0.4504/0.579)', 'facets stinger'],
  ['             VR_Flyer_Dome:   { p10: 0.92,   p50: 0.92,   p90: 0.92 } },\r\n};\r\nfunction enemyFacetLumasPrim',
   '             VR_Flyer_Dome:   { p10: 0.94,   p50: 0.94,   p90: 0.94 } }, // I593 v2 re-pin WITH measurement (I508: 0.92 flat)\r\n};\r\nconst ENEMY_DOMAIN_MAX = { drone: 1.55, stinger: 1.00, flyer: 1.00 }; // I593 (ST-560 E84) COLOR_0 domain re-pin WITH MEASUREMENT (measure593.cjs): drone v2 1.0-centered bright-bake accents reach 1.55 (I591 P-gate approved); stinger/flyer v2 stay within 1.00. I508 domain was [0.25, 1.00] for all three.\r\nconst LEGACY_FLOOR = { drone: 1516, stinger: 1732, flyer: 1770 }; // I593: I508 legacy-4 measured tri floors (no silent simplification below the superseded ships)\r\nfunction enemyFacetLumasPrim', 'facets flyer-dome + consts'],
  ['  flyer:   { VR_Flyer_Body:   { p10: 0.3823, p50: 0.5741, p90: 0.6275 },',
   '  flyer:   { VR_Flyer_Body:   { p10: 0.55,   p50: 0.6421, p90: 1.00 }, // I593 v2 re-pin WITH measurement (I508: 0.3823/0.5741/0.6275)', 'facets flyer'],
  // enemy facet test: domain + tri asserts
  ["assert.ok(r >= 0.25 && r <= 1.00, name + ' COLOR_0 in [0.25,1.00] I508 value domain at ' + i + ': ' + r.toFixed(3));",
   "assert.ok(r >= 0.25 && r <= ENEMY_DOMAIN_MAX[name], name + ' COLOR_0 in [0.25,' + ENEMY_DOMAIN_MAX[name] + '] I508->I593 value domain at ' + i + ': ' + r.toFixed(3));", 'domain assert'],
  ["    const { buf, json, binOff } = parseGlb(name + '.glb');\r\n    let colorPrims = 0;",
   "    const { buf, json, binOff } = parseGlb(name + '.glb');\r\n    const st = meshStats({ buf, json, binOff });\r\n    assert.ok(st.totalTris <= BUDGETS[name], name + ' tris ' + st.totalTris + ' <= ' + BUDGETS[name] + ' (I593 v2 re-pin)');\r\n    assert.ok(st.totalTris >= LEGACY_FLOOR[name], name + ' tris ' + st.totalTris + ' >= ' + LEGACY_FLOOR[name] + ' (I508 legacy-4 measured floor - no silent simplification)');\r\n    let colorPrims = 0;", 'tri asserts'],
  // WARDEN_FACET re-pins
  ['  VR_Warden_Armor: { p10: 0.38, p50: 0.38, p90: 0.673 },  // I508 (ST-474): side slabs flat 0.38, top slab higher (pre-I508 0.5945/1.0/1.25)',
   '  VR_Warden_Armor: { p10: 0.5149, p50: 0.9351, p90: 1.3726 },  // I593 (ST-560 E84) v2 re-pin WITH measurement (I508: 0.38/0.38/0.673)', 'warden facet armor'],
  ['  VR_Warden_Hull:  { p10: 0.28, p50: 0.4737, p90: 0.70 }, // I508 (ST-474): hex hull + merged core weak spot (pre-I508 0.703/1.1287/1.25)',
   '  VR_Warden_Hull:  { p10: 0.6524, p50: 0.9697, p90: 1.3456 }, // I593 v2 re-pin WITH measurement (I508: 0.28/0.4737/0.70)', 'warden facet hull'],
  // warden test pins
  ["assert.ok(buf.length <= 96 * 1024, 'warden.glb under 96 KB (I508 re-pin 40 -> 96 KB; measured 91,064 B)');",
   "assert.ok(buf.length <= 96 * 1024, 'warden.glb under 96 KB (I508 re-pin 40 -> 96 KB; I593 v2 measured 64,448 B)');", 'warden byte msg'],
  ["assert.ok(rv >= 0.25 && rv <= 1.00, mn + ' COLOR_0 in [0.25,1.00] I508 value domain at ' + i + ': ' + rv.toFixed(3));",
   "assert.ok(rv >= 0.25 && rv <= 1.55, mn + ' COLOR_0 in [0.25,1.55] I593 v2 value domain at ' + i + ': ' + rv.toFixed(3));", 'warden domain'],
  ["assert.ok(s.totalTris <= BUDGETS.warden, 'warden tris ' + s.totalTris + ' <= 1800 (E68 legacy-4 cap)');",
   "assert.ok(s.totalTris <= BUDGETS.warden, 'warden tris ' + s.totalTris + ' <= 2290 (I593 v2 re-pin)');", 'warden cap msg'],
  ["assert.ok(s.totalTris >= 1400, 'warden tris ' + s.totalTris + ' >= 1400 (E68 legacy-4 aim - no silent simplification)');",
   "assert.ok(s.totalTris >= 1556, 'warden tris ' + s.totalTris + ' >= 1556 (I508 legacy-4 measured floor - no silent simplification)');", 'warden floor'],
  ['  // I508 re-pins WITH measurement (supersede the I220/I289 procedural-plate pins): hull = 6-gon\r\n  // hex hull + front core weak spot (dome + spikes + brackets merged) -> maxRadius 2.1848\r\n  // (~r*1.285; pre-I508 the r*1.25 spike cap); armor = three 4.8-long slabs -> maxRadius 3.4111\r\n  // (keeps the union bbox ~3.99 class; pre-I508 ~r*1.55 = 2.635).',
   '  // I593 (ST-560 E84) v2 re-pins WITH measurement (supersede I508): hull = hex fortress + parapet +\r\n  // turret -> maxRadius 2.4790 (~r*1.458); armor = 3 mounted bracketed slabs -> maxRadius 2.3841\r\n  // (v3 slabs sit ON the hull surface - mounted, not protruding; I508 slabs protruded to 3.4111;\r\n  // the in-code spike collar at r*1.35 = 2.295 now embeds in the hull mass - documented residual).', 'warden radii comment'],
  ["assert.ok(Math.abs(hull.maxRadius - 2.1848) / 2.1848 <= 0.10, 'hull max radius ' + hull.maxRadius.toFixed(3) + ' ~ 2.1848 (I508 pin)');",
   "assert.ok(Math.abs(hull.maxRadius - 2.4790) / 2.4790 <= 0.10, 'hull max radius ' + hull.maxRadius.toFixed(3) + ' ~ 2.4790 (I593 v2 pin)');", 'warden hull r'],
  ["assert.ok(Math.abs(armor.maxRadius - 3.4111) / 3.4111 <= 0.10, 'armor outer radius ' + armor.maxRadius.toFixed(3) + ' ~ 3.4111 (I508 pin)');",
   "assert.ok(Math.abs(armor.maxRadius - 2.3841) / 2.3841 <= 0.10, 'armor outer radius ' + armor.maxRadius.toFixed(3) + ' ~ 2.3841 (I593 v2 pin)');", 'warden armor r'],
]);
const P = 'tests/assetPerf.test.js';
patch(P, [
  ['totalFilesKB: 4563,  // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 3940 -> 4563: +662,884 B ship v8 (740,012 -> 1,402,896 B); measured 4,562.76 KB (4,672,268 B); cap = the AGENTS contract 4,563 KiB (4,672,268 B) so the measured IS the cap (headroom 244 B); prior I561: 3,915.41 KB (4,009,384 B)]',
   'totalFilesKB: 4328,  // [I593 (ST-560 E84 legacy-4 v2 swap) RE-PIN WITH MEASUREMENT 4563 -> 4328: -241,108 B legacy-4 v2 (482,704 -> 241,596 B); measured 4,327.30 KiB (4,431,160 B); cap = the AGENTS contract 4,328 KiB (4,431,160 B) so the measured IS the cap; prior I587: 4,562.76 KiB (4,672,268 B)]', 'perf filesKB'],
  ['totalGeoKB: 4500,    // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 3870 -> 4500: +662,874 B ship v8 geometry (3,940,446 -> 4,603,320 B); measured 4,495.43 KB; headroom 4.57 KB; prior I561: 3,848.09 KB (3,940,446 B)]',
   'totalGeoKB: 4261,    // [I593 (ST-560 E84 legacy-4 v2 swap) RE-PIN WITH MEASUREMENT 4500 -> 4261: -241,044 B v2 geometry (4,603,320 -> 4,362,276 B); measured 4,260.04 KiB; headroom 0.96 KB; prior I587: 4,495.43 KB (4,603,320 B)]', 'perf geoKB'],
  ['totalTris: 120732,    // [I587 (ST-554 E83 ship v8 swap) RE-PIN WITH MEASUREMENT 91,050 -> 120,732: +29,755 t ship v8 (32,499 -> 62,254 t post-GLB-import); measured 120,732 t; cap = the AGENTS contract 120,732 t (the measured IS the cap); prior I561: 90,977 t]',
   'totalTris: 123188,    // [I593 (ST-560 E84 legacy-4 v2 swap) RE-PIN WITH MEASUREMENT 120,732 -> 123,188: +2,456 t legacy-4 v2 (6,574 -> 9,030 t); measured 123,188 t; cap = the AGENTS contract 123,188 t (the measured IS the cap); prior I587: 120,732 t]', 'perf tris'],
]);
const A = 'AGENTS.md';
patch(A, [
  ['Art assets: 34 Blender-made GLBs in assets/ (4,672,268 B / 120,732 tris (I587/ST-554 E83 swap WITH MEASUREMENT; prior I561/ST-527: 4,009,384 B / 90,977 t), cap 4,563 KiB (4,672,268 B) / 120,732 t):',
   'Art assets: 34 Blender-made GLBs in assets/ (4,431,160 B / 123,188 tris (I593/ST-560 E84 legacy-4 v2 swap WITH MEASUREMENT; prior I587/ST-554 E83: 4,672,268 B / 120,732 t), cap 4,328 KiB (4,431,160 B) / 123,188 t):', 'agents assets head'],
  ['enemy fleet E68 real-spaceship remaster (I508 legacy-4: stinger 1,732 / drone 1,516 / warden 1,556 / flyer 1,770 t; I509 remaster-4: hunter 3,366 / gunship v2 2,906 (I536) / sentry 2,934 / wasp 4,020 t; 8 ships 19,490 t;',
   'enemy fleet E68 real-spaceship remaster (I593/ST-560 E84 legacy-4 v2 remaster: drone 2,080 / stinger 2,396 / warden 2,290 / flyer 2,264 t (I591/I592 builds; legacy I508 1,516/1,732/1,556/1,770 t superseded, backed up .evidence/I593/backup/); I509 remaster-4: hunter 3,366 / gunship v2 2,906 (I536) / sentry 2,934 / wasp 4,020 t; 8 ships 22,256 t;', 'agents fleet line'],
]);
console.log('ALL PATCHES APPLIED');