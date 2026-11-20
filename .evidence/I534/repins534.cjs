const fs = require("fs");
const p = "E:/Game/tests/assetGlbs.test.js";
let s = fs.readFileSync(p, "utf8");
const eol = s.includes("\r\n") ? "\r\n" : "\n";
let R = [
 ["hauler: 3506 };", "hauler: 3920 };"],
 ["  hauler:  { VR_Hull:     { p10: 0.3670, p50: 0.5600, p90: 0.6200 },\n              VR_SponsonL: { p10: 0.3000, p50: 0.4484, p90: 0.5800 },\n              VR_SponsonR: { p10: 0.3000, p50: 0.4476, p90: 0.5800 },\n              VR_Hatch:    { p10: 0.6067, p50: 0.8000, p90: 0.8500 },\n              VR_Stack:    { p10: 0.4203, p50: 0.5205, p90: 0.7000 } }, // I517 (ST-483) pins WITH measurement (measure_facets517.mjs)",
  "  hauler:  { VR_Hull:     { p10: 0.3200, p50: 0.5800, p90: 0.6200 },\n              VR_SponsonL: { p10: 0.3400, p50: 0.4979, p90: 0.5500 },\n              VR_SponsonR: { p10: 0.3400, p50: 0.5029, p90: 0.5500 },\n              VR_Hatch:    { p10: 0.9000, p50: 0.9000, p90: 0.9000 },\n              VR_Stack:    { p10: 0.3333, p50: 0.4000, p90: 0.5000 } }, // I534 (ST-500 E72) pins WITH measurement (probe534.mjs; boxy mine-hauler truck v2 ridge remaster)"],
 ["test('enemy_hauler.glb: I517 (ST-483 E69) remaster-4 squat mine-hauler truck - nodes, per-node tris, extents, sponson mirror guard, all-prim COLOR_0', () => {",
  "test('enemy_hauler.glb: I534 (ST-500 E72) boxy mine-hauler truck v2 - nodes, per-node tris, extents, sponson mirror guard, all-prim COLOR_0', () => {"],
 ["assert.ok(buf.length <= 260 * 1024, 'hauler under 260 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I517 264,416 B)');",
  "assert.ok(buf.length <= 298 * 1024, 'hauler under 298 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I534 304,384 B)');"],
 ["assert.equal(s.totalTris, BUDGETS.hauler, 'hauler total tris == ' + BUDGETS.hauler + ' (I517 pin WITH measurement)');",
  "assert.equal(s.totalTris, BUDGETS.hauler, 'hauler total tris == ' + BUDGETS.hauler + ' (I534 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 1488, 'hull 1488 tris (I517 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 2128, 'hull 2128 tris (I534 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_SponsonL').tris, 600, 'sponson L 600 tris (I517 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_SponsonL').tris, 500, 'sponson L 500 tris (I534 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_SponsonR').tris, 600, 'sponson R 600 tris (I517 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_SponsonR').tris, 500, 'sponson R 500 tris (I534 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_Hatch').tris, 336, 'hatch 336 tris (I517 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_Hatch').tris, 336, 'hatch 336 tris (I534 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_Stack').tris, 482, 'stack 482 tris (I517 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_Stack').tris, 456, 'stack 456 tris (I534 re-pin WITH measurement)');"],
 ["assert.ok(Math.abs(he.x - 1.965) / 1.965 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.965');",
  "assert.ok(Math.abs(he.x - 1.7200) / 1.7200 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.7200 (I534)');"],
 ["assert.ok(Math.abs(he.y - 0.494) / 0.494 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.494');",
  "assert.ok(Math.abs(he.y - 0.9580) / 0.9580 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.9580 (I534)');"],
 ["assert.ok(Math.abs(he.z - 0.94) / 0.94 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 0.94');",
  "assert.ok(Math.abs(he.z - 1.1000) / 1.1000 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 1.1000 (I534)');"],
 ["assert.ok(Math.abs(sl.x - 1.71) / 1.71 <= 0.1, 'sponson L X ' + sl.x.toFixed(4) + ' ~ 1.71');",
  "assert.ok(Math.abs(sl.x - 1.1600) / 1.1600 <= 0.1, 'sponson L X ' + sl.x.toFixed(4) + ' ~ 1.1600 (I534)');"],
 ["assert.ok(Math.abs(sl.y - 0.335) / 0.335 <= 0.1, 'sponson L Y ' + sl.y.toFixed(4) + ' ~ 0.335');",
  "assert.ok(Math.abs(sl.y - 0.3588) / 0.3588 <= 0.1, 'sponson L Y ' + sl.y.toFixed(4) + ' ~ 0.3588 (I534)');"],
 ["assert.ok(Math.abs(sl.z - 0.138) / 0.138 <= 0.1, 'sponson L Z ' + sl.z.toFixed(4) + ' ~ 0.138');",
  "assert.ok(Math.abs(sl.z - 0.2350) / 0.2350 <= 0.1, 'sponson L Z ' + sl.z.toFixed(4) + ' ~ 0.2350 (I534)');"],
 ["assert.ok(Math.abs(sl.cz - 0.50) <= 0.03, 'sponson L cz ' + sl.cz.toFixed(4) + ' ~ +0.50 (mirror guard)');",
  "assert.ok(Math.abs(sl.cz - 0.4825) <= 0.03, 'sponson L cz ' + sl.cz.toFixed(4) + ' ~ +0.4825 (I534 mirror guard)');"],
 ["assert.ok(Math.abs(sr.cz + 0.50) <= 0.03, 'sponson R cz ' + sr.cz.toFixed(4) + ' ~ -0.50 (mirror guard)');",
  "assert.ok(Math.abs(sr.cz + 0.4825) <= 0.03, 'sponson R cz ' + sr.cz.toFixed(4) + ' ~ -0.4825 (I534 mirror guard)');"],
 ["assert.ok(Math.abs(ht.x - 0.638) / 0.638 <= 0.1, 'hatch X ' + ht.x.toFixed(4) + ' ~ 0.638');",
  "assert.ok(Math.abs(ht.x - 0.2600) / 0.2600 <= 0.1, 'hatch X ' + ht.x.toFixed(4) + ' ~ 0.2600 (I534)');"],
 ["assert.ok(Math.abs(ht.y - 0.09) / 0.09 <= 0.1, 'hatch Y ' + ht.y.toFixed(4) + ' ~ 0.09');",
  "assert.ok(Math.abs(ht.y - 0.2100) / 0.2100 <= 0.1, 'hatch Y ' + ht.y.toFixed(4) + ' ~ 0.2100 (I534)');"],
 ["assert.ok(Math.abs(ht.z - 0.633) / 0.633 <= 0.1, 'hatch Z ' + ht.z.toFixed(4) + ' ~ 0.633');",
  "assert.ok(Math.abs(ht.z - 0.2400) / 0.2400 <= 0.1, 'hatch Z ' + ht.z.toFixed(4) + ' ~ 0.2400 (I534)');"],
 ["assert.ok(Math.abs(st.x - 0.36) / 0.36 <= 0.1, 'stack X ' + st.x.toFixed(4) + ' ~ 0.36');",
  "assert.ok(Math.abs(st.x - 0.2730) / 0.2730 <= 0.1, 'stack X ' + st.x.toFixed(4) + ' ~ 0.2730 (I534)');"],
 ["assert.ok(Math.abs(st.y - 0.235) / 0.235 <= 0.1, 'stack Y ' + st.y.toFixed(4) + ' ~ 0.235');",
  "assert.ok(Math.abs(st.y - 0.4420) / 0.4420 <= 0.1, 'stack Y ' + st.y.toFixed(4) + ' ~ 0.4420 (I534)');"],
 ["assert.ok(Math.abs(st.z - 0.394) / 0.394 <= 0.1, 'stack Z ' + st.z.toFixed(4) + ' ~ 0.394');",
  "assert.ok(Math.abs(st.z - 0.3600) / 0.3600 <= 0.1, 'stack Z ' + st.z.toFixed(4) + ' ~ 0.3600 (I534)');"],
];
R = R.map(([a, b]) => [a.split("\n").join(eol), b.split("\n").join(eol)]);
let n = 0;
for (const [a, b] of R) {
  if (!s.includes(a)) { console.log("MISS", a.slice(0, 70).replace(/\r\n/g, "\\n")); process.exit(1); }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(p, s);
console.log("TEST_REPINS_APPLIED", n + "/" + R.length, "EOL", eol === "\r\n" ? "CRLF" : "LF");