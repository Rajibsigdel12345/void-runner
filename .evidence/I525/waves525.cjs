const fs = require("fs");
const lines = fs.readFileSync("src/core/waves.js", "latin1").split("\n");
console.log("=== waves.js (" + lines.length + " lines) ===");
lines.forEach((l, i) => console.log(i + " | " + l));