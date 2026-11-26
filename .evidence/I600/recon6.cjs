const fs = require("fs");
const b = fs.readFileSync("src/render/bearingStrip.js", "latin1");
let k = b.indexOf("id");
const occ = [];
let kk = -1;
while ((kk = b.indexOf("canvas.id", kk + 1)) >= 0) occ.push(kk);
for (const o of occ) console.log("bearingStrip:", JSON.stringify(b.slice(o, o + 60)));
const m = fs.readFileSync("src/main.js", "latin1");
let kk2 = -1;
while ((kk2 = m.indexOf("vr-cockpit-dot", kk2 + 1)) >= 0) { const a = m.lastIndexOf("\n", kk2), bb = m.indexOf("\n", kk2); console.log("dot ctx:", JSON.stringify(m.slice(a+1, Math.min(bb+1, a+200)).slice(0, 150))); }
const r = fs.readFileSync(".evidence/I599/run_regression599.cjs", "latin1");
console.log("runner len:", r.length);
console.log(JSON.stringify(r.slice(0, 2000)));
