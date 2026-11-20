const fs = require('fs');
const p = 'tests/touchZones.test.js';
let s = fs.readFileSync(p, 'utf8');
const oldImport = "import { ZONE, zoneFor, thrustFromDrag, knobOffset } from '../src/core/touchZones.js';";
const newImport = "import { ZONE, zoneFor, thrustFromDrag, knobOffset, stickGeomFor } from '../src/core/touchZones.js';";
if (s.split(oldImport).length - 1 !== 1) throw new Error('import count != 1');
s = s.replace(oldImport, newImport);
const anchor = '// --- input.js dual-zone behaviour';
if (s.split(anchor).length - 1 !== 1) throw new Error('anchor count != 1');
const block = [
  '// --- stickGeomFor (ST-511, I545 E74 D3) ------------------------------------',
  "test('ST-511 stickGeomFor: usable/invalid vh -> shipped 90/24 (bit-identical default)', () => {",
  '  assert.deepEqual(stickGeomFor(360), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(740), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(1000), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(NaN), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(undefined), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(-1), { maxPx: 90, deadzone: 24 });',
  '  assert.deepEqual(stickGeomFor(0), { maxPx: 90, deadzone: 24 });',
  '});',
  "test('ST-511 stickGeomFor: short landscape shrinks travel, holds 44 px knob floor', () => {",
  '  assert.deepEqual(stickGeomFor(280), { maxPx: 70, deadzone: 22 });',
  '  assert.deepEqual(stickGeomFor(200), { maxPx: 56, deadzone: 22 });',
  '  assert.deepEqual(stickGeomFor(224), { maxPx: 56, deadzone: 22 });',
  '  assert.deepEqual(stickGeomFor(223), { maxPx: 56, deadzone: 22 });',
  '});',
  '',
].join('\n');
s = s.replace(anchor, block + anchor);
fs.writeFileSync(p, s, 'utf8');
console.log('test.js edited, len ' + s.length);
