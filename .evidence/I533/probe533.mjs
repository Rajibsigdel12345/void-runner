import fs from "node:fs";
import path from "node:path";
const ASSET_DIR = "E:/Game/assets";
const GLB_MAGIC = 0x46546c67, CHUNK_JSON = 0x4e4f534a, CHUNK_BIN = 0x004e4942;
function parseGlb(file) {
  const buf = fs.readFileSync(path.join(ASSET_DIR, file));
  let off = 12, json = null, binOff = -1;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    if (type === CHUNK_JSON) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString("utf8"));
    else if (type === CHUNK_BIN) binOff = off + 8;
    off += 8 + len;
  }
  return { buf, json, binOff };
}
function tris(prim) { return prim.indices ? prim.indices.count / 3 : prim.attributes.POSITION.count / 3; }
function enemyFacetLumasPrim({ buf, json, binOff }, prim) {
  const cAcc = json.accessors[prim.attributes.COLOR_0];
  const iAcc = json.accessors[prim.indices];
  const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset || 0) + (cAcc.byteOffset || 0);
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset || 0) + (iAcc.byteOffset || 0);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : iAcc.componentType === 5125 ? buf.readUInt32LE(iBase + i * 4) : buf.readUInt8(iBase + i));
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) {
    const i0 = readIdx(t * 3), i1 = readIdx(t * 3 + 1), i2 = readIdx(t * 3 + 2);
    const lum = (i) => { const o = cBase + i * 12; return 0.2126 * buf.readFloatLE(o) + 0.7152 * buf.readFloatLE(o + 4) + 0.0722 * buf.readFloatLE(o + 8); };
    fl.push((lum(i0) + lum(i1) + lum(i2)) / 3);
  }
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
function primExtents({ buf, json, binOff }, meshName) {
  const m = (json.meshes || []).find((mm) => mm.name === meshName);
  const pos = json.accessors[m.primitives[0].attributes.POSITION];
  const bv = json.bufferViews[pos.bufferView];
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity, minz = Infinity, maxz = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const o = binOff + (bv.byteOffset || 0) + (pos.byteOffset || 0) + i * 12;
    const x = buf.readFloatLE(o), y = buf.readFloatLE(o + 4), z = buf.readFloatLE(o + 8);
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
    if (z < minz) minz = z; if (z > maxz) maxz = z;
  }
  return { x: maxx - minx, y: maxy - miny, z: maxz - minz, cx: (minx + maxx) / 2, cz: (minz + maxz) / 2 };
}
const { buf, json, binOff } = parseGlb("enemy_phantom.glb");
console.log("BYTES", buf.length, "KB", (buf.length / 1024).toFixed(3));
let total = 0;
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  const t = tris(p); total += t;
  const f = enemyFacetLumasPrim({ buf, json, binOff }, p);
  const e = primExtents({ buf, json, binOff }, m.name);
  console.log("PRIM", m.name, "tris", t,
    "x", e.x.toFixed(4), "y", e.y.toFixed(4), "z", e.z.toFixed(4), "cx", e.cx.toFixed(4), "cz", e.cz.toFixed(4),
    "p10", f.p10.toFixed(4), "p50", f.p50.toFixed(4), "p90", f.p90.toFixed(4));
}
console.log("TOTAL_TRIS", total);
