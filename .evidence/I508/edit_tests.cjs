const fs = require('fs');
const D = 'E:/Game/.evidence/I508/';
function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
function countN(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; } return n; }
function seg(name) { return fs.readFileSync(D + name, 'utf8').replace(/\r\n/g, '\n').trim().split('\n'); }

// ---------- assetGlbs.test.js (CRLF, 7x BOM kept via string round-trip) ----------
const P1 = 'E:/Game/tests/assetGlbs.test.js';
let s = fs.readFileSync(P1, 'utf8');
if (countN(s, '\r\n') === 0) fail('assetGlbs: no CRLF');
if (countN(s, '\uFEFF') !== 7) fail('assetGlbs: BOM count ' + countN(s, '\uFEFF') + ' != 7');
let lines = s.split('\r\n');
function spliceSeg(startMarker, endFn, newLines, label) {
  const si = lines.findIndex((l) => l.includes(startMarker));
  if (si === -1) fail(label + ': start marker not found');
  let ei = -1;
  for (let i = si + 1; i < lines.length; i++) { if (endFn(lines[i])) { ei = i; break; } }
  if (ei === -1) fail(label + ': end line not found');
  const old = lines.slice(si, ei + 1).join('\n');
  console.log(label + ': old span lines ' + (si + 1) + '-' + (ei + 1) + ' (' + old.length + ' chars)');
  lines.splice(si, ei - si + 1, ...newLines.map((l) => l));
}
const CLOSING = (l) => l === '}';
const CONSTC = (l) => l === '};';
const TESTC = (l) => l === '});';
// bottom-up so indices stay valid
spliceSeg("test('warden.glb: naming, poly budget, hull/armor radii vs CONFIG, grayscale COLOR_0 value bake (I220 -> I289)', () => {", TESTC, seg('seg_warden_test.txt'), 'warden-test');
spliceSeg('const WARDEN_FACET = {', CONSTC, seg('seg_warden_facet.txt'), 'warden-facet');
spliceSeg("test('drone/stinger/flyer bodies: grayscale COLOR_0 value bake band + facet spread (I282)', () => {", TESTC, seg('seg_i282_test.txt'), 'i282-test');
spliceSeg('function enemyFacetLumas({ buf, json, binOff }) {', CLOSING, seg('seg_enemy_facetlumas.txt'), 'enemy-facet-lumas');
spliceSeg('const ENEMY_FACET = {', CONSTC, seg('seg_enemy_facet.txt'), 'enemy-facet');
spliceSeg('// I282 (ST-267 enemy value/shape art pass): the drone/stinger/flyer BODIES carry a', (l) => l === '// COLOR_0 (per-instance emissive materials drive them).', seg('seg_i282_comment.txt'), 'i282-comment');
spliceSeg("test('drone.glb: naming, poly budget, dart dimensions vs procedural parity (I211)', () => {", TESTC, seg('seg_drone_test.txt'), 'drone-test');
s = lines.join('\r\n');
const oldB = 'drone: 100, arenaRing: 120, warden: 200,';
const cb = countN(s, oldB);
if (cb !== 1) fail('BUDGETS anchor count ' + cb);
s = s.replace(oldB, 'drone: 1800, arenaRing: 120, warden: 1800, // I508 (ST-474 E68 legacy-4 remaster) caps 100/200 -> 1800/1800 (spec aim 1400)');
if (countN(s, '\uFEFF') !== 7) fail('assetGlbs: BOM count changed');
fs.writeFileSync(P1, s, 'utf8');
console.log('assetGlbs.test.js written');

// ---------- assetPerf.test.js (LF, no BOM) ----------
const P2 = 'E:/Game/tests/assetPerf.test.js';
let s2 = fs.readFileSync(P2, 'utf8');
if (s2.includes('\r\n')) fail('assetPerf: has CRLF');
if (countN(s2, '\uFEFF') !== 0) fail('assetPerf: has BOM');
let l2 = s2.split('\n');
const newB = seg('seg_perfbudget.txt'); // 4 lines in file order totalFilesKB,totalGeoKB,perFileKB,totalTris
const prefixes = ['  totalFilesKB: 1440,', '  totalGeoKB: 1400,', '  perFileKB: 600,', '  totalTris: 45000,'];
for (let i = 0; i < 4; i++) {
  const idx = l2.findIndex((l) => l.startsWith(prefixes[i]));
  if (idx === -1) fail('assetPerf: line not found ' + prefixes[i]);
  l2[idx] = newB[i];
  console.log('assetPerf: ' + prefixes[i].trim() + ' line ' + (idx + 1) + ' replaced');
}
fs.writeFileSync(P2, l2.join('\n'), 'utf8');
console.log('assetPerf.test.js written');
console.log('EDITS DONE');