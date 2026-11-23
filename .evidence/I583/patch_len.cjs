const fs = require("fs");
const p = ".evidence/I583/clone_sweep.cjs";
let s = fs.readFileSync(p, "utf8");
const old = 'if (L.length !== 328 || L[327] !== "") throw new Error("unexpected line count " + L.length);';
const neu = 'if (L.length !== 327) throw new Error("unexpected line count " + L.length);';
const n = s.split(old).length - 1;
if (n !== 1) throw new Error("anchor count=" + n);
fs.writeFileSync(p, s.replace(old, neu), "utf8");
console.log("patched clone_sweep.cjs");