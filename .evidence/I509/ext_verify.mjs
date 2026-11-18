import fs from 'fs';
function jsonOf(p) {
  const b = fs.readFileSync(p);
  let off = 12, jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  return { b, json: JSON.parse(b.subarray(off + 8, off + 8 + jsonLen)), binOff: off + 8 + jsonLen };
}
const files = { hunter: 'VR_Hunter_Hull', gunship: 'VR_Gunship_Hull', sentry: 'VR_Sentry_Platform', wasp: 'VR_Wasp_Hull' };
for (const [f, key] of Object.entries(files)) {
  const { b, json, binOff } = jsonOf('.evidence/I509/' + f + '.glb');
  for (const m of json.meshes) {
    const pos = json.accessors[m.primitives[0].attributes.POSITION];
    const bv = json.bufferViews[pos.bufferView];
    let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
    for (let i = 0; i < pos.count; i++) {
      const o = binOff + (bv.byteOffset || 0) + (pos.byteOffset || 0) + i * 12;
      const x = b.readFloatLE(o), y = b.readFloatLE(o + 4), z = b.readFloatLE(o + 8);
      if (x<mnx)mnx=x; if (x>mxx)mxx=x; if (y<mny)mny=y; if (y>mxy)mxy=y; if (z<mnz)mnz=z; if (z>mxz)mxz=z;
    }
    console.log(m.name,
      'x', (mxx-mnx).toFixed(4), 'cx', ((mnx+mxx)/2).toFixed(4),
      'y', (mxy-mny).toFixed(4), 'cy', ((mny+mxy)/2).toFixed(4),
      'z', (mxz-mnz).toFixed(4), 'cz', ((mnz+mxz)/2).toFixed(4));
  }
}