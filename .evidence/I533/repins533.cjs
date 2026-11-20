const fs = require("fs");
const p = "E:/Game/tests/assetGlbs.test.js";
let s = fs.readFileSync(p, "utf8");
const eol = s.includes("\r\n") ? "\r\n" : "\n";
let R = [
 ["phantom: 2336,", "phantom: 3048,"],
 ["  phantom: { VR_Hull:  { p10: 0.3400, p50: 0.3800, p90: 0.6200 },\n              VR_Nose:  { p10: 0.9300, p50: 0.9300, p90: 0.9300 },\n              VR_PodL:  { p10: 0.5023, p50: 0.6600, p90: 0.6600 },\n              VR_PodR:  { p10: 0.5037, p50: 0.6600, p90: 0.6600 } },",
  "  phantom: { VR_Hull:  { p10: 0.3600, p50: 0.5164, p90: 0.6059 },\n              VR_Nose:  { p10: 0.9000, p50: 0.9000, p90: 0.9000 },\n              VR_PodL:  { p10: 0.4790, p50: 0.6081, p90: 0.6800 },\n              VR_PodR:  { p10: 0.4729, p50: 0.6134, p90: 0.6800 } }, // I533 (ST-499 E72) pins WITH measurement (probe533.mjs; cloaker-dart v2 remaster)"],
 ["test('enemy_phantom.glb: I516 (ST-482 E69) remaster-4 phantom interceptor - nodes, per-node tris, extents, all-prim COLOR_0', () => {",
  "test('enemy_phantom.glb: I533 (ST-499 E72) cloaker-dart phantom interceptor v2 - nodes, per-node tris, extents, all-prim COLOR_0', () => {"],
 ["assert.ok(buf.length <= 184 * 1024, 'phantom under 184 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I516 183,724 B)');",
  "assert.ok(buf.length <= 210 * 1024, 'phantom under 210 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I533 214,568 B)');"],
 ["assert.equal(s.totalTris, BUDGETS.phantom, 'phantom total tris == ' + BUDGETS.phantom + ' (I516 pin WITH measurement)');",
  "assert.equal(s.totalTris, BUDGETS.phantom, 'phantom total tris == ' + BUDGETS.phantom + ' (I533 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 1416, 'hull 1416 tris (I516 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_Hull').tris, 1972, 'hull 1972 tris (I533 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_Nose').tris, 264, 'nose 264 tris (I516 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_Nose').tris, 284, 'nose 284 tris (I533 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_PodL').tris, 328, 'pod L 328 tris (I516 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_PodL').tris, 396, 'pod L 396 tris (I533 re-pin WITH measurement)');"],
 ["assert.equal(s.prims.find((p) => p.name === 'VR_PodR').tris, 328, 'pod R 328 tris (I516 exact)');",
  "assert.equal(s.prims.find((p) => p.name === 'VR_PodR').tris, 396, 'pod R 396 tris (I533 re-pin WITH measurement)');"],
 ["assert.ok(Math.abs(he.x - 1.36) / 1.36 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.36');",
  "assert.ok(Math.abs(he.x - 1.56) / 1.56 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 1.56 (I533)');"],
 ["assert.ok(Math.abs(he.y - 0.385) / 0.385 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.385');",
  "assert.ok(Math.abs(he.y - 0.4903) / 0.4903 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 0.4903 (I533)');"],
 ["assert.ok(Math.abs(he.z - 0.48) / 0.48 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 0.48');",
  "assert.ok(Math.abs(he.z - 0.5732) / 0.5732 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 0.5732 (I533)');"],
 ["assert.ok(Math.abs(ne.x - 0.188) / 0.188 <= 0.1, 'nose X ' + ne.x.toFixed(4) + ' ~ 0.188');",
  "assert.ok(Math.abs(ne.x - 0.1209) / 0.1209 <= 0.1, 'nose X ' + ne.x.toFixed(4) + ' ~ 0.1209 (I533)');"],
 ["assert.ok(Math.abs(pl.x - 0.33) / 0.33 <= 0.1, 'pod L X ' + pl.x.toFixed(4) + ' ~ 0.33');",
  "assert.ok(Math.abs(pl.x - 0.36) / 0.36 <= 0.1, 'pod L X ' + pl.x.toFixed(4) + ' ~ 0.36 (I533)');"],
 ["assert.ok(Math.abs(pl.cz - 0.30) <= 0.03, 'pod L cz ' + pl.cz.toFixed(4) + ' ~ +0.30 (mirror guard)');",
  "assert.ok(Math.abs(pl.cz - 0.1275) <= 0.03, 'pod L cz ' + pl.cz.toFixed(4) + ' ~ +0.1275 (I533 mirror guard)');"],
 ["assert.ok(Math.abs(pr.cz + 0.30) <= 0.03, 'pod R cz ' + pr.cz.toFixed(4) + ' ~ -0.30 (mirror guard)');",
  "assert.ok(Math.abs(pr.cz + 0.1275) <= 0.03, 'pod R cz ' + pr.cz.toFixed(4) + ' ~ -0.1275 (I533 mirror guard)');"],
];
R = R.map(([a, b]) => [a.split("\n").join(eol), b.split("\n").join(eol)]);
let n = 0;
for (const [a, b] of R) {
  if (!s.includes(a)) { console.log("MISS", a.slice(0, 70).replace(/\r\n/g, "\\n")); process.exit(1); }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(p, s);
console.log("TEST_REPINS_APPLIED", n + "/" + R.length, "EOL", eol === "\r\n" ? "CRLF" : "LF");
