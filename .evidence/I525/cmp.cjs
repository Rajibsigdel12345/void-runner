const fs = require("fs");
// how I524 counted BOMs:
const b524 = fs.readFileSync(".evidence/I524/bom524.cjs", "latin1");
console.log("=== bom524.cjs ===");
console.log(b524.slice(0, 1500));