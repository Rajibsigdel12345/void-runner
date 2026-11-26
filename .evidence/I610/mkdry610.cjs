const fs = require("fs");
const p = "E:/Game/.evidence/I610/patchbook610.cjs";
const d = "E:/Game/.evidence/I610/patchbook610_dry.cjs";
let s = fs.readFileSync(p, "utf8");
const w = "fs.writeFileSync(op.file, s, \"utf8\");";
const n = s.split(w).length - 1;
if (n !== 2) { console.error("ABORT write count " + n); process.exit(1); }
s = s.split(w).join("/*dry*/;");
fs.writeFileSync(d, s, "utf8");
console.log("DRYCOPY OK");