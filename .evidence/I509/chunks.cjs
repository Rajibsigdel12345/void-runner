const fs = require('fs');
const buf = fs.readFileSync('assets/enemy_sentry.glb');
console.log('magic', buf.readUInt32LE(0).toString(16), 'ver', buf.readUInt32LE(4), 'len', buf.readUInt32LE(8));
let off = 12;
for (let c = 0; c < 2; c++) {
  const clen = buf.readUInt32LE(off), ctype = buf.readUInt32LE(off + 4);
  console.log('chunk', c, 'type', ctype.toString(16), 'len', clen, 'dataOff', off + 8, 'end', off + 8 + clen);
  off = off + 8 + ((clen + 3) & ~3);
}
const jsonLen = buf.readUInt32LE(12);
console.log('jsonLen', jsonLen, 'padded', (jsonLen + 3) & ~3);
console.log('binOff(+8) =', 20 + ((jsonLen + 3) & ~3) + 8, '| binOff(+12) =', 20 + ((jsonLen + 3) & ~3) + 12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const m = json.meshes.find((mm) => mm.name === 'VR_Sentry_Barrel');
const pos = json.accessors[m.primitives[0].attributes.POSITION];
const bv = json.bufferViews[pos.bufferView];
console.log('pos accessor: count', pos.count, 'compType', pos.componentType, 'type', pos.type, 'min', JSON.stringify(pos.min), 'max', JSON.stringify(pos.max), 'bufferView', JSON.stringify(bv));