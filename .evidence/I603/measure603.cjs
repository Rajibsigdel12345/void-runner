const fs = require("fs");
const path = require("path");
let total = 0, count = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { total += fs.statSync(p).size; count++; }
  }
})("dist");
console.log("MEASURE603 dist bytes=" + total + " files=" + count);
console.log("EXPECTED 6853589 204 -> " + (total === 6853589 && count === 204 ? "EXACT" : "MISMATCH"));