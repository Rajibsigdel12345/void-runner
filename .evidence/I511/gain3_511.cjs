const fs = require('fs');
const p = 'E:/Game/src/core/config.js';
let s = fs.readFileSync(p, 'utf8');
function splice(oldStr, newStr, label) {
  const c = s.split(oldStr).length - 1;
  if (c !== 1) throw new Error(label + ': ' + c + ' occurrences');
  s = s.replace(oldStr, newStr);
  console.log('ok: ' + label);
}
splice('renderLumaGain: 6.0,', 'renderLumaGain: 4.0,', 'wasp gain 6.0 -> 4.0');
// wasp line must carry the chartreuse marker - verify
const wl = s.split('\n').find((l) => l.includes('renderLumaGain: 4.0,') && l.includes('chartreuse rung'));
if (!wl) throw new Error('wasp 4.0 line marker check failed');
splice('body: { color: 0x344250 },    // slate (I511/ST-477: sRGB luma 64.0, hue 210.0, sat 35%',
       'body: { color: 0x334550 },    // slate (I511/ST-477 iter3 hue-nudge: sRGB luma 66.0, hue 202.8, sat 36% (was 0x344250 luma 64.0 hue 210.0 - iter2 rendered hue 222.5 gave gunship x boss dhue 36.6, inside the E57 AND-test band; target rendered hue <= 219)',
       'gunship hex 0x344250 -> 0x334550 (L476)');
splice('slate 0x344250 body (I511/ST-477; was gunmetal 0x39424e)',
       'slate 0x334550 body (I511/ST-477; iter3 hue-nudge from 0x344250; was gunmetal 0x39424e)',
       'gunship comment L470');
splice('0x344250 - definite hue h210', '0x334550 - definite hue h202.8 (iter3)', 'gunship paletteMap comment L36');
fs.writeFileSync(p, s, 'utf8');
console.log('gain3 applied');
