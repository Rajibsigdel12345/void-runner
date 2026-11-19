const fs = require("fs");
const lines = fs.readFileSync("src/core/director.js", "latin1").split("\n");
console.log("=== director.js (" + lines.length + " lines) ===");
lines.forEach((l, i) => console.log(i + " | " + l));