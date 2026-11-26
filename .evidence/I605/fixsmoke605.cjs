const fs = require("fs");
const p = "E:/Game/.evidence/I605/smoke605.mjs";
let s = fs.readFileSync(p, "utf8");
const bad = "p.on(\"pageerror\", (e) => R.pageerror = (R.pageerror || 0) + 1, );";
const good = "p.on(\"pageerror\", (e) => { R.pageerror = (R.pageerror || 0) + 1; });";
if (s.indexOf(bad) !== 0 && s.indexOf(bad) === -1) { console.log("ANCHOR NOT FOUND"); process.exit(1); }
s = s.split(bad).join(good);
fs.writeFileSync(p, s);
console.log("fixed");