const fs = require('fs');
const f = 'tests/cameraModel.test.js';
let s = fs.readFileSync(f, 'utf8');
const marker = '// I504 (ST-470): cockpit camera-relative thrust rotation';
const i = s.indexOf(marker);
if (i < 0) { console.error('marker not found'); process.exit(1); }
s = s.slice(0, i);
if (!s.endsWith('\n')) s += '\n';
const block = [
marker,
'const thr = { x: 99, y: 99 };',
"const near0 = (v) => Math.abs(v) < 1e-12;",
'',
"test('cockpitThrust: identity at the default aim (-PI/2, nose-up) - the legacy screen basis', () => {",
'  const a = -Math.PI / 2;',
'  for (const v of [[0, -1], [0, 1], [1, 0], [-1, 0], [SQ, -SQ]]) {',
'    cockpitThrust(v[0], v[1], a, thr);',
"    assert.ok(Math.abs(thr.x - v[0]) < 1e-12 && Math.abs(thr.y - v[1]) < 1e-12, 'identity at -PI/2 for ' + v);",
'  }',
'});',
'',
"test('cockpitThrust: a=0 (nose-east) maps screen-up to +x and screen-right to +y', () => {",
'  cockpitThrust(0, -1, 0, thr); assert.ok(Math.abs(thr.x - 1) < 1e-12 && near0(thr.y)); // W = along the nose',
'  cockpitThrust(1, 0, 0, thr); assert.ok(near0(thr.x) && Math.abs(thr.y - 1) < 1e-12); // D = screen-right',
'  cockpitThrust(0, 1, 0, thr); assert.ok(Math.abs(thr.x + 1) < 1e-12 && near0(thr.y)); // S = astern',
'  cockpitThrust(-1, 0, 0, thr); assert.ok(near0(thr.x) && Math.abs(thr.y + 1) < 1e-12); // A = screen-left',
'});',
'',
"test('cockpitThrust: rotation preserves magnitude, zero stays zero, basis stays orthonormal (any aim)', () => {",
'  for (const a of [0, 0.7, -2.1, Math.PI]) {',
'    cockpitThrust(0.6, -0.8, a, thr);',
'    assert.ok(Math.abs(Math.hypot(thr.x, thr.y) - 1) < 1e-12);',
'    cockpitThrust(0, 0, a, thr);',
"    assert.ok(thr.x === 0 && thr.y === 0, 'zero stays zero'); // === normalizes -0",
'    cockpitThrust(0, -1, a, thr); const ux = thr.x, uy = thr.y; // screen-up -> fwd',
'    cockpitThrust(1, 0, a, thr); // screen-right -> camera right',
"    assert.ok(Math.abs(ux * Math.cos(a) + uy * Math.sin(a) - 1) < 1e-12, 'screen-up maps to fwd');",
"    assert.ok(Math.abs(ux * thr.x + uy * thr.y) < 1e-12, 'screen-right is perpendicular to screen-up');",
"    assert.ok(Math.abs(thr.x + Math.sin(a)) < 1e-12 && Math.abs(thr.y - Math.cos(a)) < 1e-12, 'right = (-sin a, cos a)');",
'  }',
'});',
'',
"test('cockpitTargets: I504 seat - look drops cockpitLookDrop below the eye (down-pitch frames the nose)', () => {",
'  const p = { x: 0, y: 0 };',
'  const f = { x: 0, y: -1 };',
'  const o = { camX: 99, camY: 99, camZ: 99, lookX: 99, lookY: 99, lookZ: 99 };',
'  cockpitTargets(p, f, CFG, o);',
'  assert.equal(o.camY, CFG.cockpitHeight);',
'  assert.ok(Math.abs(o.lookY - (CFG.cockpitHeight - CFG.cockpitLookDrop)) < 1e-12);',
"  assert.ok(o.lookY < o.camY, 'look point is below the eye (nose in frame)');",
'});',
''
].join('\n');
s += block;
fs.writeFileSync(f, s);
console.log('rewrote I504 test block');
