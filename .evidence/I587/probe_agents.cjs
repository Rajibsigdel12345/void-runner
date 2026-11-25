const fs = require("fs");
const s = fs.readFileSync("AGENTS.md", "utf8");
const anchors = [
  "34 Blender-made GLBs in assets/",
  "ship v7",
  "A 22/32,717 + 11/180",
  "6,430,174 (I565",
];
for (const a of anchors) {
  const i = s.indexOf(a);
  if (i === -1) { console.log("MISSING: " + a); continue; }
  const lineStart = s.lastIndexOf("\n", i) + 1;
  const seg = s.slice(lineStart, lineStart + 420);
  console.log("=== " + a + " (line " + (seg.length) + " chars, shown 420) ===");
  console.log(seg);
}
