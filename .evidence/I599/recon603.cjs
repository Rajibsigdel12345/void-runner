const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
const s = B("production/scope-check-E86.md");
console.log("=== 4300-7300 ===");
console.log(JSON.stringify(s.slice(4300, 7300)));
console.log("");
console.log("=== 9700-14179 ===");
console.log(JSON.stringify(s.slice(9700, s.length)));
