const fs = require("fs");
function tail(p, n) {
  const b = fs.readFileSync(p);
  const s = b.toString("latin1");
  return { len: b.length, tail: s.slice(Math.max(0, s.length - 900)), hasBOM: s.charCodeAt(0) === 0xFEFF, bomBytes: b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF };
}
for (const p of ["E:/Game/production/epics.md", "E:/Game/production/stories.md", "E:/Game/production/iterations.md", "E:/Game/production/timeline.md", "E:/Game/CHANGELOG.md", "E:/Game/production/session-state/active.md"]) {
  const r = tail(p, 900);
  console.log("=== " + p + " (" + r.len + " B, BOMbytes=" + r.bomBytes + ") ===");
  console.log(JSON.stringify(r.tail.slice(-850)));
  console.log();
}
