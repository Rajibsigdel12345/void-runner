// I580: clone run_closegate576.cjs -> run_closegate580.cjs (label CLOSEGATE580, OUTDIR .evidence/I580/)
const fs = require("fs");
let s = fs.readFileSync(".evidence/I576/run_closegate576.cjs", "utf8");
function rep(oldStr, newStr, label) { const n = s.split(oldStr).length - 1; if (n !== 1) throw new Error(label + " count=" + n); s = s.replace(oldStr, newStr); }
rep("// I576 (E80 accept-round close): G80.0 5-harness gate - identical harness set + ports to the I572 runner, I576 outputs.",
    "// I580 (E81 accept-round close): G81.0 5-harness gate - identical harness set + ports to the I572 runner, I580 outputs.", "header");
rep("// EXPECTED: all 5 EXACT with NO re-pin possible (I574/I575 = zero src change since I573 [I573 itself zero src]; docs + .evidence only; dist byte-identical 6,430,174 B / 203).",
    "// EXPECTED: all 5 EXACT with NO re-pin possible (I577/I578/I579 = net-zero src since I572; docs + .evidence only; dist byte-identical 6,430,174 B / 203).", "expected");
rep('const OUTDIR = ".evidence/I576/";', 'const OUTDIR = ".evidence/I580/";', "outdir");
rep('console.log(allOk ? "CLOSEGATE576 HARNESS PASS" : "CLOSEGATE576 HARNESS FAIL");', 'console.log(allOk ? "CLOSEGATE580 HARNESS PASS" : "CLOSEGATE580 HARNESS FAIL");', "final");
fs.writeFileSync(".evidence/I580/run_closegate580.cjs", s);
console.log("clone written, len", s.length);