const fs = require("fs");
const b = fs.readFileSync("src/core/enemyBullets.js", "latin1");
const lines = b.split("\n");
console.log("=== enemyBullets.js (" + lines.length + " lines) ===");
lines.forEach((l, i) => console.log(i + " | " + l));