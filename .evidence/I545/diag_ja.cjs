const fs = require('fs');
const t = fs.readFileSync('src/core/strings.js', 'utf8');
const m = t.match(/'ui\.rotate_hint': '([^']*)'/g) || [];
// only the ja one starts with \u6a2a
for (const line of m) {
  const val = line.slice(line.indexOf(":'") + 2, -1);
  if (val.includes('\\u6a2a')) {
    const codes = val.match(/\\u[0-9a-fA-F]{4}/g).map(x => x.slice(2)).join(' ');
    console.log('ja current codes: ' + codes);
    console.log('ja current len: ' + (val.match(/\\u[0-9a-fA-F]{4}/g) || []).length);
  }
}
