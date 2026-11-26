const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
let s = B("production/iterations.md");
let i = s.lastIndexOf("- I598");
console.log("iterations I598 entry start idx:", i);
console.log(JSON.stringify(s.slice(i, i + 260)));
console.log("");
s = B("production/session-state/active.md");
let j = s.lastIndexOf("NEXT at I599");
console.log("active NEXT line start idx:", j, "line start:", JSON.stringify(s.slice(j - 8, j + 120)));
// also check how previous NEXT lines begin
let m = s.lastIndexOf("NEXT at I598");
console.log("NEXT I598 context:", JSON.stringify(s.slice(m - 8, m + 80)));
