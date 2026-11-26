const fs = require("fs");
const srv = fs.readFileSync(".evidence/I599/run_regression599.cjs", "latin1");
let s600 = srv.replace("I599 (ST-564): regression check - the L1035 cockpit-keyboard-only change must leave the", "I600 (ST-565): regression check - the DOM-only cockpit frame change must leave the");
s600 = s600.replace("scripted/deterministic harness pins EXACT (the scripted-intent path bypasses L1035).", "scripted/deterministic harness pins EXACT (the frame is DOM-only: 0 3D draw calls, 0 tris, no RNG).");
s600 = s600.replace("const OUTDIR = \".evidence/I599/\";", "const OUTDIR = \".evidence/I600/\";");
if (s600 === srv) throw new Error("replace failed");
fs.writeFileSync(".evidence/I600/run_regression600.cjs", s600, "latin1");
console.log("wrote run_regression600.cjs", s600.length);
