import fs from 'fs';
function nodesOf(p) {
  const b = fs.readFileSync(p);
  let off = 12, jsonLen = 0;
  while (off < b.length) { const cl = b.readUInt32LE(off), ct = b.readUInt32LE(off + 4); if (ct === 0x4e4f534a) { jsonLen = cl; break; } off += 8 + cl; }
  const json = JSON.parse(b.subarray(off + 8, off + 8 + jsonLen));
  return { names: json.nodes.map(n => n.name), scenes: json.scenes, json };
}
for (const f of ['enemy_hunter', 'enemy_gunship', 'enemy_sentry', 'enemy_wasp']) {
  const r = nodesOf('assets/' + f + '.glb');
  console.log(f, 'NODES:', JSON.stringify(r.names), 'SCENES:', JSON.stringify(r.scenes));
}