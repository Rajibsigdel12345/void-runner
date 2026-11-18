import fs from 'fs';
function jsonOf(p) {
  const b = fs.readFileSync(p);
  let off = 12, jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  return { b, json: JSON.parse(b.subarray(off + 8, off + 8 + jsonLen)), binOff: off + 8 + jsonLen };
}
const { b, json, binOff } = jsonOf('.evidence/I509/wasp.glb');
const m = json.meshes.find(mm => mm.name === 'VR_Wasp_Wing');
const pos = json.accessors[m.primitives[0].attributes.POSITION];
const bv = json.bufferViews[pos.bufferView];
let ys = [];
for (let i = 0; i < pos.count; i++) {
  const o = binOff + (bv.byteOffset || 0) + (pos.byteOffset || 0) + i * 12;
  ys.push(-b.readFloatLE(o + 8)); // glTF z -> Blender y (sign-flipped)
}
ys.sort((a, b2) => a - b2);
const q = f => ys[Math.floor(f * ys.length)];
console.log('wing Blender-y: min', ys[0].toFixed(3), 'max', ys[ys.length-1].toFixed(3), 'p10', q(0.1).toFixed(3), 'p50', q(0.5).toFixed(3), 'p90', q(0.9).toFixed(3), 'n', ys.length);
// gap analysis: histogram in 0.05 bins
const bins = {};
for (const v of ys) { const k = Math.floor(v / 0.05); bins[k] = (bins[k] || 0) + 1; }
const keys = Object.keys(bins).map(Number).sort((a, b2) => a - b2);
let out = '';
for (const k of keys) out += (k * 0.05).toFixed(2) + ':' + bins[k] + '  ';
console.log(out);