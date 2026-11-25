const fs = require("fs");
function bom(p) { const s = fs.readFileSync(p, "utf8"); let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
const expect = { "AGENTS.md": 1, "production/epics.md": 3, "production/stories.md": 5, "production/iterations.md": 5, "production/timeline.md": 3, "production/session-state/active.md": 0, "CHANGELOG.md": 7 };
let ok = true;
for (const [p, e] of Object.entries(expect)) { const b = bom(p); const pass = b === e; if (!pass) ok = false; console.log((pass ? "OK  " : "FAIL") + " " + p + " BOM " + b + " (expect " + e + ")"); }
process.exit(ok ? 0 : 1);
