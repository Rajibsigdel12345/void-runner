// verify596.cjs (ST-562, I596) - T1 / R1 / E1 verification of luma_i595_post.json vs pre + I519 targets.
const fs = require('fs');
const P = 'E:/Game/.evidence/I595/';
const pre = JSON.parse(fs.readFileSync(P + 'luma_i595_pre.json', 'utf8'));
const post = JSON.parse(fs.readFileSync(P + 'luma_i595_post.json', 'utf8'));
const TGT = { warden: { sky: 119.49, hue: 179.1 }, drone: { sky: 184.08, hue: 189.5 } };
let ok = true;
const fail = (m) => { ok = false; console.log('FAIL ' + m); };
// T1: re-pinned roles within 8 p50 of target (sky)
console.log('--- T1 (post vs I519 target, sky p50, tol 8):');
for (const role of ['warden', 'drone']) {
  const d = +(post.fleet[role].sky.p50 - TGT[role].sky).toFixed(2);
  const pass = Math.abs(d) <= 8;
  if (!pass) fail('T1 ' + role + ' delta ' + d);
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + role + ': post ' + post.fleet[role].sky.p50 + ' vs target ' + TGT[role].sky + ' delta ' + d);
}
// H1 drone hue: within 15 deg of 189.5
{
  const h = post.fleet.drone.sky.hue;
  let dh = Math.abs(h - 189.5); if (dh > 180) dh = 360 - dh;
  const pass = dh <= 15;
  if (!pass) fail('H1 drone hue ' + h + ' off by ' + dh);
  console.log((pass ? 'PASS' : 'FAIL') + ' H1 drone hue: post ' + h + ' vs 189.5 (off ' + dh.toFixed(1) + ')');
}
// R1: 9 regression roles |pre - post| <= 2 (sky p50)
console.log('--- R1 (pre vs post, sky p50, tol 2):');
for (const role of ['hunter', 'sentry', 'wasp', 'phantom', 'hauler', 'bulwark', 'gunship', 'boss', 'ship']) {
  const d = +(post.fleet[role].sky.p50 - pre.fleet[role].sky.p50).toFixed(2);
  const pass = Math.abs(d) <= 2;
  if (!pass) fail('R1 ' + role + ' delta ' + d);
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + role.padEnd(8) + ' pre ' + pre.fleet[role].sky.p50 + ' post ' + post.fleet[role].sky.p50 + ' delta ' + d);
}
// E1 (E57 rule-1): re-tuned roles vs every other audit role (sky p50 + hue); collision iff dluma <= 10 AND dhue <= 40
console.log('--- E1 (E57 rule-1 re-check, post, collision iff dluma<=10 AND dhue<=40):');
const names = ['drone', 'stinger', 'flyer', 'hunter', 'warden', 'sentry', 'wasp', 'phantom', 'hauler', 'bulwark', 'gunship', 'boss', 'ship'];
function hueDist(a, b) { if (a === null || b === null) return 181; let d = Math.abs(a - b); return Math.min(d, 360 - d); }
for (const role of ['warden', 'drone']) {
  const A = post.fleet[role].sky;
  const hits = [];
  for (const o of names) {
    if (o === role) continue;
    const B = post.fleet[o].sky;
    const dl = Math.abs(A.p50 - B.p50), dh = hueDist(A.hue, B.hue);
    if (dl <= 10 && dh <= 40) hits.push(o + ' (dluma ' + dl.toFixed(2) + ' dhue ' + dh.toFixed(1) + ')');
  }
  console.log((hits.length ? 'FAIL' : 'PASS') + ' ' + role + ': ' + (hits.length ? hits.join(' | ') : 'no collisions'));
  if (hits.length) fail('E1 ' + role + ': ' + hits.join(', '));
}
console.log(ok ? 'VERIFY596 PASS' : 'VERIFY596 FAIL');
if (!ok) process.exit(1);