const fs = require('fs');
const p = 'src/main.js';
const buf = fs.readFileSync(p);
const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
let s = buf.toString('utf8');
if (hasBom) s = s.slice(1);
function rep(old, nw, tag) {
  const n = s.split(old).length - 1;
  if (n !== 1) throw new Error(tag + ' count ' + n + ' (expected 1)');
  s = s.replace(old, nw);
}
rep("import { createInput } from './render/input.js';",
    "import { createInput, stickGeom } from './render/input.js';", 'L12');
rep("import { createTouchStick } from './render/touchStick.js'; // ST-321 (I351): on-screen thrust stick (coarse-only)",
    "import { createTouchStick } from './render/touchStick.js'; // ST-321 (I351): on-screen thrust stick (coarse-only)\nimport { createRotateHint } from './render/rotateHint.js'; // ST-511 (I545, E74 D2): rotate-to-landscape hint (coarse+portrait only)",
    'L55');
rep("const touchStick = coarse ? createTouchStick() : { sync: function () {} }; // ST-321 (I351): on-screen thrust stick - created ONLY on touch (zero DOM on mouse/keyboard)",
    "const touchStick = coarse ? createTouchStick() : { sync: function () {} }; // ST-321 (I351): on-screen thrust stick - created ONLY on touch (zero DOM on mouse/keyboard)\nconst rotateHint = coarse ? createRotateHint(document.body) : { setLabel() {}, el: null, visible: false, dispose() {} }; // ST-511 (I545) D2: rotate-to-landscape hint (touch + portrait only)\nrotateHint.setLabel(tr('ui.rotate_hint'));\nonLocale(() => rotateHint.setLabel(tr('ui.rotate_hint'))); // ST-375: live re-emit",
    'L747');
rep("juiceTally: () => juiceTally.snapshot(), input, advance, storage,",
    "juiceTally: () => juiceTally.snapshot(), input, rotateHint, stickGeom, advance, storage,",
    'L850');
let out = s;
if (hasBom) out = '\uFEFF' + out;
fs.writeFileSync(p, out, 'utf8');
console.log('main.js edited, bom=' + hasBom + ', len ' + s.length);
