import fs from 'fs';
function jsonOf(p) {
  const b = fs.readFileSync(p);
  let off = 12, jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  return JSON.parse(b.subarray(off + 8, off + 8 + jsonLen));
}
for (const f of ['hunter', 'gunship', 'sentry', 'wasp']) {
  const j = jsonOf('.evidence/I509/' + f + '.glb');
  console.log(f, 'MATERIALS:', JSON.stringify((j.materials || []).map(m => m.name)));
}