const fs = require("fs");
const t = fs.readFileSync("E:/Game/.evidence/I517/build_e69b.py", "utf8");
const lines = t.split("\n");
const iB = lines.findIndex(l => l.includes("def bake_"));
console.log("=== BAKE+GROUPS+GATES (from first bake def) ===");
console.log(lines.slice(Math.max(0, iB - 12), iB + 60).join("\n"));
const iG = lines.findIndex(l => l.includes("GROUPS = {"));
console.log("=== GROUPS ===");
console.log(lines.slice(iG, iG + 8).join("\n"));
