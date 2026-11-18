const fs = require('fs');
const p = 'tests/assetPerf.test.js';
let s = fs.readFileSync(p, 'utf8');
const bomBefore = (s.match(/\uFEFF/g) || []).length;
const lines = [
  'totalFilesKB: 2400,  // [I509 (ST-475 E68 remaster-4) EXPLICIT re-pin: 2300 -> 2400, measured 2273.40 KB (2,327,964 B; remaster-4 507,068 -> 939,980 B, +432,912 B); headroom 126.60 KB; final fleet pin WITH MEASUREMENT at ST-476] // [I508 (ST-474) 1440 -> 2300, measured 1850.64 KB (1,895,052 B)]',
  '  totalGeoKB: 2350,    // [I509 (ST-475) EXPLICIT re-pin: 2250 -> 2350, measured 2224.32 KB (+423.46 KB vs I508 1800.86: wasp +222.99 / hunter +81.27 / gunship +26.66 / sentry +92.54); headroom 125.68 KB; final pin at ST-476] // [I508 1400 -> 2250, measured 1800.86 KB (1,844,082 B)]',
  '  perFileKB: 600,      // [I509: unchanged; max stays ship.glb 567.81 KB (581,440 B); max remaster-4 = wasp 302.77 KB (310,036 B)] // [I508: max stays ship.glb 567.82 KB (581,440 B)]',
  '  totalTris: 58000,    // [I509 (ST-475) EXPLICIT re-pin: 56000 -> 58000, measured 55,075 (remaster-4 6,412 -> 12,916 t = +6,504); headroom 2,925 t; final pin at ST-476] // [I508 45000 -> 56000, measured 48,571]',
  '  perFileMats: 4,      // [I509 (ST-475) EXPLICIT re-pin: 3 -> 4, measured max 4 = enemy_sentry.glb (platform/base/barrel/charge part bakes per R-VALUE 2-3 band rule); ship stays 3] // [max 3 - ship body/wing/cockpit]'
];
for (const line of lines) {
  const key = line.trim().split(':')[0];
  const i = s.indexOf(key + ':');
  if (i < 0) throw new Error('key not found: ' + key);
  const lineStart = s.lastIndexOf('\n', i) + 1;
  let lineEnd = s.indexOf('\n', i);
  if (lineEnd < 0) lineEnd = s.length;
  s = s.slice(0, lineStart) + line + s.slice(lineEnd);
}
fs.writeFileSync(p, s, 'utf8');
const s2 = fs.readFileSync(p, 'utf8');
console.log('BOM before', bomBefore, 'after', (s2.match(/\uFEFF/g) || []).length, '| CRLF', (s2.match(/\r\n/g) || []).length, '| bytes', Buffer.byteLength(s2));
for (const line of lines) console.log('OK', line.slice(0, 60));