const fs = require('fs');
const p = 'CHANGELOG.md';
let s = fs.readFileSync(p, 'latin1');
const old = '## [Unreleased]\r\n- I546:';
const neu = '## [Unreleased]\r\n- I550: In the cockpit (first-person) view you can now see your own ship - the bow deck sits at the bottom of the screen in front of the crosshair, so it feels like you are sitting in a cockpit looking over your own bow. A small camera-tuning round; no gameplay, ship, or menu changes. The menu text is available in English, Chinese, and Japanese. The downloadable bundle is 5,559,213 bytes - under the 6.1 MB limit.\r\n- I546:';
if (!s.includes(old)) { console.error('OLD NOT FOUND'); process.exit(1); }
fs.writeFileSync(p, s.replace(old, neu), 'latin1');
console.log('CHANGELOG patched');
