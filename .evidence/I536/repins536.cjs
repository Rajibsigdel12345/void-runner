const fs = require("fs");
function patchFile(P, pairs) {
  let s = fs.readFileSync(P, "utf8");
  let n = 0;
  for (const [a, b] of pairs) {
    const i = s.indexOf(a);
    if (i < 0) { console.error("NOT FOUND in " + P + ": " + a.slice(0, 80)); process.exit(1); }
    if (s.indexOf(a, i + 1) >= 0) { console.error("NOT UNIQUE in " + P + ": " + a.slice(0, 80)); process.exit(1); }
    s = s.slice(0, i) + b + s.slice(i + a.length);
    n++;
  }
  fs.writeFileSync(P, s);
  console.log("OK " + P + " " + n + "/" + pairs.length);
}
const G = "E:/Game/tests/assetGlbs.test.js";
patchFile(G, [
["gunship: 2596", "gunship: 2906"],
["assert.ok(buf.length <= 200 * 1024, 'gunship under 200 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I509 198,760 B)');",
 "assert.ok(buf.length <= 210 * 1024, 'gunship under 210 KB (measured ' + (buf.length / 1024).toFixed(2) + ' KB; I536 215,032 B)');"],
["assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Hull').tris, 1732, 'hull 1732 tris (I509 exact)');",
 "assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Hull').tris, 1864, 'hull 1864 tris (I536 exact)');"],
["assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Nacelle').tris, 544, 'nacelle 544 tris (I509 exact)');",
 "assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Nacelle').tris, 750, 'nacelle 750 tris (I536 exact)');"],
["assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Bay').tris, 320, 'bay 320 tris (I509 exact)');",
 "assert.equal(s.prims.find((p) => p.name === 'VR_Gunship_Bay').tris, 292, 'bay 292 tris (I536 exact)');"],
["assert.ok(Math.abs(he.x - 2.1) / 2.1 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 2.1');",
 "assert.ok(Math.abs(he.x - 2.95) / 2.95 <= 0.1, 'hull X ' + he.x.toFixed(4) + ' ~ 2.95');"],
["assert.ok(Math.abs(he.y - 1.4158) / 1.4158 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 1.4158');",
 "assert.ok(Math.abs(he.y - 1.35) / 1.35 <= 0.1, 'hull Y ' + he.y.toFixed(4) + ' ~ 1.35');"],
["assert.ok(Math.abs(he.z - 2.0) / 2.0 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 2.0');",
 "assert.ok(Math.abs(he.z - 1.94) / 1.94 <= 0.1, 'hull Z ' + he.z.toFixed(4) + ' ~ 1.94');"],
["assert.ok(Math.abs(ne.x - 1.45) / 1.45 <= 0.1, 'nacelle X ' + ne.x.toFixed(4) + ' ~ 1.45');",
 "assert.ok(Math.abs(ne.x - 1.336) / 1.336 <= 0.1, 'nacelle X ' + ne.x.toFixed(4) + ' ~ 1.336');"],
["assert.ok(Math.abs(ne.z - 0.8558) / 0.8558 <= 0.1, 'nacelle Z ' + ne.z.toFixed(4) + ' ~ 0.8558');",
 "assert.ok(Math.abs(ne.z - 0.87) / 0.87 <= 0.1, 'nacelle Z ' + ne.z.toFixed(4) + ' ~ 0.87');"],
["assert.ok(Math.abs(be.y - 0.48) / 0.48 <= 0.1, 'bay Y ' + be.y.toFixed(4) + ' ~ 0.48');",
 "assert.ok(Math.abs(be.y - 0.43) / 0.43 <= 0.1, 'bay Y ' + be.y.toFixed(4) + ' ~ 0.43');"],
["assert.ok(Math.abs(be.z - 0.4605) / 0.4605 <= 0.1, 'bay Z ' + be.z.toFixed(4) + ' ~ 0.4605');",
 "assert.ok(Math.abs(be.z - 0.58) / 0.58 <= 0.1, 'bay Z ' + be.z.toFixed(4) + ' ~ 0.58');"],
["VR_Gunship_Hull:    { p10: 0.3473, p50: 0.4751, p90: 0.5259 },",
 "VR_Gunship_Hull:    { p10: 0.3463, p50: 0.4472, p90: 0.5042 },"],
["VR_Gunship_Nacelle: { p10: 0.2600, p50: 0.4732, p90: 0.6600 },",
 "VR_Gunship_Nacelle: { p10: 0.2600, p50: 0.3400, p90: 0.5421 },"],
["VR_Gunship_Bay:     { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },",
 "VR_Gunship_Bay:     { p10: 0.7800, p50: 0.8400, p90: 0.9500 } },"],
["// Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).\r\n  const he = primExtents({ buf, json, binOff }, 'VR_Gunship_Hull');",
 "// Per-node extents: I536 TRUE-AXIS measurements (probe536.mjs; 10% band).\r\n  const he = primExtents({ buf, json, binOff }, 'VR_Gunship_Hull');"],
["test('enemy_gunship.glb: I509 (ST-475 E68) remaster-4 brute bomber - nodes, per-node tris, extents, all-prim COLOR_0', () => {",
 "test('enemy_gunship.glb: I536 (ST-502 E72) brute bomber v2 - nodes, per-node tris, extents, all-prim COLOR_0', () => {"],
]);
const A = "E:/Game/tests/assetPerf.test.js";
patchFile(A, [
["  totalGeoKB: 2920,    // [I535 re-measure WITH MEASUREMENT (ST-501 bulwark v2 landing; cap HOLDS): measured 2905.82 KB (2,975,562 B); headroom 14.18 KB; ST-502 gunship v2 must land within ~14 KB geo or re-pin cap WITH MEASUREMENT + G72.0]",
 "  totalGeoKB: 2925,    // [I536 RE-PIN WITH MEASUREMENT 2920 -> 2925 (ST-502 gunship v2 landing): measured 2921.67 KB (2,991,786 B); headroom 3.33 KB; prior I535 re-measure: 2905.82 KB (2,975,562 B)]"],
["  totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); I535 re-measure WITH MEASUREMENT: measured 65,203 t; headroom 797 t]",
 "  totalTris: 66000,    // [I517 re-pin WITH MEASUREMENT 62,000 -> 66,000 (ST-483 +hauler 3,506 t); I536 re-measure WITH MEASUREMENT: measured 65,513 t; headroom 487 t]"],
]);
