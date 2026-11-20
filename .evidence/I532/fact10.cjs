const fs = require("fs");
const t = fs.readFileSync("E:/Game/.evidence/I517/build_e69b.py", "utf8");
const lines = t.split("\n");
console.log("TOTAL LINES:", lines.length);
// print header through end of helpers (before HAULER section)
const iH = lines.findIndex(l => l.includes("HAULER"));
console.log("=== HEADER+HELPERS (lines 1..iH) ===");
console.log(lines.slice(0, iH).join("\n"));
// print export tail
const iE = lines.findIndex(l => l.includes("for asset in OUT"));
if (iE === -1) {
  const j = lines.findIndex(l => l.includes("export_scene.gltf"));
  console.log("=== EXPORT TAIL ===");
  console.log(lines.slice(Math.max(0, j - 25), j + 30).join("\n"));
}
