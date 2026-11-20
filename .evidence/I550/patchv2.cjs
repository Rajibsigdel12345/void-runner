const fs = require('fs');
const p = '.evidence/I550/verify550.mjs';
let s = fs.readFileSync(p, 'utf8');
const old = "  await p.waitForTimeout(1200);\n\n  R.verify = await p.evaluate(";
const neu = "  await p.waitForTimeout(1200);\n\n  // V cycles chase -> overview -> cockpit (main.js L807)\n  await p.keyboard.press(\"v\");\n  await p.waitForTimeout(300);\n  await p.keyboard.press(\"v\");\n  await p.waitForTimeout(300);\n  await p.waitForTimeout(1200); // live tick converges the cockpit camera (fov damp etc.)\n\n  R.verify = await p.evaluate(";
if (!s.includes(old)) { console.error('OLD NOT FOUND'); process.exit(1); }
s = s.replace(old, neu);
fs.writeFileSync(p, s);
console.log('patched verify550.mjs');
