const fs = require("fs");
const path = require("path");
function walk(d) {
  let total = 0, n = 0;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { const r = walk(p); total += r.t; n += r.n; }
    else { total += fs.statSync(p).size; n++; }
  }
  return { t: total, n: n };
}
const r = walk("dist");
console.log("dist:", r.t, "B /", r.n, "files");
const expect = 6853589;
console.log("byte-identical to I600:", r.t === expect ? "YES (EXACT 6853589)" : "NO (expect 6853589)");