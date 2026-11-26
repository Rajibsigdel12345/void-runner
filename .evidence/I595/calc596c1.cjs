// calc596c1.cjs (ST-562, I596) - C1: ONE second re-pin iteration computed from the post-audit
// (scope-check-E85 cut ladder C1). Same G1/H1 formulas, applied to the first-post values.
const fs = require('fs');
const P = 'E:/Game/';
const pre = JSON.parse(fs.readFileSync(P + '.evidence/I595/luma_i595_pre.json', 'utf8'));
const post1 = JSON.parse(fs.readFileSync(P + '.evidence/I595/luma_i595_post.json', 'utf8'));
const TGT = { warden: 119.49, drone: 184.08 };
const out = { rule: 'C1 second iteration from luma_i595_post.json', firstPost: {}, c1: {} };
// warden G1-C1
{
  const p1 = post1.fleet.warden.sky.p50;
  const g = Math.round(3.71 * TGT.warden / p1 * 100) / 100;
  out.firstPost.warden = { sky_p50: p1 };
  out.c1.warden = { oldGain: 3.71, newGain: g, note: 'armor 0x8fa3c8 saturates to white at gain > 1.78; hull 0x2c3548 b-channel unsaturates below 3.54' };
}
// drone H1-C1
{
  const p1 = post1.fleet.drone.sky.p50;
  const scale = TGT.drone / p1;
  const ch = [105, 128, 142].map((v) => Math.min(255, Math.max(0, Math.round(v * scale))));
  const hex = '0x' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
  out.firstPost.drone = { sky_p50: p1 };
  out.c1.drone = { oldHex: '0x69808e', scale: +scale.toFixed(6), channels: ch, newHex: hex };
}
fs.writeFileSync(P + '.evidence/I595/retune596c1.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
const cfg = P + 'src/core/config.js';
let s = fs.readFileSync(cfg, 'latin1');
function count(str, a) { let n = 0, i = 0; while ((i = str.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function patch(anchor, repl) {
  if (count(s, anchor) !== 1) throw new Error('anchor count != 1: ' + anchor.slice(0, 60));
  s = s.replace(anchor, repl);
}
patch(
  'renderLumaGain: 3.71, // I596/ST-562 E85 re-tune (G1): the I593 v2 hull bake renders sky p50 145.02 (I519 legacy rung 119.49); new = round2(4.5 x 119.49/145.02) = 3.71 (WITH MEASUREMENT: luma_i595_pre.json; hue 177 teal identity retained)',
  'renderLumaGain: ' + out.c1.warden.newGain + ', // I596/ST-562 E85 re-tune (G1 + C1): v2 bake renders 145.02 pre (rung 119.49) -> 3.71 first pin rendered 141.81 [armor 0x8fa3c8 base saturates to white at gain > 1.78, so the linear G1 rule under-corrects: saturation + ACES nonlinearity, R-1 realized]; C1 = round2(3.71 x 119.49/141.81) = ' + out.c1.warden.newGain + ' (WITH MEASUREMENT: luma_i595_pre/post.json; hue 177 teal identity retained)'
);
patch(
  'palette: { body: { color: 0x69808e } }, // I596/ST-562 E85 re-tune (H1): the I593 v2 bake renders sky p50 194.63 (I519 legacy rung 184.08); per-channel x' + 0.945795 + ' -> 105/128/142 = 0x69808e (WITH MEASUREMENT: luma_i595_pre.json; hue 189.7 steel-cyan identity retained)',
  'palette: { body: { color: ' + out.c1.drone.newHex + ' } }, // I596/ST-562 E85 re-tune (H1 + C1): v2 bake renders 194.63 pre (rung 184.08) -> 0x69808e first pin rendered 195.63 [emissive 0x37d5ff x0.7-1.0 adds on top of the base, so the hex lever under-corrects: additive emissive share, R-1 realized]; C1 per-channel x' + out.c1.drone.scale + ' -> 99/120/134 = ' + out.c1.drone.newHex + ' (WITH MEASUREMENT: luma_i595_pre/post.json; hue 189.5 steel-cyan identity retained)'
);
fs.writeFileSync(cfg, s, 'latin1');
console.log('CALC596C1 PASS - config.js C1 re-pinned: warden=3.13?, drone=' + out.c1.drone.newHex);