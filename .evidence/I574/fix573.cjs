const fs = require("fs");
const p = ".evidence/I574/write573.cjs";
let t = fs.readFileSync(p, "utf8");
const a = String.raw`rep1(s, '"sweep569.json"', '"sweep573.json"', "json name");`;
const b = String.raw`rep1(s, '"./sweep569.json"', '"./sweep573.json"', "json name");`;
if (!t.includes(a)) { console.log("not found"); process.exit(1); }
t = t.replace(a, b);
fs.writeFileSync(p, t, "utf8");
console.log("fixed");
