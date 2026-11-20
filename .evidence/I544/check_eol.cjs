const fs = require("fs");
const R = (p) => "E:/Game/" + p;
for (const f of ["CHANGELOG.md", "production/epics.md", "production/stories.md", "production/iterations.md", "production/timeline.md", "production/session-state/active.md"]) {
  const b = fs.readFileSync(R(f));
  let crlf = 0, lf = 0;
  for (let i = 0; i < b.length; i++) { if (b[i] === 0x0A) { if (i > 0 && b[i-1] === 0x0D) crlf++; else lf++; } }
  const un = f === "CHANGELOG.md" ? b.indexOf("## [Unreleased]") : -1;
  const after = un >= 0 ? (b[un + 16] === 0x0D && b[un + 17] === 0x0A ? "CRLF" : "LF/other " + b[un+16] + "," + b[un+17]) : "";
  console.log(`${f}: CRLF=${crlf} LFonly=${lf} endNL=${b[b.length-1] === 0x0A} ${after}`);
}