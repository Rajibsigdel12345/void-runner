const fs = require("fs");
const files = {
  epics: "production/epics.md",
  stories: "production/stories.md",
  iters: "production/iterations.md",
  timeline: "production/timeline.md",
  active: "production/session-state/active.md",
  changelog: "CHANGELOG.md"
};
for (const [k, p] of Object.entries(files)) {
  const b = fs.readFileSync(p);
  const hits = [];
  for (let i = 0; i < b.length; i++) if (b[i] > 0x7F) hits.push(i);
  if (hits.length === 0) { console.log(k + ": all-ASCII"); continue; }
  // group consecutive
  const groups = [];
  let s = hits[0], e2 = hits[0];
  for (const h of hits.slice(1)) { if (h === e2 + 1) e2 = h; else { groups.push([s, e2]); s = h; e2 = h; } }
  groups.push([s, e2]);
  console.log(k + ": " + hits.length + " non-ASCII bytes in " + groups.length + " group(s): " + groups.map(g => b.slice(g[0], g[1] + 1).toString("latin1").replace(/[\x00-\x1F]/g, ".")).join(" | ").slice(0, 120));
}
