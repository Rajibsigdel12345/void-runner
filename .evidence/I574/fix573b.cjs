const fs = require("fs");
const p = ".evidence/I574/write573.cjs";
let t = fs.readFileSync(p, "utf8");
const a = String.raw`if (s.indexOf("sweep569") !== -1) throw new Error("stale sweep569 label remains");`;
const b = String.raw`
for (const bad of ["56900", "rules569.md", "sweep569.json", 'tag: "sweep569"']) {
  if (s.indexOf(bad) !== -1) throw new Error("stale label remains: " + bad);
}`;
if (!t.includes(a)) { console.log("not found"); process.exit(1); }
t = t.replace(a, b);
fs.writeFileSync(p, t, "utf8");
console.log("fixed");
