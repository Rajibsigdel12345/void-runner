// I583: apply the FROZEN E82 lever - the ONE and ONLY src change (config.js:300, 1-char literal swap).
const fs = require("fs");
const p = "src/core/config.js";
const s = fs.readFileSync(p, "utf8");
const oldLine = "      every: 4.0,        // seconds between volleys (phase 2: x0.65)";
const newLine = "      every: 4.8,        // seconds between volleys (phase 2: x0.65)";
const n = s.split(oldLine).length - 1;
if (n !== 1) throw new Error("lever line count=" + n);
fs.writeFileSync(p, s.replace(oldLine, newLine), "utf8");
console.log("LEVER APPLIED config.js:300 -> every: 4.8; bytes " + fs.statSync(p).size);