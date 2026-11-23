const fs = require("fs");
const p = ".evidence/I574/write573.cjs";
let t = fs.readFileSync(p, "utf8");
const a = String.raw`
for (const bad of ["56900", "rules569.md", "sweep569.json", 'tag: "sweep569"']) {
  if (s.indexOf(bad) !== -1) throw new Error("stale label remains: " + bad);
}`;
const b = String.raw`
const body = s.slice(s.indexOf("import { World }"));
for (const bad of ["56900", "rules569.md", "sweep569.json", 'tag: "sweep569"']) {
  if (body.indexOf(bad) !== -1) throw new Error("stale label in body: " + bad);
}`;
if (!t.includes(a)) { console.log("not found"); process.exit(1); }
t = t.replace(a, b);
fs.writeFileSync(p, t, "utf8");
console.log("fixed");
