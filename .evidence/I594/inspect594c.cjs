const fs = require("fs");
function tailLines(p, k) { const L = fs.readFileSync("E:/Game/" + p, "utf8").replace(/\r/g, "").split("\n").filter((x) => x.length); console.log("\n@@@ " + p + " (last " + k + ")"); for (const l of L.slice(-k)) console.log(l.slice(0, 900)); }
function findLine(p, q, n) { const L = fs.readFileSync("E:/Game/" + p, "utf8").replace(/\r/g, "").split("\n").filter((x) => x.length); const hit = L.filter((l) => l.includes(q)); console.log("\n@@@ " + p + " match=" + q + " hits=" + hit.length); for (const l of hit.slice(0, n || 4)) console.log(l.slice(0, 600)); }
tailLines("production/session-state/active.md", 4);
tailLines("production/iterations.md", 12);
findLine("CHANGELOG.md", "I593");
findLine("CHANGELOG.md", "I592");
findLine("production/epics.md", "## E83");
findLine("production/epics.md", "## E84");