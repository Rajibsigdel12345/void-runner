// I541 (ST-507, E73): playframe491.mjs re-pin WITH MEASUREMENT (A:L 25781->32717, B 55400->69272, A:P 180 unchanged).
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '..', 'I491', 'playframe491.mjs');
let s = fs.readFileSync(f, 'latin1');
function rep(oldStr, newStr) {
  const first = s.indexOf(oldStr);
  if (first === -1) { console.error('NOT FOUND: ' + oldStr.slice(0, 70)); process.exit(1); }
  if (s.indexOf(oldStr, first + 1) !== -1) { console.error('NOT UNIQUE: ' + oldStr.slice(0, 70)); process.exit(1); }
  s = s.slice(0, first) + newStr + s.slice(first + oldStr.length);
  console.log('OK ' + oldStr.slice(0, 46) + ' ...');
}
// A:L condition
rep('RA.L.calls === 22 && RA.L.tris === 25781', 'RA.L.calls === 22 && RA.L.tris === 32717');
// A:L label
rep('22/25781 (I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 22/17361 -> 22/25781,',
    '22/32717 (I541 (ST-507 ship v7) EXPLICIT re-pin WITH MEASUREMENT: 22/25781 -> 22/32717, delta +6,936 = ship GLB 25,563 -> 32,499 exactly (fx=off single scene pass: non-ship 218 tris unchanged). I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 22/17361 -> 22/25781,');
// B condition
rep('RB.calls === 52 && RB.tris === 55400', 'RB.calls === 52 && RB.tris === 69272');
// B label
rep('"B: 52/55400 (I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 52/38560 -> 52/55400,',
    '"B: 52/69272 (I541 (ST-507 ship v7) EXPLICIT re-pin WITH MEASUREMENT: 52/55400 -> 52/69272, delta +13,872 = 2 x 6,936 (fx=high two-pass: single-pass scene 27,700 -> 34,636, +6,936 ship 25,563->32,499 only, non-ship 2,137 unchanged at reseed 71201; hv=0/gv=0). I501 (ST-467 ship v6) EXPLICIT re-pin WITH MEASUREMENT: 52/38560 -> 52/55400,');
fs.writeFileSync(f, s, 'latin1');
console.log('REPIN541 PLAYFRAME DONE');
