const fs = require("fs");
let src = fs.readFileSync("E:/Game/.evidence/I610/patchbook610.cjs", "utf8");
const cut = src.indexOf("let applied = 0;");
if (cut === -1) { console.error("ABORT no apply-loop marker"); process.exit(1); }
src = src.slice(0, cut) + "module.exports = ops;\n";
fs.writeFileSync("E:/Game/.evidence/I610/patchbook610_export.cjs", src, "utf8");
const ops = require("E:/Game/.evidence/I610/patchbook610_export.cjs");
let bad = 0;
for (const op of ops) {
  const s = fs.readFileSync("E:/Game/" + op.file, "utf8");
  if (op.append !== undefined) {
    const n = s.includes(op.append) ? 1 : 0;
    if (n < 1) bad++;
    console.log((n ? "OK  " : "BAD ") + op.file + " append-on-disk x" + n + " (" + op.append.length + " chars)");
  } else {
    const n = s.split(op.repl).length - 1;
    const gone = s.split(op.old).length - 1;
    if (n < 1 || gone !== 0) bad++;
    console.log((n >= 1 && gone === 0 ? "OK  " : "BAD ") + op.file + " repl x" + n + " / old-remnants x" + gone);
  }
}
console.log(bad === 0 ? "OPSCHECK610 ALL 17 OK" : "OPSCHECK610 FAILURES: " + bad);
process.exit(bad === 0 ? 0 : 1);