const fs = require("fs");
const files = {
  epics: "production/epics.md",
  stories: "production/stories.md",
  iterations: "production/iterations.md",
  timeline: "production/timeline.md",
  changelog: "CHANGELOG.md",
  active: "production/session-state/active.md",
};
for (const [k, p] of Object.entries(files)) {
  const b = fs.readFileSync(p);
  let bom = 0, cr = 0, lf = 0;
  // count UTF-8 BOM occurrences EF BB BF
  for (let i = 0; i + 2 < b.length; i++) if (b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { bom++; i += 2; }
  for (const x of b) { if (x === 13) cr++; else if (x === 10) lf++; }
  const tail = [];
  for (let i = Math.max(0, b.length - 12); i < b.length; i++) tail.push(b[i].toString(16));
  console.log(k, "bytes=" + b.length, "bom=" + bom, "cr=" + cr, "lf=" + lf, "tail=" + tail.join(","));
}
// CHANGELOG: exact bytes after the I561 line
const c = fs.readFileSync("CHANGELOG.md", "utf8");
const i561 = c.indexOf("- I561:");
const seg = c.slice(i561, i561 + 320);
console.log("CHLOG-SEG:" + JSON.stringify(seg));
