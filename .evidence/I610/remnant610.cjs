const fs = require("fs");
const ops = require("E:/Game/.evidence/I610/patchbook610_export.cjs");
let i = 0;
for (const op of ops) {
  i++;
  if (op.append !== undefined) continue;
  const s = fs.readFileSync("E:/Game/" + op.file, "utf8");
  const remnants = s.split(op.old).length - 1;
  if (remnants !== 0) {
    const inRepl = op.repl.split(op.old).length - 1;
    const ok = inRepl === remnants && op.repl.includes(op.old);
    console.log((ok ? "OK  " : "BAD ") + "op#" + i + " " + op.file + ": remnants=" + remnants + " (of which inside repl=" + inRepl + ") -> " + (ok ? "expected superset containment" : "INVESTIGATE"));
    if (!ok) {
      const idx = s.indexOf(op.old);
      console.log("  context: ..." + JSON.stringify(s.slice(Math.max(0, idx - 120), idx + op.old.length + 120)));
      console.log("  old:     " + JSON.stringify(op.old.slice(0, 200)));
    }
  }
}
console.log("REMNAnt AUDIT DONE");