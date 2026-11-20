const fs = require('fs');
const p = 'src/core/config.js';
let s = fs.readFileSync(p, 'latin1');
const old = 'cockpitLookDrop: 1.2,   // I504 (ST-470): COCKPIT look point drops this far below the eye (gentle ~1.1 deg down-pitch at lookFar 60; frames the nose/canopy at the bottom)';
const neu = 'cockpitLookDrop: 4.0,   // I550 (ST-516): G-c cockpit bow framing - look point drops this far below the eye (~3.8 deg down-pitch at lookFar 60; 2405-vert bow sweep: 644 in-frame, yMin -0.967, centerBand 12, horizonY 0.109, minD 0.433 -> bow frames the bottom, crosshair zone clean; supersedes I504 1.2 which left the nose below the frame)';
if (!s.includes(old)) { console.error('OLD NOT FOUND'); process.exit(1); }
s = s.replace(old, neu);
fs.writeFileSync(p, s, 'latin1');
console.log('patched config.js');
