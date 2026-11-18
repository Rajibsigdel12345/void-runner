const fs = require("fs");
const p = "E:/Game/tests/assetGlbs.test.js";
let t = fs.readFileSync(p, "utf8");
const bomBefore = (t.match(/\uFEFF/g) || []).length;
function mustOnce(hay, needle, label) {
  const i = hay.indexOf(needle);
  if (i < 0) throw new Error("not found: " + label);
  if (hay.indexOf(needle, i + 1) >= 0) throw new Error("not unique: " + label);
  return i;
}
t = t.replace("hunter: 2400, gunship: 2400, sentry: 1800, wasp: 1200 }",
  "hunter: 3366, gunship: 2596, sentry: 2934, wasp: 4020 }");
const noteAnchor = "drone/warden caps 100/200 -> 1800/1800 (spec aim 1400)";
const ni = mustOnce(t, noteAnchor, "BUDGETS note anchor");
t = t.slice(0, ni) + noteAnchor + " + I509 (ST-475 E68 remaster-4 re-pin WITH measurement) hunter/gunship/sentry/wasp 3366/2596/2934/4020 (wasp 1200 -> 4020: wing-mirror rebuild, double blade 2400 t)" + t.slice(ni + noteAnchor.length);
const startA = mustOnce(t, "// I451 (ST-421 E57): Blender-authored enemy GLBs", "I451 comment start");
const endA = mustOnce(t, "function primExtents({ buf, json, binOff }, meshName) {", "primExtents fn");
if (endA < startA) throw new Error("region A order");
const blockA = [
  "// I509 (ST-475 E68): remaster-4 fleet GLBs (hunter/gunship/sentry/wasp) - real-spaceship",
  "// Blender 5.2.3 headless rebuild (build_remaster4.py; CG gate + 12-view sheets in",
  "// .evidence/I509/gate_notes.md). Contract (I508 pattern): flat node set, no root nodes;",
  "// EVERY primitive carries a grayscale COLOR_0 value bake (FLOAT 5126 VEC3, count ==",
  "// POSITION count, |r-g|,|g-b| <= 0.02, domain [0.25,1.00]); materials named",
  "// VR_<Asset>_<Part>Mat. Runtime note: game code reads vertexColors only on the hull",
  "// material per asset (S4.6 deviation, documented in gate_notes.md) - accent bakes are a",
  "// harmless superset. Extent pins are the I509 TRUE-AXIS measurements (glb_probe.mjs); the",
  "// v37-checkpoint \"axis defect\" was an ext_verify.mjs column-rotation artifact - no frame",
  "// change, standard Y-up glTF frame (glTF.x = build.x fwd, glTF.y = build.z up, glTF.z = -build.y).",
  "const ENEMY451_FACET = {",
  "  hunter:  { VR_Hunter_Hull:  { p10: 0.3000, p50: 0.4733, p90: 0.7076 },",
  "             VR_Hunter_Fin:   { p10: 0.3689, p50: 0.3908, p90: 0.4115 },",
  "             VR_Hunter_Core:  { p10: 0.9000, p50: 0.9000, p90: 0.9000 } },",
  "  gunship: { VR_Gunship_Hull:    { p10: 0.3473, p50: 0.4751, p90: 0.5259 },",
  "             VR_Gunship_Nacelle: { p10: 0.2600, p50: 0.4732, p90: 0.6600 },",
  "             VR_Gunship_Bay:     { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },",
  "  sentry:  { VR_Sentry_Platform: { p10: 0.4532, p50: 0.4657, p90: 0.7200 },",
  "             VR_Sentry_Base:     { p10: 0.3400, p50: 0.3400, p90: 0.3400 },",
  "             VR_Sentry_Barrel:   { p10: 0.4727, p50: 0.5202, p90: 0.6600 },",
  "             VR_Sentry_Charge:   { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },",
  "  wasp:    { VR_Wasp_Hull: { p10: 0.3400, p50: 0.5467, p90: 0.7200 },",
  "             VR_Wasp_Wing: { p10: 0.3600, p50: 0.5483, p90: 0.5820 }, // I509 wing-mirror rebuild pin WITH measurement (pre-fix 0.3400/0.5468/0.5815, cz -0.5500)",
  "             VR_Wasp_Nose: { p10: 0.9500, p50: 0.9500, p90: 0.9500 } },",
  "};"
].join("\r\n");
t = t.slice(0, startA) + blockA + "\r\n\r\n" + t.slice(endA);
const startB = mustOnce(t, "function enemy451Bake(file, hullMesh, key) {", "enemy451Bake fn");
const endB = mustOnce(t, "test('enemy_hunter.glb:", "hunter test start");
if (endB < startB) throw new Error("region B order");
const blockB = [
  "function remaster4Bake(file, asset) {",
  "  // I509: validate the full remaster-4 COLOR_0 contract per prim and pin per-node facet",
  "  // lumas (reuses enemyFacetLumasPrim - identical algorithm to the I508 legacy-4 test).",
  "  const { buf, json, binOff } = parseGlb(file);",
  "  let colorPrims = 0;",
  "  for (const m of json.meshes || []) for (const p of m.primitives || []) {",
  "    const mn = m.name || 'mesh';",
  "    assert.ok(p.attributes.COLOR_0 !== undefined, mn + ' primitive has COLOR_0 (I509 bake - all prims)');",
  "    colorPrims++;",
  "    const acc = json.accessors[p.attributes.COLOR_0];",
  "    const posAcc = json.accessors[p.attributes.POSITION];",
  "    const bv = json.bufferViews[acc.bufferView];",
  "    const stride = parseInt(acc.type.replace('VEC', ''), 10);",
  "    assert.equal(acc.componentType, 5126, mn + ' COLOR_0 componentType FLOAT');",
  "    assert.equal(acc.type, 'VEC3', mn + ' COLOR_0 type VEC3');",
  "    assert.equal(acc.count, posAcc.count, mn + ' COLOR_0 count == POSITION count');",
  "    assert.ok(bv.byteLength >= acc.count * stride * 4, mn + ' COLOR_0 bufferView spec-size');",
  "    const base = binOff + (bv.byteOffset || 0) + (acc.byteOffset || 0);",
  "    for (let i = 0; i < acc.count; i++) {",
  "      const r = buf.readFloatLE(base + i * stride * 4);",
  "      const g = buf.readFloatLE(base + i * stride * 4 + 4);",
  "      const b = buf.readFloatLE(base + i * stride * 4 + 8);",
  "      assert.ok(Math.abs(r - g) <= 0.02 && Math.abs(g - b) <= 0.02, file + ' COLOR_0 grayscale at ' + i + ': ' + [r, g, b].map((x) => x.toFixed(3)).join(','));",
  "      assert.ok(r >= 0.25 && r <= 1.00, file + ' COLOR_0 in [0.25,1.00] I509 value domain at ' + i + ': ' + r.toFixed(3));",
  "    }",
  "    const f = enemyFacetLumasPrim({ buf, json, binOff }, p);",
  "    const E = ENEMY451_FACET[asset][mn];",
  "    assert.ok(E, mn + ' has an I509 per-prim facet pin');",
  "    for (const k of ['p10', 'p50', 'p90']) {",
  "      assert.ok(Math.abs(f[k] - E[k]) <= 0.005, file + ' ' + mn + ' facet ' + k + ' ' + f[k].toFixed(4) + ' ~ ' + E[k] + ' (I509 bake pin)');",
  "    }",
  "  }",
  "  assert.equal(colorPrims, Object.keys(ENEMY451_FACET[asset]).length, file + ': prim count matches the I509 pin table');",
  "  return { buf, json, binOff };",
  "}"
].join("\r\n");
t = t.slice(0, startB) + blockB + "\r\n" + t.slice(endB);
fs.writeFileSync(p, t);
const v = fs.readFileSync(p, "utf8");
console.log("OK splices 1-3. BOM count:", (v.match(/\uFEFF/g) || []).length, "(was " + bomBefore + ")", "size:", v.length);