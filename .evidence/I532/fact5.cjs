const fs = require("fs");
const path = require("path");
function walk(d) {
  let out = [];
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) out = out.concat(walk(p));
    else if (/\.(js|mjs|cjs)$/.test(f.name)) out.push(p);
  }
  return out;
}
for (const root of ["E:/Game/src"]) {
  for (const f of walk(root)) {
    const t = fs.readFileSync(f, "utf8");
    const hits = [...t.matchAll(/VR_[A-Za-z0-9]+/g)];
    if (hits.length) {
      const uniq = [...new Set(hits.map(h => h[0]))];
      console.log(f + ": " + uniq.join(", "));
    }
  }
}
