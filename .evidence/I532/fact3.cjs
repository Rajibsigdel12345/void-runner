const fs = require("fs");
const t = fs.readFileSync("E:/Game/.evidence/I517/build_e69b.py", "utf8");
const m = t.match(/OUT\s*=\s*\{[\s\S]*?\}/);
console.log("OUT:", m ? m[0] : "(none)");
const i = t.indexOf("BULWARK");
console.log("BULWARK idx:", i);
if (i >= 0) console.log(t.slice(Math.max(0, i - 200), i + 1500).split("\n").slice(0, 40).join("\n"));
const glb = fs.readdirSync("E:/Game/assets");
console.log("assets:", glb.join(", "));
