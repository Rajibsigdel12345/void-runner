// I588 (ST-555): AGENTS.md item-4 CLOSE FLOOR E83 clause (E82 demoted to prior), .evidence/I587/ag587.cjs pattern.
const fs = require("fs");
const p = "AGENTS.md";
const s0 = fs.readFileSync(p, "utf8");
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
const b0 = bomCount(s0);
function assertOnce(s, a, label) { const i = s.indexOf(a); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(a, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function rep(s, a, b, label) { assertOnce(s, a, label); return s.replace(a, b); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label); }
let s = s0;
const a1 = "CLOSE FLOOR E82 = 969,826 B measured at G82.0 (I584:";
const n1 = "CLOSE FLOOR E83 = 306,942 B measured at G83.0 (I588: 7,400,000 - 7,093,058 fresh dist re-measured EXACT [byte-identical to I587 - E83 accept round, zero src change]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E83 CLOSED I588); prior CLOSE FLOOR E82 = 969,826 B measured at G82.0 (I584:";
assertAscii(n1, "n1"); s = rep(s, a1, n1, "agents CLOSE FLOOR E83 clause");
if (bomCount(s) !== b0) throw new Error("AGENTS BOM delta");
fs.writeFileSync(p, s, "utf8");
console.log("AGENTS.md OK");
