const fs = require("fs");
const p = "tests/assetGlbs.test.js";
const s = fs.readFileSync(p, "utf8");
const anchor = "test('drone/stinger/flyer: every prim carries the I508 grayscale COLOR_0";
const i = s.indexOf(anchor);
if (i < 0) throw new Error("anchor not found");
if (s.includes("function enemyFacetLumas(")) throw new Error("already present");
const add = [
  "// Legacy whole-file reader (I451 hunter / I482 wasp): pools per-face luma over every",
  "// COLOR_0 prim (legacy files carry exactly one, so identical to the I508 prim reader).",
  "function enemyFacetLumas({ buf, json, binOff }) {",
  "  const fl = [];",
  "  for (const m of json.meshes || []) for (const pr of m.primitives || []) {",
  "    if (pr.attributes.COLOR_0 === undefined) continue;",
  "    const cAcc = json.accessors[pr.attributes.COLOR_0];",
  "    const iAcc = json.accessors[pr.indices];",
  "    const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);",
  "    const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);",
  "    const readIdx = (j) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + j * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + j * 4) : buf.readUInt8(iBase + j));",
  "    for (let t = 0; t < iAcc.count / 3; t++) {",
  "      const i0 = readIdx(t * 3), i1 = readIdx(t * 3 + 1), i2 = readIdx(t * 3 + 2);",
  "      const lum = (j) => { const o = cBase + j * 12; return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8); };",
  "      fl.push((lum(i0) + lum(i1) + lum(i2)) / 3);",
  "    }",
  "  }",
  "  fl.sort((a, b) => a - b);",
  "  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];",
  "  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };",
  "}",
  "",
].join("\r\n");
fs.writeFileSync(p, s.slice(0, i) + add + s.slice(i), "utf8");
const s2 = fs.readFileSync(p, "utf8");
console.log("inserted ok; BOM count:", (s2.match(/\uFEFF/g) || []).length);
