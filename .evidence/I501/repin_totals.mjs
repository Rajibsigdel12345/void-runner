import fs from 'fs';
let s = fs.readFileSync('tests/assetPerf.test.js', 'utf8');
const pairs = [
  ['totalFilesKB: 1240,  // [I470', 'totalFilesKB: 1440,  // [I501 (ST-467 ship v6) EXPLICIT re-pin: 1240 -> 1440, measured 1429.76 KB (1,464,072 B; +192.07 KB vs I482 = ship 384,756 -> 581,440 B); cap 1440 HOLDS w/ 10.24 KB headroom] // [I470'],
  ['totalGeoKB: 1280,    // [I470', 'totalGeoKB: 1400,    // [I501 (ST-467 ship v6) EXPLICIT re-pin: 1280 -> 1400, measured 1379.94 KB (1,413,060 B; +192.02 KB vs I482 ship geo delta); cap 1400 HOLDS w/ 20.06 KB headroom] // [I470'],
];
for (const [old, rep] of pairs) {
  const n = s.split(old).length - 1;
  if (n !== 1) { console.error('FAIL: got ' + n + ' for ' + old.slice(0, 40)); process.exit(1); }
  s = s.replace(old, rep);
}
fs.writeFileSync('tests/assetPerf.test.js', s);
console.log('OK totals re-pin');
