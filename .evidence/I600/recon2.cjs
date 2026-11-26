const fs = require("fs");
const s = fs.readFileSync("src/main.js", "latin1");
function lineOf(idx, name) {
  const a = s.lastIndexOf("\n", idx);
  const b = s.indexOf("\n", idx);
  console.log("--- " + name + " ---");
  console.log(JSON.stringify(s.slice(a + 1, b + 1)));
}
lineOf(s.indexOf("import { createGauges }"), "import gauges");
lineOf(s.indexOf("const gauges = createGauges()"), "create gauges");
lineOf(s.indexOf("gauges.update({ on:"), "gauges.update");
// --vr-fs
let k = -1, occ = [];
while ((k = s.indexOf("--vr-fs", k + 1)) >= 0) occ.push(k);
console.log("--vr-fs in main.js:", occ.length);
if (occ.length) { const a = s.lastIndexOf("\n", occ[0]); const b = s.indexOf("\n", occ[0]); console.log(JSON.stringify(s.slice(a + 1, b + 1))); }
// check bearingStrip z-index for reference
const b = fs.readFileSync("src/render/bearingStrip.js", "latin1");
const zi = b.indexOf("z-index");
console.log("--- bearingStrip z-index context ---");
console.log(JSON.stringify(b.slice(Math.max(0, zi - 200), zi + 60)));
