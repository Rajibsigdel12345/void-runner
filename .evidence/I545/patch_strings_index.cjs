const fs = require('fs');
// ---- strings.js: insert ui.rotate_hint after each 'menu.start_key' line (per locale) ----
const sp = 'src/core/strings.js';
let s = fs.readFileSync(sp, 'utf8');
const before = s;
const VAL = { en: 'ROTATE TO LANDSCAPE', zh: '\\u8bf7\\u6a2a\\u5c4f\\u6e38\\u73a9', ja: '\\u6a2a\\u5411\\u304b\\u3067\\u30d5\\u30ec\\u30a4\\u3057\\u3066\\u3046\\u3060\\u3055\\u3044\\u3061\\u3042' };
const lines = s.split('\n');
const out = [];
let cur = null, inserted = 0;
for (const line of lines) {
  let sec = null;
  const m = line.match(/^  (en|zh|ja): \{/);
  if (m) sec = m[1];
  if (sec) cur = sec;
  out.push(line);
  const k = line.match(/^(\s*)'menu\.start_key':\s*/);
  if (k && cur && inserted < 3) {
    out.push(k[1] + "'ui.rotate_hint': '" + VAL[cur] + "',");
    inserted++;
  }
}
if (inserted !== 3) { console.error('FATAL: inserted ' + inserted + ' (expected 3)'); process.exit(1); }
s = out.join('\n');
fs.writeFileSync(sp, s, 'utf8');
console.log('strings.js: inserted ' + inserted + ' ui.rotate_hint keys');

// ---- index.html: add viewport-fit=cover to the viewport meta ----
const ip = 'index.html';
let h = fs.readFileSync(ip, 'utf8');
const needle = 'user-scalable=no" />';
const repl = 'user-scalable=no, viewport-fit=cover" />';
if (!h.includes(needle)) { console.error('FATAL: viewport meta anchor not found'); process.exit(1); }
if (h.includes('viewport-fit')) { console.error('FATAL: viewport-fit already present'); process.exit(1); }
h = h.replace(needle, repl);
fs.writeFileSync(ip, h, 'utf8');
console.log('index.html: viewport-fit=cover added');
