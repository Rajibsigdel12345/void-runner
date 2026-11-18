import fs from 'fs';
const buf = fs.readFileSync('assets/ship.glb');
// GLB: total len, ver, type | chunk len, type, data
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen));
const binOff = 20 + jsonLen; // JSON chunk (padded to 4) + BIN chunk header
// recompute binOff properly: JSON chunk data starts at 20, length jsonLen padded
const jsonPad = (4 - (jsonLen % 4)) % 4;
const binChunkLen = buf.readUInt32LE(20 + jsonLen + jsonPad);
const binStart = 20 + jsonLen + jsonPad + 8;
const o = (acc, bv) => binStart + (json.bufferViews[bv].byteOffset || 0) + (acc.byteOffset || 0);
const out = {};
let colorPrims = 0;
for (const m of json.meshes || []) for (const p of m.primitives || []) {
  if (p.attributes.COLOR_0 === undefined) continue;
  colorPrims++;
  const acc = json.accessors[p.attributes.COLOR_0];
  const base = o(acc, acc.bufferView);
  const iAcc = json.accessors[p.indices];
  const iBase = o(iAcc, iAcc.bufferView);
  const readIdx = (i) => (iAcc.componentType === 5123 ? buf.readUInt16LE(iBase + i * 2) : buf.readUInt32LE(iBase + i * 4));
  const lum = (i) => 0.2126 * buf.readFloatLE(base + i * 12) + 0.7152 * buf.readFloatLE(base + i * 12 + 4) + 0.0722 * buf.readFloatLE(base + i * 12 + 8);
  const fl = [];
  for (let t = 0; t < iAcc.count / 3; t++) fl.push((lum(readIdx(t * 3)) + lum(readIdx(t * 3 + 1)) + lum(readIdx(t * 3 + 2))) / 3);
  fl.sort((a, b) => a - b);
  const q = (f) => fl[Math.min(fl.length - 1, Math.floor(f * fl.length))];
  out[m.name] = { n: fl.length, p10: q(0.1), p50: q(0.5), p90: q(0.9), spread: +(q(0.9) - q(0.1)).toFixed(4) };
}
console.log('colorPrims', colorPrims, JSON.stringify(out, null, 1));
