const fs = require("fs");
console.log("=== .evidence/I524/balance524.mjs ===");
const lines = fs.readFileSync(".evidence/I524/balance524.mjs", "latin1").split("\n");
lines.forEach((l, i) => console.log(i + " | " + l));