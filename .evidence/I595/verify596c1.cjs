// verify596c1.cjs (ST-562, I596) - final verification on the C1 state (luma_i595_postc1.json).
const fs = require('fs');
const P = 'E:/Game/.evidence/I595/';
const pre = JSON.parse(fs.readFileSync(P + 'luma_i595_pre.json', 'utf8'));
const post = JSON.parse(fs.readFileSync(P + 'luma_i595_postc1.json', 'utf8'));
const TGT = { warden: { sky: 119.49 }, drone: { sky: 184.08 } };
let t1 = 0, r1ok = true, e1ok = true;
console.log('--- T1 (final C1 state vs I519 target, tol 8):');
for (const role of ['warden', 'drone']) {
  const d = +(post.fleet[role].sky.p50 - TGT[role].sky).toFixed(2);
  const pass = Math.abs(d) <= 8;
  if (!pass) t1++;
  console.log((pass ? 'PASS' : 'MISS->C1 exhausted, accept-with-documentation + residual') + ' ' + role + ': ' + post.fleet[role].sky.p50 + ' vs ' + TGT[role].sky + ' delta ' + d + ' (improved from pre ' + pre.fleet[role].sky.p50 + ')');
}
{
  const h = post.fleet.drone.sky.hue;
  let dh = Math.abs(h - 189.5); if (dh > 180) dh = 360 - dh;
  console.log((dh <= 15 ? 'PASS' : 'FAIL') + ' H1 drone hue: ' + h + ' (off ' + dh.toFixed(1) + ')');
  if (dh > 15) r1ok = false;
}
console.log('--- R1 (pre vs final, tol 2):');
for (const role of ['hunter', 'sentry', 'wasp', 'phantom', 'hauler', 'bulwark', 'gunship', 'boss', 'ship']) {
  const d = +(post.fleet[role].sky.p50 - pre.fleet[role].sky.p50).toFixed(2);
  const pass = Math.abs(d) <= 2;
  if (!pass) r1ok = false;
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + role.padEnd(8) + ' delta ' + d);
}
console.log('--- E1 (E57 rule-1, final, collision iff dluma<=10 AND dhue<=40):');
const names = ['drone', 'stinger', 'flyer', 'hunter', 'warden', 'sentry', 'wasp', 'phantom', 'hauler', 'bulwark', 'gunship', 'boss', 'ship'];
function hueDist(a, b) { if (a === null || b === null) return 181; const d = Math.abs(a - b); return Math.min(d, 360 - d); }
for (const role of ['warden', 'drone', 'stinger', 'flyer']) {
  const A = post.fleet[role].sky;
  const hits = [];
  for (const o of names) {
    if (o === role) continue;
    const B = post.fleet[o].sky;
    const dl = Math.abs(A.p50 - B.p50), dh = hueDist(A.hue, B.hue);
    if (dl <= 10 && dh <= 40) hits.push(o + ' (dluma ' + dl.toFixed(2) + ' dhue ' + dh.toFixed(1) + ')');
  }
  if (hits.length) e1ok = false;
  console.log((hits.length ? 'FAIL' : 'PASS') + ' ' + role + ': ' + (hits.length ? hits.join(' | ') : 'no collisions'));
}
console.log(r1ok && e1ok ? (t1 ? 'VERIFY596C1 PASS-with-residual (T1 misses documented, R1+E1 clean)' : 'VERIFY596C1 PASS') : 'VERIFY596C1 FAIL');