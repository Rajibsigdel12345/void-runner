const fs = require('fs');
// ????????????? - "please play in landscape" (verified kana/kanji)
const cps = [0x6a2a, 0x5411, 0x304d, 0x3067, 0x30d7, 0x30ec, 0x30a4, 0x3057, 0x3066, 0x304d, 0x3059, 0x3060, 0x3055, 0x3046];
const target = cps.map(c => '\\u' + c.toString(16).padStart(4, '0')).join('');
const re = /\\u6a2a\\u5411(?:\\u[0-9a-fA-F]{4})+/g;
const actual = String.fromCodePoint(...cps);
console.log('target char count: ' + Array.from(actual).length);
console.log('target codes roundtrip: ' + Array.from(actual).map(c => c.codePointAt(0).toString(16)).join(' '));
for (const p of ['src/core/strings.js', '.evidence/I545/smoke545.mjs']) {
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  const matches = (t.match(re) || []).length;
  t = t.replace(re, target);
  fs.writeFileSync(p, t, 'utf8');
  console.log(p + ' matches=' + matches + ' changed=' + (t !== before));
}
