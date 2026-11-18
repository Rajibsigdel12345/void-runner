import fs from 'fs';
const files = {
  hunter: 'assets_tmp_hunter.glb',
  gunship: 'assets_tmp_gunship.glb',
  sentry: 'assets_tmp_sentry.glb',
  wasp: 'assets_tmp_wasp.glb'
};
const real = { hunter: '.evidence/I509/hunter.glb', gunship: '.evidence/I509/gunship.glb', sentry: '.evidence/I509/sentry.glb', wasp: '.evidence/I509/wasp.glb' };
for (const [k, p] of Object.entries(real)) {
  const b = fs.readFileSync(p);
  const len = b.readUInt32LE(4), ver = b.readUInt32LE(8);
  // find JSON chunk: magic 0x4E4F534A ('JSON')
  let off = 12; let jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  const json = JSON.parse(b.subarray(off + 8, off + 8 + jsonLen));
  const names = json.nodes.map(n => n.name);
  const meshes = json.meshes.map(m => m.name);
  console.log(k, 'NODES:', JSON.stringify(names));
  console.log(k, 'MESHES:', JSON.stringify(meshes));
}