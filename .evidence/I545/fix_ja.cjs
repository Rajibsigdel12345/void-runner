const fs = require('fs');
const oldJa = '\\u6a2a\\u5411\\u304b\\u3067\\u30d5\\u30ec\\u30a4\\u3057\\u3066\\u3046\\u3060\\u3055\\u3044\\u3061\\u3042';
const newJa = '\\u6a2a\\u5411\\u304d\\u3067\\u30d7\\u30ec\\u30a4\\u30fc\\u3057\\u3066\\u3059\\u3060\\u3055\\u3046';
for (const p of ['src/core/strings.js', '.evidence/I545/smoke545.mjs']) {
  let t = fs.readFileSync(p, 'utf8');
  const n = t.split(oldJa).length - 1;
  if (n !== 1) { console.log('SKIP ' + p + ' (count ' + n + ')'); continue; }
  t = t.replace(oldJa, newJa);
  fs.writeFileSync(p, t, 'utf8');
  console.log('FIXED ' + p);
}
console.log('decoded newJa = ' + JSON.stringify(String.fromCharCode(0x6a2a,0x5411,0x304d,0x3067,0x30d7,0x30ec,0x30a4,0x30fc,0x3057,0x3066,0x3059,0x3060,0x3055,0x3046)));
