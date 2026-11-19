const fs = require("fs");
const files = ["CHANGELOG.md","production/stories.md","production/epics.md","production/iterations.md","production/timeline.md","AGENTS.md"];
const base = { "CHANGELOG.md": 7, "production/stories.md": 5, "production/epics.md": 3, "production/iterations.md": 5, "production/timeline.md": 3, "AGENTS.md": 1 };
let ok = true;
for (const f of files) {
  const b = fs.readFileSync(f, "latin1");
  const n = (b.match(/\uFEFF/g) || []).length;
  const d = n - base[f];
  if (d !== 0) ok = false;
  console.log(f + ": BOM " + n + " (base " + base[f] + ", delta " + d + ")");
}
console.log(ok ? "BOM AUDIT PASS (delta 0)" : "BOM AUDIT FAIL");