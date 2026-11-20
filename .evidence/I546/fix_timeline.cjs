const fs = require("fs");
const p = "production/timeline.md";
const s = fs.readFileSync(p, "latin1");
const bad = "smoke546 21/22->21/21";
const good = "smoke546 21/21";
const n = s.split(bad).length - 1;
if (n !== 1) { console.log("anchor count " + n); process.exit(1); }
fs.writeFileSync(p, Buffer.from(s.split(bad).join(good), "latin1"));
console.log("timeline typo fixed");