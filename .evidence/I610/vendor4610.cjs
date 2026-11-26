const fs = require("fs");
const crypto = require("crypto");
const want = {
  "E:/Game/dist/vendor/three.module.js": "A65DE049A7F38B40",
  "E:/Game/dist/vendor/three.core.js": "7AB0784CD2532367",
  "E:/Game/dist/vendor/three.webgpu.js": "F549248412C62B9A",
  "E:/Game/dist/vendor/three.tsl.js": "7FF9ACF50F006017",
};
let bad = 0;
for (const [f, w] of Object.entries(want)) {
  const h = crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16).toUpperCase();
  const ok = h === w;
  if (!ok) bad++;
  console.log((ok ? "EXACT " : "BAD  ") + f.split("/").pop() + " " + h + (ok ? "" : " want " + w));
}
console.log(bad === 0 ? "VENDOR4 ALL EXACT" : "VENDOR4 FAIL");