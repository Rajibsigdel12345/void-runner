const fs = require("fs");
const s = fs.readFileSync("E:/Game/AGENTS.md", "utf8");
const marker = "4. `npm run build` dist/ total stays under";
const i = s.indexOf(marker);
const line = s.slice(i, s.indexOf("\n", i));
console.log("ITEM4 LEN", line.length);
const CHUNK = 1500;
for (let o = 0; o < line.length; o += CHUNK) console.log("=== OFFSET " + o + " ===\n" + line.slice(o, o + CHUNK));
function tailLines(p, k) { const L = fs.readFileSync("E:/Game/" + p, "utf8").replace(/\r/g, "").split("\n").filter((x) => x.length); console.log("\n@@@ " + p + " (last " + k + ")"); for (const l of L.slice(-k)) console.log(l.slice(0, 700)); }
function findLine(p, q) { const L = fs.readFileSync("E:/Game/" + p, "utf8").replace(/\r/g, "").split("\n").filter((x) => x.length); const hit = L.filter((l) => l.includes(q)); console.log("\n@@@ " + p + " match=" + q); for (const l of hit) console.log(l.slice(0, 900)); }
findLine("production/epics.md", "E84");
findLine("production/stories.md", "ST-561");
tailLines("CHANGELOG.md", 3);
tailLines("production/timeline.md", 3);
tailLines("production/active.md", 3);
tailLines("production/iterations.md", 10);