// I523/ST-489: append sec.4-11 to the E70 research doc + fix 6 stale cross-refs.
// Byte-preserving: latin1 round-trip, rep1 single-anchor asserts, head16 guard.
const fs = require("fs");
let fails = 0;
const P = "E:/Game/design/e70-balance-followup-research.md";
const A = "E:/Game/.evidence/I523/append523.txt";
function rep1(s, a, r, label) {
  const n = s.split(a).length - 1;
  if (n !== 1) { console.log("FAIL " + label + " anchor count " + n); fails++; throw new Error(label); }
  return s.split(a).join(r);
}
const before = fs.readFileSync(P);
const b16 = before.slice(0, 16).toString("hex");
let s = before.toString("latin1");
if (s.length !== 14780) { console.log("FAIL unexpected pre-size " + s.length); fails++; throw new Error("size"); }
s = rep1(s, "sec.4 (R1) + sec.5.3 (R7", "sec.3 (R1) + sec.4.3 (R7", "X1");
s = rep1(s, "Exploit Risk = sec.5.2 + sec.8; Pacing = sec.5.1 + F7/F8; Telemetry",
         "Exploit Risk = sec.3 (per-option) + sec.7 (K1-K5); Pacing = sec.4.1 + F7/F8; Telemetry", "X2");
s = rep1(s, "Need = sec.5.2 (the ST-491 harness IS the telemetry)",
         "Need = sec.4.2 + sec.9 (the ST-491 harness IS the telemetry)", "X3");
s = rep1(s, "must attribute (sec.5.2) before any", "must attribute (sec.4.2) before any", "X4");
s = rep1(s, "time (sec.4 prefers Option B", "time (sec.3 prefers Option B", "X5");
s = rep1(s, "(sec.5.1 H2) is a real hypothesis", "(sec.4.1 H2) is a real hypothesis", "X6");
if (!s.endsWith("(I482 pattern).\n")) { console.log("FAIL tail anchor (expected sec.3 end)"); fails++; throw new Error("tail"); }
const app = fs.readFileSync(A).toString("latin1");
if ((app.match(/\r\n/g) || []).length !== 0) { console.log("FAIL append has CRLF"); fails++; throw new Error("crlf"); }
s += "\n" + app + "\n";
fs.writeFileSync(P, Buffer.from(s, "latin1"));
const after = fs.readFileSync(P);
const a16 = after.slice(0, 16).toString("hex");
const at = after.toString("latin1");
if (a16 !== b16) { console.log("FAIL head16 changed " + b16 + " -> " + a16); fails++; }
console.log("head16 " + a16 + " (unchanged: " + (a16 === b16) + ")");
console.log("size " + before.length + " -> " + after.length + " (append file " + app.length + " + 1 blank line)");
console.log("crlf " + (at.match(/\r\n/g) || []).length);
console.log("tail " + JSON.stringify(at.slice(-60)));
console.log(fails === 0 ? "RESEARCH APPEND OK" : "FAILURES: " + fails);
