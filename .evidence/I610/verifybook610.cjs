const fs = require("fs");
const files = [
  ["production/epics.md", true, "\r\n", true],
  ["production/stories.md", true, "\r\n", false],
  ["production/iterations.md", true, "\r\n", false],
  ["production/timeline.md", true, "\n", false],
  ["production/session-state/active.md", false, "\r\n", false],
  ["CHANGELOG.md", true, "\n", false],
  ["production/scope-check-E88.md", false, "\n", false],
  ["AGENTS.md", true, "\r\n", false],
];
let bad = 0;
for (const [f, bom, eol, endNL] of files) {
  const buf = fs.readFileSync(f);
  const s = buf.toString("utf8");
  const hasBOM = s.charCodeAt(0) === 0xfeff;
  const end = eol === "\r\n" ? "\r\n" : "\n";
  const hasEndNL = s.endsWith(end);
  // EOL purity: files that are CRLF must not contain lone \n, LF files must not contain \r
  let pure = true;
  if (eol === "\r\n") pure = !s.includes("\n") || s.replace(/\r\n/g, "").indexOf("\n") === -1;
  else pure = !s.includes("\r");
  const ok = hasBOM === bom && hasEndNL === endNL && pure;
  if (!ok) bad++;
  console.log((ok ? "OK  " : "BAD ") + f + "  bom=" + hasBOM + " endNL=" + hasEndNL + " eolPure=" + pure + " len=" + s.length);
}
const checks = [
  ["production/epics.md", ["CLOSED I610 (G88.0; opened I608, closed I610)", "DONE I609", "- Status: CLOSED I610 (G88.0; 3/3 stories DONE)"]],
  ["production/stories.md", ["DONE I609: 34/34 GLBs EXT_meshopt_compressed", "DONE I610: CLOSEGATE610 6/6 EXACT"]],
  ["production/iterations.md", ["## I609", "## I610"]],
  ["production/timeline.md", ["## I609", "## I610"]],
  ["production/session-state/active.md", ["- NEXT at I610 = E89 open"]],
  ["CHANGELOG.md", ["I609: All 34 game models now ship"]],
  ["production/scope-check-E88.md", ["AMENDMENT", "2,215,516 B"]],
  ["AGENTS.md", ["5,184,484 (I609, -1,669,894 B", "CLOSE FLOOR E88 = 2,215,516 B measured at G88.0", "all 34 GLBs ship EXT_meshopt_compressed (I609/ST-574)", "- Assets: all 34 GLBs", "1,130,488 B / 62,254 tris"]],
];
for (const [f, markers] of checks) {
  const s = fs.readFileSync("E:/Game/" + f, "utf8");
  for (const m of markers) {
    const n = s.split(m).length - 1;
    if (n < 1) bad++;
    console.log((n >= 1 ? "OK  " : "BAD ") + f + "  marker x" + n + ": " + m.slice(0, 60));
  }
}
// CHANGELOG ordering: I609 line must come before I608 line
const cl = fs.readFileSync("E:/Game/CHANGELOG.md", "utf8");
const i9 = cl.indexOf("I609:"); const i8 = cl.indexOf("I608:");
console.log(i9 !== -1 && i8 !== -1 && i9 < i8 ? "OK   CHANGELOG order I609 above I608" : (bad++ || "BAD  CHANGELOG order"));
console.log(bad === 0 ? "VERIFY610 ALL OK" : "VERIFY610 FAILURES: " + bad);
process.exit(bad === 0 ? 0 : 1);