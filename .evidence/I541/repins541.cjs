// I541 (ST-507, E73): asset test re-pins WITH MEASUREMENT (latin1 byte-preserving, NOT FOUND/NOT UNIQUE guards).
const fs = require('fs');
const path = require('path');
const R = (p) => path.join(__dirname, '..', '..', p);
const changes = {};
function rep(rel, oldStr, newStr) {
  const f = R(rel);
  let s = (changes[rel] !== undefined) ? changes[rel] : fs.readFileSync(f, 'latin1');
  const first = s.indexOf(oldStr);
  if (first === -1) { console.error('NOT FOUND in ' + rel + ': ' + oldStr.slice(0, 60) + '...'); process.exit(1); }
  if (s.indexOf(oldStr, first + 1) !== -1) { console.error('NOT UNIQUE in ' + rel + ': ' + oldStr.slice(0, 60) + '...'); process.exit(1); }
  changes[rel] = s.slice(0, first) + newStr + s.slice(first + oldStr.length);
  console.log('OK ' + rel + ': ' + oldStr.slice(0, 44).replace(/\n/g, ' ') + ' ...');
}
// ---- assetGlbs.test.js (CRLF + BOM) ----
rep('tests/assetGlbs.test.js',
  'ship: 25563, L: 3200',
  'ship: 32499, L: 3200');
rep('tests/assetGlbs.test.js',
  'hauler: 3920 }; // + I482 (ST-449 sentry/wasp caps',
  'hauler: 3920 }; // I541 (ST-507 E73 ship v7) ship 25563 -> 32499 (measured 32,499 t / 740,012 B; span 4.021 / len 2.600 unchanged, MAX_FILE_BYTES 1,048,576 holds) // + I482 (ST-449 sentry/wasp caps');
rep('tests/assetGlbs.test.js',
  '{ hull: { p10: 0.5611, p50: 0.9108, p90: 1.3070 }, wings: { p10: 0.3869, p50: 0.9981, p90: 1.55 } }; // I501 (ST-467 ship v6) EXPLICIT re-pin:',
  '{ hull: { p10: 0.4603, p50: 0.8009, p90: 1.3020 }, wings: { p10: 0.3891, p50: 0.9271, p90: 1.5464 } }; // I541 (ST-507 E73 ship v7) EXPLICIT re-pin WITH MEASUREMENT: I501 hull {0.5611/0.9108/1.3070} + wings {0.3869/0.9981/1.55} -> measured on the 32,499-tri GLB (.evidence/I541/measure541.cjs; hull spread 0.8417 / wings spread 1.1572) // I501 (ST-467 ship v6) EXPLICIT re-pin:');
// ---- assetPerf.test.js (CRLF no BOM) ----
rep('tests/assetPerf.test.js',
  'totalFilesKB: 3000,  // [I517 re-pin WITH MEASUREMENT 2700 -> 3000 (ST-483 +hauler); measured 2857.41 KB (2,925,988 B); headroom 142.59 KB]',
  'totalFilesKB: 3300,  // [I541 re-pin WITH MEASUREMENT 3000 -> 3300 (ST-507 ship v7 +158,572 B); measured 3,136.95 KB (3,212,232 B); headroom 163.05 KB]');
rep('tests/assetPerf.test.js',
  'totalGeoKB: 2925,    // [I536 RE-PIN WITH MEASUREMENT 2920 -> 2925 (ST-502 gunship v2 landing): measured 2921.67 KB (2,991,786 B); headroom 3.33 KB; prior I535 re-measure: 2905.82 KB (2,975,562 B)]',
  'totalGeoKB: 3080,    // [I541 RE-PIN WITH MEASUREMENT 2925 -> 3080 (ST-507 ship v7): measured 3,076.52 KB (3,150,354 B); headroom 3.48 KB; prior I536: 2921.67 KB (2,991,786 B)]');
rep('tests/assetPerf.test.js',
  'perFileKB: 600,      // [I517 holds 600; max = ship.glb 567.81 KB (581,440 B); max enemy = wasp 302.77 KB (310,036 B); hauler 258.22 KB (264,416 B)]',
  'perFileKB: 760,      // [I541 re-pin WITH MEASUREMENT 600 -> 760 (ST-507 ship v7); max = ship.glb 722.67 KB (740,012 B); max enemy = wasp 302.77 KB (310,036 B)]');
rep('tests/assetPerf.test.js',
  'totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); I536 re-measure WITH MEASUREMENT: measured 65,513 t; headroom 487 t]',
  'totalTris: 73000,    // [I541 re-pin WITH MEASUREMENT 66,000 -> 73,000 (ST-507 ship v7 +6,936 t); measured 72,449 t; headroom 551 t; prior I536: 65,513 t]');
for (const [rel, s] of Object.entries(changes)) { fs.writeFileSync(R(rel), s, 'latin1'); console.log('WROTE ' + rel); }
console.log('REPIN541 ASSET TESTS DONE');
