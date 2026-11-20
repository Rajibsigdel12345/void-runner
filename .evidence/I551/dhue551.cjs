// I551 (ST-517, E75): E69 dhue collision gate for the 4 NEW zenith palettes.
// Rule (E69 precedent, .evidence/I520): a new zone accent must be dhue > 12 (circular
// hue distance) from EVERY existing zone accent, measured, not eyeballed.
const fs = require('fs');

// hex -> hue in degrees [0,360)
function hue(hex) {
  const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return null; // achromatic (no hue)
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
// circular hue distance in degrees [0,180]
function dhue(h1, h2) { const d = Math.abs(h1 - h2) % 360; return Math.min(d, 360 - d); }

// The 15 existing non-null accents (drift-1 is null = identity, excluded) read from
// src/core/config.js at I551 time (verified against the committed tree).
const EXISTING = {
  'drift-2':  0x59d8ff, 'drift-3': 0xff9a3d, 'drift-4': 0xff4a2a,
  'debris-1': 0x2dd4bf, 'debris-2': 0x53d8ff, 'debris-3': 0x69f0ae, 'debris-4': 0x2dd4bf,
  'ember-1':  0xffc94d, 'ember-2': 0xff9a3d, 'ember-3': 0xff4a2a, 'ember-4': 0xffc94d,
  'reef-1':   0x8a5cff, 'reef-2': 0xa04dff, 'reef-3': 0xc840e8, 'reef-4': 0xff3dd6
};
// Cross-check against the live config so the table is measured from disk, not memory.
const cfg = fs.readFileSync('src/core/config.js', 'utf8');
let ok = true;
for (const [id, accent] of Object.entries(EXISTING)) {
  const re = new RegExp("'" + id + "':\\s*\\{[^}]*accent:\\s*0x([0-9a-f]{6})");
  const m = cfg.match(re);
  if (!m || parseInt(m[1], 16) !== accent) {
    console.error('STALE: ' + id + ' config accent ' + (m ? m[1] : 'NOT FOUND') + ' != table ' + accent.toString(16));
    ok = false;
  }
}
// The 4 NEW L5 accents (deep azure band, the leading free band per I548 research).
const NEW = {
  'zenith-1': 0x2a5cff,
  'zenith-2': 0x2a7aff,
  'zenith-3': 0x3d95ff,
  'zenith-4': 0x4da8ff
};
const GATE = 12;

const table = { existing: {}, new: {} };
for (const [id, accent] of Object.entries(EXISTING)) table.existing[id] = { hex: '0x' + accent.toString(16).padStart(6, '0'), hue: hue(accent) };
const results = {};
for (const [id, accent] of Object.entries(NEW)) {
  const h = hue(accent);
  let minD = 180, nearest = null;
  for (const [eid, eaccent] of Object.entries(EXISTING)) {
    const d = dhue(h, hue(eaccent));
    if (d < minD) { minD = d; nearest = eid; }
  }
  const pass = minD > GATE;
  ok = ok && pass;
  results[id] = { hex: '0x' + accent.toString(16).padStart(6, '0'), hue: h, minDhue: +minD.toFixed(2), nearest, pass };
  table.new[id] = results[id];
}
// Within-band spread of the 4 new accents (aesthetic read, not a gate)
const hues = Object.values(NEW).map(hue);
const spread = +Math.max(...hues) - Math.min(...hues);

const out = {
  gate: GATE,
  measured: 'I551 (ST-517, E75) - config.js on disk, ' + new Date().toISOString(),
  existing: table.existing,
  new: results,
  newBandSpread: +spread.toFixed(2),
  PASS: ok
};
fs.writeFileSync(__dirname + '/dhue551.json', JSON.stringify(out, null, 2) + '\n');
console.log('existing accents:');
for (const [id, r] of Object.entries(table.existing)) console.log('  ' + id.padEnd(9) + r.hex + '  hue ' + (r.hue == null ? 'n/a' : r.hue.toFixed(1)));
console.log('NEW accents (gate: dhue > ' + GATE + ' from ALL 15 existing):');
for (const [id, r] of Object.entries(results)) console.log('  ' + id.padEnd(9) + r.hex + '  hue ' + r.hue.toFixed(1) + '  minDhue ' + r.minDhue + '  (nearest ' + r.nearest + ')  ' + (r.pass ? 'PASS' : 'FAIL'));
console.log('new-band spread: ' + out.newBandSpread + ' deg');
console.log(out.PASS ? 'DHUE551 PASS' : 'DHUE551 FAIL');
process.exit(out.PASS ? 0 : 1);
