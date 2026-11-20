const fs = require('fs');
const s = fs.readFileSync('src/core/strings.js', 'latin1');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.indexOf("'menu.start_key'") >= 0 || l.indexOf("'menu.start_tap'") >= 0 || l.indexOf("'menu.mode_endless'") >= 0 || l.indexOf("'menu.mode_campaign'") >= 0) {
    console.log((i + 1) + ': ' + JSON.stringify(l));
  }
});
console.log('--- BOM:', s.charCodeAt(0) === 0xfeff);
console.log('--- CRLF:', (s.match(/\r\n/g) || []).length, 'LF-only:', (s.match(/\n/g) || []).length - (s.match(/\r\n/g) || []).length);