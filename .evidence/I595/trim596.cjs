// trim596.cjs (ST-562, I596) - shorten the C1 comments to keep the dist delta near the pre-registered ~200 B budget.
const fs = require('fs');
const cfg = 'E:/Game/src/core/config.js';
let s = fs.readFileSync(cfg, 'latin1');
function count(str, a) { let n = 0, i = 0; while ((i = str.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function patch(anchor, repl) {
  if (count(s, anchor) !== 1) throw new Error('anchor count != 1: ' + anchor.slice(0, 60));
  s = s.replace(anchor, repl);
}
patch(
  'renderLumaGain: 3.13, // I596/ST-562 E85 re-tune (G1 + C1): v2 bake renders 145.02 pre (rung 119.49) -> 3.71 first pin rendered 141.81 [armor 0x8fa3c8 base saturates to white at gain > 1.78, so the linear G1 rule under-corrects: saturation + ACES nonlinearity, R-1 realized]; C1 = round2(3.71 x 119.49/141.81) = 3.13 (WITH MEASUREMENT: luma_i595_pre/post.json; hue 177 teal identity retained)',
  'renderLumaGain: 3.13, // I596/ST-562 E85 re-tune (G1+C1): v2 bake renders 145.02 pre (rung 119.49); first pin 3.71 rendered 141.81 - armor 0x8fa3c8 base saturates white at gain > 1.78, so the linear rule under-corrects (R-1: saturation + ACES); C1 = round2(3.71 x 119.49/141.81) (WITH MEASUREMENT: luma_i595_pre/post.json; hue 177 teal)'
);
patch(
  'palette: { body: { color: 0x637886 } }, // I596/ST-562 E85 re-tune (H1 + C1): v2 bake renders 194.63 pre (rung 184.08) -> 0x69808e first pin rendered 195.63 [emissive 0x37d5ff x0.7-1.0 adds on top of the base, so the hex lever under-corrects: additive emissive share, R-1 realized]; C1 per-channel x' + 0.94096 + ' -> 99/120/134 = 0x637886 (WITH MEASUREMENT: luma_i595_pre/post.json; hue 189.5 steel-cyan identity retained)',
  'palette: { body: { color: 0x637886 } }, // I596/ST-562 E85 re-tune (H1+C1): v2 bake renders 194.63 pre (rung 184.08); first pin 0x69808e rendered 195.63 - additive emissive 0x37d5ff x0.7-1.0 dominates the base share (R-1); C1 per-channel x0.94096 -> 99/120/134 (WITH MEASUREMENT: luma_i595_pre/post.json; hue 189.5 steel-cyan)'
);
fs.writeFileSync(cfg, s, 'latin1');
console.log('TRIM596 PASS');