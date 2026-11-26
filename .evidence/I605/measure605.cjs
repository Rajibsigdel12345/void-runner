const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
let total = 0, count = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { total += fs.statSync(p).size; count++; }
  }
})("dist");
console.log("MEASURE605 dist bytes=" + total + " files=" + count);
console.log("EXPECTED 6854043 204 -> " + (total === 6854043 && count === 204 ? "EXACT" : "MISMATCH"));
function pin(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16).toUpperCase();
}
const expect = {
  "dist/vendor/three.module.js": "A65DE049A7F38B40",
  "dist/vendor/three.core.js": "7AB0784CD2532367",
  "dist/vendor/three.webgpu.js": "F549248412C62B9A",
  "dist/vendor/three.tsl.js": "7FF9ACF50F006017"
};
let ok = true;
for (const [f, e] of Object.entries(expect)) {
  const g = pin(f);
  if (g !== e) ok = false;
  console.log("VENDOR " + path.basename(f) + " " + g + " " + (g === e ? "EXACT" : "MISMATCH expected " + e));
}
console.log("MEASURE605 " + (ok && total === 6854043 && count === 204 ? "ALL-EXACT" : "CHECK-OUTPUT"));