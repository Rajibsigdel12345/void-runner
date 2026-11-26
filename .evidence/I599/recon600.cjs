const fs = require("fs");
function meta(p){ const b=fs.readFileSync(p); const s=b.toString("latin1"); const crlf=(s.match(/\r\n/g)||[]).length; const bom=(b.toString("latin1").match(/\u00EF\u00BB\u00BF/g)||[]).length; const lines=s.split(/\r?\n/); const hasTrail = s.endsWith("\r\n")||s.endsWith("\n"); return { bytes:b.length, crlf, lf:(s.match(/(?<!\r)\n/g)||[]).length, bom, lines:lines.length, lastNonEmpty: lines.filter(l=>l.trim().length).slice(-1)[0] }; }
for (const p of ["production/epics.md","production/stories.md","production/iterations.md","production/timeline.md","production/session-state/active.md","CHANGELOG.md","production/scope-check-E86.md"]) {
  const m = meta(p);
  console.log("== " + p + " ==");
  console.log("  bytes=" + m.bytes + " crlf=" + m.crlf + " loneLf=" + m.lf + " bom=" + m.bom + " lines=" + m.lines);
  console.log("  lastNonEmpty: " + m.lastNonEmpty.slice(0, 160));
}
console.log("\n=== epics.md E86 block ===");
const e = fs.readFileSync("production/epics.md","latin1");
let i = e.indexOf("E86");
while (i !== -1) { console.log("@ " + i + ": " + e.slice(i, i+60).replace(/\r?\n/g,"\\n")); i = e.indexOf("E86", i+1); if (i>40000000) break; }