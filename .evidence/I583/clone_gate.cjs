// I583: clone .evidence/I580/run_closegate580.cjs -> .evidence/I583/run_gate583.cjs
// (label GATE583, OUTDIR .evidence/I583/; identical harness set + ports).
const fs = require("fs");
let s = fs.readFileSync(".evidence/I580/run_closegate580.cjs", "utf8");
function rep(oldStr, newStr, label) { const n = s.split(oldStr).length - 1; if (n !== 1) throw new Error(label + " count=" + n); s = s.replace(oldStr, newStr); }
rep("// I580 (E81 accept-round close): G81.0 5-harness gate - identical harness set + ports to the I572 runner, I580 outputs.",
    "// I583 (E82 ST-550 APPLY round): acceptance (e) - 5-harness gate EXACT no re-pin - identical harness set + ports to the I572/I580 runners, I583 outputs.", "header");
rep("// EXPECTED: all 5 EXACT with NO re-pin possible (I577/I578/I579 = net-zero src since I572; docs + .evidence only; dist byte-identical 6,430,174 B / 203).",
    "// EXPECTED: all 5 EXACT with NO re-pin possible (I583 = the one-line config lever boss.burst.every 4.0 -> 4.8 [time-driven burst timer -> ZERO extra RNG; all 5 pins wave <= 2; Monolith first spawns wave 5]; dist size EXPECTED byte-identical 6,430,174 B / 203).", "expected");
rep('const OUTDIR = ".evidence/I580/";', 'const OUTDIR = ".evidence/I583/";', "outdir");
rep('console.log(allOk ? "CLOSEGATE580 HARNESS PASS" : "CLOSEGATE580 HARNESS FAIL");', 'console.log(allOk ? "GATE583 HARNESS PASS" : "GATE583 HARNESS FAIL");', "final");
fs.writeFileSync(".evidence/I583/run_gate583.cjs", s);
console.log("run_gate583.cjs written, len", s.length);