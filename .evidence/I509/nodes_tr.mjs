import fs from 'fs';
function jsonOf(p) {
  const b = fs.readFileSync(p);
  let off = 12, jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  return JSON.parse(b.subarray(off + 8, off + 8 + jsonLen));
}
for (const [label, p] of [['NEW hunter', '.evidence/I509/hunter.glb'], ['OLD hunter', 'assets/enemy_hunter.glb'], ['NEW sentry', '.evidence/I509/sentry.glb']]) {
  const j = jsonOf(p);
  console.log('== ' + label);
  console.log('  scenes:', JSON.stringify(j.scenes));
  for (const n of j.nodes) {
    console.log('  node', n.name, 'mesh=' + n.mesh, 'children=' + JSON.stringify(n.children || []), 'tr=' + JSON.stringify({ t: n.translation, r: n.rotation, s: n.scale }));
  }
}