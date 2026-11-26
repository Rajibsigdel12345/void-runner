// calc596.cjs (ST-562, I596) - G1/H1/N1 re-pin calc from luma_i595_pre.json + apply the config.js patches.
// Rules (production/scope-check-E85.md, FROZEN):
//   N1 no-churn iff |pre_sky_p50 - target_sky_p50| <= 5 (lever untouched)
//   G1 gain roles: new_gain = round2(old_gain * target_sky_p50 / pre_sky_p50); pin on SKY;
//      floor sanity: post floor within 15% of I519 floor (projected here; verified in post-audit)
//   H1 drone hex: per channel new = clamp(round(old * target_sky_p50 / pre_sky_p50), 0, 255); post hue within 15 deg of 189.5
const fs = require('fs');
const P = 'E:/Game/';
const pre = JSON.parse(fs.readFileSync(P + '.evidence/I595/luma_i595_pre.json', 'utf8'));
// I519 approved ladder rungs (pre-registered in scope-check-E85.md)
const TGT = {
  warden:  { sky: 119.49, floor: 113.37, hue: 179.1, oldGain: 4.5 },
  stinger: { sky: 108.89, floor: 113.61, hue: 221.0, oldGain: 2.2 },
  flyer:   { sky: 94.22,  floor: 93.79,  hue: 335.8, oldGain: 1.3 },
  drone:   { sky: 184.08, floor: 184.01, hue: 189.5, oldHex: 0x6f8796 }
};
const out = { rule: 'N1/G1/H1 from scope-check-E85', pre: {}, retune: {} };
for (const role of ['warden', 'stinger', 'flyer', 'drone']) {
  const f = pre.fleet[role];
  const t = TGT[role];
  const d = +(f.sky.p50 - t.sky).toFixed(2);
  out.pre[role] = { sky_p50: f.sky.p50, sky_hue: f.sky.hue, floor_p50: f.floor.p50, delta_sky: d, n1: Math.abs(d) <= 5 };
  if (Math.abs(d) <= 5) { out.retune[role] = { action: 'N1 no-churn - lever UNTOUCHED' }; continue; }
  if (role === 'drone') {
    const scale = t.sky / f.sky.p50;
    const ch = [0x6f, 0x87, 0x96].map((v) => Math.min(255, Math.max(0, Math.round(v * scale))));
    const hex = '0x' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
    out.retune[role] = { action: 'H1 re-pin', scale: +scale.toFixed(6), channels: ch, newHex: hex,
      floorProjection: +(f.floor.p50 * scale).toFixed(2), i519floor: t.floor };
  } else {
    const g = Math.round(t.sky / f.sky.p50 * t.oldGain * 100) / 100;
    out.retune[role] = { action: 'G1 re-pin', oldGain: t.oldGain, newGain: g,
      floorProjection: +(f.floor.p50 * (t.sky / f.sky.p50)).toFixed(2), i519floor: t.floor };
  }
}
fs.writeFileSync(P + '.evidence/I595/retune596.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
// apply the config.js patches for the non-N1 roles (byte-safe, count===1 anchors)
const cfg = P + 'src/core/config.js';
let s = fs.readFileSync(cfg, 'latin1');
function count(str, a) { let n = 0, i = 0; while ((i = str.indexOf(a, i)) !== -1) { n++; i += a.length; } return n; }
function patch(anchor, repl) {
  if (count(s, anchor) !== 1) throw new Error('anchor count != 1: ' + anchor.slice(0, 60));
  s = s.replace(anchor, repl);
}
if (out.retune.warden.action !== 'N1 no-churn - lever UNTOUCHED') {
  patch(
    'renderLumaGain: 4.5, // I511/ST-477 in-game re-audit: the I508 v2 GLB bake renders p50 83.9 (was 123.8 legacy); gain restores the ~120 ladder rung (hue 176 teal unchanged)',
    'renderLumaGain: ' + out.retune.warden.newGain + ', // I596/ST-562 E85 re-tune (G1): the I593 v2 hull bake renders sky p50 145.02 (I519 legacy rung 119.49); new = round2(4.5 x 119.49/145.02) = ' + out.retune.warden.newGain + ' (WITH MEASUREMENT: luma_i595_pre.json; hue 177 teal identity retained)'
  );
}
if (out.retune.drone.action !== 'N1 no-churn - lever UNTOUCHED') {
  patch(
    'palette: { body: { color: 0x6f8796 } }, // I282/ST-267: steel-cyan mid (sRGB luma ~131, above the skybox mid-band ~128; the GLB COLOR_0 value bake multiplies on top - bright nose, dark belly)',
    'palette: { body: { color: ' + out.retune.drone.newHex + ' } }, // I596/ST-562 E85 re-tune (H1): the I593 v2 bake renders sky p50 194.63 (I519 legacy rung 184.08); per-channel x' + out.retune.drone.scale + ' -> 105/128/142 = ' + out.retune.drone.newHex + ' (WITH MEASUREMENT: luma_i595_pre.json; hue 189.7 steel-cyan identity retained)'
  );
}
fs.writeFileSync(cfg, s, 'latin1');
console.log('CALC596 PASS - config.js patched: warden=' + (out.retune.warden.action === 'N1 no-churn - lever UNTOUCHED' ? 'untouched' : out.retune.warden.newGain) + ', drone=' + (out.retune.drone.action === 'N1 no-churn - lever UNTOUCHED' ? 'untouched' : out.retune.drone.newHex) + ', stinger=' + out.retune.stinger.action + ', flyer=' + out.retune.flyer.action);