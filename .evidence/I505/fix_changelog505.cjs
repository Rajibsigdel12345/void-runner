const fs = require("fs");
let fail = 0;
const f = "CHANGELOG.md";
let s = fs.readFileSync(f, "utf8");
const rep1 = (a, b, tag) => { const n = s.split(a).length - 1; if (n !== 1) { console.log("FAIL anchor " + tag + " count=" + n); fail++; return; } s = s.replace(a, b); console.log("ok " + tag); };
// 1) repair double-CR defect from the I504 insert
rep1("Unreleased]\r\r- I504:", "Unreleased]\r\n- I504:", "fix-double-cr");
// 2) repair bare-LF before I503
rep1("billing issue.).\n- I503:", "billing issue.).\r\n- I503:", "fix-bare-lf");
// 3) insert the I505 line properly
if (fail === 0) {
  const line = "- I505: ST-471 E67 stage 7 - G67.0 close gate (probe-only zero src): fresh causal495 PASS 3-arm (dist :4200 - webgl + default EXACT seed-9876, webgpu report-only) + causal483 CAUSAL456 PASS + playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + pwa491 11/11 (dist :5199) + quality bar 6/6 (1145/1145 + build 0 + dist 3,747,372 B/175 + 4-pin EXACT) + AGENTS.md refresh (dist-bytes line + close floor 103,437 -> 102,628 B) + epic DoD check - E67 CLOSED 7/7 (ship v6 25,563 t + boss v2 398 t + camera/view pass all live; Pages still blocked on the account Actions billing lock).";
  rep1("\r\n- I504:", "\r\n" + line + "\r\n- I504:", "insert-i505");
}
if (fail === 0) fs.writeFileSync(f, s, "utf8");
// verify: pure CRLF, no trailing newline, BOMx7, order I505 > I504 > I503
const b = fs.readFileSync(f, "utf8");
let bom = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { bom++; i += 3; }
const body = b.slice(i);
const badCrCr = body.split("\r\r").length - 1;
const bareLf = body.split("\n").length - 1 - (body.split("\r\n").length - 1);
const endsNL = body.endsWith("\n");
const o505 = body.indexOf("- I505:"); const o504 = body.indexOf("- I504:"); const o503 = body.indexOf("- I503:");
console.log("BOMx" + bom, "crCr=" + badCrCr, "bareLf=" + bareLf, "endsNL=" + endsNL, "order505<504<503=" + (o505 < o504 && o504 < o503));
console.log(fail === 0 && bom === 7 && badCrCr === 0 && bareLf === 0 && !endsNL && (o505 < o504 && o504 < o503) ? "CHANGELOG_REPAIR_OK" : "CHANGELOG_REPAIR_FAIL");
process.exit(fail === 0 ? 0 : 1);
