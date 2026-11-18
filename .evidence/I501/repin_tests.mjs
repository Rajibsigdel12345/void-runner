import fs from 'fs';
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [old, rep] of pairs) {
    const n = s.split(old).length - 1;
    if (n !== 1) { console.error('FAIL ' + file + ': expected 1 occurrence, got ' + n + ' for: ' + old.slice(0, 80)); process.exit(1); }
    s = s.replace(old, rep);
  }
  fs.writeFileSync(file, s);
  console.log('OK ' + file + ' (' + pairs.length + ' edits)');
}
edit('tests/assetGlbs.test.js', [
  ['const BUDGETS = { ship: 19000,', 'const BUDGETS = { ship: 25563,'],
  ['actual 1096/792) // I210', 'actual 1096/792) + I501 (ST-467 ship v6 real-airship remaster 19000 -> 25563, measured 25,563 t / 581,440 B; pinned tight to measurement - the asset landed 9,137 t under the 34,700 aim so the pre-registered 38,500 was not needed; future growth requires an explicit re-pin) // I210'],
  ['const MAX_FILE_BYTES = 393216; // I440', 'const MAX_FILE_BYTES = 1048576; // I501 (ST-467 ship v6) EXPLICIT re-pin: 393216 -> 1048576 (ship v6 581,440 B; spec s5 pre-registered 1,048,576; max non-ship stays boss 75.26 KB) // I440'],
  ['const SHIP_FACET = { hull: { p10: 0.5936, p50: 1.0284, p90: 1.4453 }, wings: { p10: 0.378, p50: 0.9977, p90: 1.55 } }; // I470', 'const SHIP_FACET = { hull: { p10: 0.5611, p50: 0.9108, p90: 1.3070 }, wings: { p10: 0.3869, p50: 0.9981, p90: 1.55 } }; // I501 (ST-467 ship v6) EXPLICIT re-pin: I470 hull {0.5936/1.0284/1.4453} + wings {0.378/0.9977/1.55} -> measured on the 25,563-tri GLB (.evidence/I501/facet_measure.mjs; hull 12,207t spread 0.7459 / wings 2,644t spread 1.1631; k_hull 0.60 / k_wings 0.80 value bake) // I470'],
]);
edit('tests/assetPerf.test.js', [
  ['perFileKB: 400,      // [max 375.74', 'perFileKB: 600,      // [I501 (ST-467 ship v6) EXPLICIT re-pin: 400 -> 600, measured 567.82 KB (581,440 B); max non-ship stays boss 75.26 KB] // [max 375.74'],
  ['totalTris: 36000,    // [I470 (ST-437) EXPLICIT re-pin: 30000 -> 36000, measured 31646]; I482 (ST-449): +sentry 1096t + wasp 792t; measured 34938; cap 36000 HOLDS w/ 1062 tri headroom', 'totalTris: 45000,    // [I501 (ST-467 ship v6) EXPLICIT re-pin: 36000 -> 45000, measured 43,358 (34,938 - 17,143 + 25,563); cap 45,000 HOLDS w/ 1,642 tri headroom] // [I470 (ST-437) EXPLICIT re-pin: 30000 -> 36000, measured 31646]; I482 (ST-449): +sentry 1096t + wasp 792t; measured 34,938'],
]);
console.log('ALL_REPIN_OK');
