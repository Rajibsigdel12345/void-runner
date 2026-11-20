// I545 fix_ja3.cjs: replace the ja ui.rotate_hint escapes with the byte-exact professional-MT reference (ja2.bin), verified at the byte level.
const fs = require('fs');
const path = require('path');
const R = (p) => path.join('E:\\Game', p);
const read = (f) => fs.readFileSync(R(f), 'latin1');
const write = (f, s) => fs.writeFileSync(R(f), Buffer.from(s, 'latin1'));
const s0 = read('src/core/strings.js');
const OLD = "'\\u6a2a\\u5411\\u304d\\u3067\\u30d7\\u30ec\\u30a4\\u3057\\u3066\\u304d\\u3059\\u3060\\u3055\\u3046'";
const refEsc = fs.readFileSync(path.join(__dirname, 'i18n_ref', 'ja2.esc.txt'), 'ascii').trim();
const refBytes = fs.readFileSync(path.join(__dirname, 'i18n_ref', 'ja2.bin'));
// decode the reference escapes and byte-verify against ja2.bin (sanity of my own pipeline)
const decoded = Buffer.from(eval('"' + refEsc + '"'), 'utf8');
if (!decoded.equals(refBytes)) throw new Error('pipeline mismatch: decoded escapes != ja2.bin');
const n = s0.split(OLD).length - 1;
if (n !== 1) throw new Error('ja anchor count ' + n);
const s1 = s0.split(OLD).join("'" + refEsc + "'");
// zh must be untouched
const zh = s1.split("'\\u8bf7\\u6a2a\\u5c4f\\u6e38\\u73a9'").length - 1;
if (zh !== 1) throw new Error('zh anchor count ' + zh);
write('src/core/strings.js', s1);
// final re-read + re-verify
const s2 = read('src/core/strings.js');
const m = s2.match(/'\\u6a2a\\u5411\\u304d\\u3067\\u30d7\\u30ec\\u30a4\\u3057\\u3066([\\u0-9a-f\\]*)/i);
const newSeg = s2.split("'").filter(x => /^\\u/.test(x));
const target = newSeg.find(x => x.startsWith('\\u6a2a\\u5411\\u304d'));
if (!target) throw new Error('new ja escapes not found after write');
const bytes = Buffer.from(eval('"' + target + '"'), 'utf8');
console.log('NEW_JA_CP=' + [...target.match(/\\u[0-9a-f]{4}/g)].length);
console.log('NEW_JA_UTF8_BYTES=' + bytes.length);
console.log('MATCHES_JA2_BIN=' + bytes.equals(refBytes));
console.log('ZH_INTACT=' + (s2.split("'\\u8bf7\\u6a2a\\u5c4f\\u6e38\\u73a9'").length - 1 === 1));
console.log('FIX_JA3 DONE');