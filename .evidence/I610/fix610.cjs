const fs = require("fs");
const p = "E:/Game/.evidence/I610/patchbook610.cjs";
let s = fs.readFileSync(p, "utf8");
const a1 = "const R = (file, old, new, count) => ops.push({ file, old, new, count: count === undefined ? 1 : count });";
const b1 = "const R = (file, old, repl, count) => ops.push({ file, old, repl, count: count === undefined ? 1 : count });";
const a2 = "s = s.split(op.old).join(op.new);";
const b2 = "s = s.split(op.old).join(op.repl);";
const c1 = s.split(a1).length - 1;
const c2 = s.split(a2).length - 1;
if (c1 !== 1 || c2 !== 1) { console.error("ABORT counts " + c1 + " " + c2); process.exit(1); }
s = s.split(a1).join(b1).split(a2).join(b2);
fs.writeFileSync(p, s, "utf8");
console.log("FIX610 OK");