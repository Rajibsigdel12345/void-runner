const fs = require("fs");
for (const f of ["src/core/director.js", "src/core/game.js"]) {
  const lines = fs.readFileSync(f, "latin1").split("\n");
  console.log("=== " + f + " ===");
  lines.forEach((l, i) => { if (l.includes("speedMul")) console.log(i + " | " + l.trim().slice(0, 140)); });
}