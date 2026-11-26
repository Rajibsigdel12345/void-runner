const fs = require("fs");
const p = "E:/Game/.evidence/I605/endpins605.mjs";
let s = fs.readFileSync(p, "utf8");
const before = s.split("../src/core/").length - 1;
s = s.split("../src/core/").join("../../src/core/");
fs.writeFileSync(p, s);
console.log("replaced", before, "occurrences");