const fs = require("fs");
const p = "E:/Game/.evidence/I599/probe599.mjs";
let s = fs.readFileSync(p, "latin1");
const bad = "< ' + HOLD_FRAMES + ')";
const good = "< 45)";
let n = 0;
let idx = s.indexOf(bad);
while (idx !== -1) { s = s.slice(0, idx) + good + s.slice(idx + bad.length); n++; idx = s.indexOf(bad); }
fs.writeFileSync(p, s, "latin1");
console.log("replaced " + n + " occurrences");
console.log("remaining bad tokens: " + (s.split(bad).length - 1));
console.log("new total bytes: " + s.length);