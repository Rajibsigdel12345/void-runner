const fs = require("fs");
const lines = fs.readFileSync("src/core/game.js", "latin1").split("\n");
// constructor region
const ctorStart = lines.findIndex(l => l.includes("constructor("));
console.log("=== World constructor (from " + ctorStart + ") ===");
for (let i = ctorStart; i < ctorStart + 75; i++) console.log(i + " | " + lines[i]);