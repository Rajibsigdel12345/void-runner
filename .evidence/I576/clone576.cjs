// I576: clone run_closegate572.cjs -> run_closegate576.cjs (label CLOSEGATE576, OUTDIR .evidence/I576/)
const fs = require("fs");
let s = fs.readFileSync(".evidence/I572/run_closegate572.cjs", "utf8");
function rep(oldStr, newStr, label) { const n = s.split(oldStr).length - 1; if (n !== 1) throw new Error(label + " count=" + n); s = s.replace(oldStr, newStr); }
rep("// I572 (E79 accept-round close): G79.0 5-harness gate - identical harness set + ports to the I568 runner, I572 outputs.",
    "// I576 (E80 accept-round close): G80.0 5-harness gate - identical harness set + ports to the I572 runner, I576 outputs.", "header");
rep("// EXPECTED: all 5 EXACT with NO re-pin possible (I571 = net-zero src after C1 revert; docs + .evidence only; dist byte-identical 6,430,174 B / 203).",
    "// EXPECTED: all 5 EXACT with NO re-pin possible (I574/I575 = zero src change since I573 [I573 itself zero src]; docs + .evidence only; dist byte-identical 6,430,174 B / 203).", "expected");
rep('const OUTDIR = ".evidence/I572/";', 'const OUTDIR = ".evidence/I576/";', "outdir");
rep('console.log(allOk ? "CLOSEGATE572 HARNESS PASS" : "CLOSEGATE572 HARNESS FAIL");', 'console.log(allOk ? "CLOSEGATE576 HARNESS PASS" : "CLOSEGATE576 HARNESS FAIL");', "final");
fs.writeFileSync(".evidence/I576/run_closegate576.cjs", s);
console.log("clone written, len", s.length);