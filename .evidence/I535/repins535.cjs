// repins535.cjs - I535 (ST-501 E72) bulwark v2 test re-pins WITH MEASUREMENT (CRLF-safe; pattern = repins534b.cjs)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
function patchFile(rel, pairs) {
  const abs = path.join(root, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let text = raw.replace(/\r\n/g, '\n');
  for (const p of pairs) {
    const oldStr = p[0], newStr = p[1];
    const count = text.split(oldStr).length - 1;
    if (count !== 1) { console.error('FAIL ' + rel + ' occurrence=' + count + ' for: ' + oldStr.slice(0, 60)); process.exit(1); }
    text = text.replace(oldStr, newStr);
    console.log('OK ' + rel + ' <- ' + oldStr.slice(0, 44).trim());
  }
  fs.writeFileSync(abs, isCRLF ? text.replace(/\n/g, '\r\n') : text);
  console.log('WROTE ' + rel + ' (CRLF=' + isCRLF + ')');
}
const EXT_COMMENT = '// Per-node extents: I516 TRUE-AXIS measurements (glb_probe.mjs; 10% band).\n  const sh = primExtents({ buf, json, binOff }, \'VR_Shield\');';
const EXT_COMMENT_NEW = '// Per-node extents: I535 TRUE-AXIS measurements (probe535.mjs; 10% band).\n  const sh = primExtents({ buf, json, binOff }, \'VR_Shield\');';
patchFile('tests/assetGlbs.test.js', [
  ['bulwark: 2700', 'bulwark: 3160'],
  ["test('enemy_bulwark.glb: I516 (ST-482 E69) remaster-4 hex-shield guardian - nodes, per-node tris, extents, all-prim COLOR_0'",
   "test('enemy_bulwark.glb: I535 (ST-501 E72) hex-shield guardian v2 - nodes, per-node tris, extents, all-prim COLOR_0'"],
  ["assert.ok(buf.length <= 150 * 1024, 'bulwark under 150 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I516 149,884 B)');",
   "assert.ok(buf.length <= 187 * 1024, 'bulwark under 187 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I535 190,584 B)');"],
  ["'bulwark total tris == ' + BUDGETS.bulwark + ' (I516 pin WITH measurement)'",
   "'bulwark total tris == ' + BUDGETS.bulwark + ' (I535 re-pin WITH measurement)'"],
  ["assert.equal(s.prims.find((p) => p.name === 'VR_Shield').tris, 1924, 'shield 1924 tris (I516 exact)');",
   "assert.equal(s.prims.find((p) => p.name === 'VR_Shield').tris, 1924, 'shield 1924 tris (I535 exact)');"],
  ["assert.equal(s.prims.find((p) => p.name === 'VR_Core').tris, 254, 'core 254 tris (I516 exact)');",
   "assert.equal(s.prims.find((p) => p.name === 'VR_Core').tris, 444, 'core 444 tris (I535 exact)');"],
  ["assert.equal(s.prims.find((p) => p.name === 'VR_Spine').tris, 522, 'spine 522 tris (I516 exact)');",
   "assert.equal(s.prims.find((p) => p.name === 'VR_Spine').tris, 792, 'spine 792 tris (I535 exact)');"],
  [EXT_COMMENT, EXT_COMMENT_NEW],
  ["assert.ok(Math.abs(sh.x - 0.24) / 0.24 <= 0.1, 'shield X (disc thickness) ' + sh.x.toFixed(4) + ' ~ 0.24');",
   "assert.ok(Math.abs(sh.x - 0.4250) / 0.4250 <= 0.1, 'shield X (plate thickness) ' + sh.x.toFixed(4) + ' ~ 0.4250 (I535)');"],
  ["assert.ok(Math.abs(sh.y - 2.10) / 2.10 <= 0.1, 'shield Y (disc) ' + sh.y.toFixed(4) + ' ~ 2.10');",
   "assert.ok(Math.abs(sh.y - 2.0811) / 2.0811 <= 0.1, 'shield Y (disc) ' + sh.y.toFixed(4) + ' ~ 2.0811 (I535)');"],
  ["assert.ok(Math.abs(sh.z - 2.14) / 2.14 <= 0.1, 'shield Z (disc) ' + sh.z.toFixed(4) + ' ~ 2.14');",
   "assert.ok(Math.abs(sh.z - 2.1800) / 2.1800 <= 0.1, 'shield Z (disc) ' + sh.z.toFixed(4) + ' ~ 2.1800 (I535)');"],
  ["assert.ok(Math.abs(co.z - 0.37) / 0.37 <= 0.1, 'core Z ' + co.z.toFixed(4) + ' ~ 0.37');",
   "assert.ok(Math.abs(co.x - 0.2306) / 0.2306 <= 0.1, 'core X ' + co.x.toFixed(4) + ' ~ 0.2306 (I535)');\n  assert.ok(Math.abs(co.z - 0.4140) / 0.4140 <= 0.1, 'core Z ' + co.z.toFixed(4) + ' ~ 0.4140 (I535)');"],
  ["assert.ok(Math.abs(sp.x - 0.87) / 0.87 <= 0.1, 'spine X ' + sp.x.toFixed(4) + ' ~ 0.87');",
   "assert.ok(Math.abs(sp.x - 0.9400) / 0.9400 <= 0.1, 'spine X ' + sp.x.toFixed(4) + ' ~ 0.9400 (I535)');"],
  ["assert.ok(Math.abs(sp.z - 0.84) / 0.84 <= 0.1, 'spine Z ' + sp.z.toFixed(4) + ' ~ 0.84');",
   "assert.ok(Math.abs(sp.y - 0.4540) / 0.4540 <= 0.1, 'spine Y ' + sp.y.toFixed(4) + ' ~ 0.4540 (I535)');\n  assert.ok(Math.abs(sp.z - 0.8000) / 0.8000 <= 0.1, 'spine Z ' + sp.z.toFixed(4) + ' ~ 0.8000 (I535)');"],
  ['p10: 0.4600, p50: 0.6190, p90: 0.7400',
   'p10: 0.4600, p50: 0.5700, p90: 0.7100'],
  ['p10: 0.2800, p50: 0.3876, p90: 0.4103 } }, // I516 (ST-482) pins WITH measurement (measure_facets516.mjs)',
   'p10: 0.2800, p50: 0.3498, p90: 0.3912 } }, // I535 (ST-501 E72) pins WITH measurement (probe535.mjs; hex-shield guardian v2 remaster)']
]);
console.log('ALL_REPINS535_OK');
