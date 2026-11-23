// I572: clone run_closegate568.cjs -> run_closegate572.cjs (label CLOSEGATE572, OUTDIR .evidence/I572/)
const fs = require("fs");
let s = fs.readFileSync(".evidence/I568/run_closegate568.cjs", "utf8");
function rep(oldStr, newStr, label) { const n = s.split(oldStr).length - 1; if (n !== 1) throw new Error(label + " count=" + n); s = s.replace(oldStr, newStr); }
rep("// I568 (E78 docs-only close): G78.0 5-harness gate - identical harness set + ports to the I566 runner, I568 outputs.",
    "// I572 (E79 accept-round close): G79.0 5-harness gate - identical harness set + ports to the I568 runner, I572 outputs.", "header");
rep("// EXPECTED: all 5 EXACT with NO re-pin possible (I567/I568 = zero src change since I566; docs + .evidence only; dist byte-identical 6,430,174 B / 203).",
    "// EXPECTED: all 5 EXACT with NO re-pin possible (I571 = net-zero src after C1 revert; docs + .evidence only; dist byte-identical 6,430,174 B / 203).", "expected");
rep('const OUTDIR = ".evidence/I568/";', 'const OUTDIR = ".evidence/I572/";', "outdir");
rep('console.log(allOk ? "CLOSEGATE568 HARNESS PASS" : "CLOSEGATE566 HARNESS FAIL");', 'console.log(allOk ? "CLOSEGATE572 HARNESS PASS" : "CLOSEGATE572 HARNESS FAIL");', "final");
fs.writeFileSync(".evidence/I572/run_closegate572.cjs", s);
console.log("clone written, len", s.length);
