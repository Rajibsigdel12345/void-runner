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
const sw = fs.readFileSync("dist/sw.js", "latin1");
console.log("sw has cockpitFrame:", sw.includes("cockpitFrame"));
const mf = fs.existsSync("dist/src/render/cockpitFrame.js");
console.log("dist/src/render/cockpitFrame.js exists:", mf);
if (mf) console.log("minified size:", fs.statSync("dist/src/render/cockpitFrame.js").size, "B");
const mainMin = fs.readFileSync("dist/src/main.js", "latin1");
console.log("dist main.js references createCockpitFrame:", mainMin.includes("createCockpitFrame") || mainMin.includes("cockpitFrame"));
