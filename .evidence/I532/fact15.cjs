const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/stories.md");
// check bytes around the ST-497 line start
const i = s.indexOf("ST-497 DONE (I531)");
console.log("stories ST-497 idx:", i, "of", s.length);
console.log("bytes before ST-497 line:", [...s.slice(Math.max(0, i - 8), i)].map(x => x.toString(16)).join(" "));
const j = s.indexOf("\n", i);
console.log("after ST-497 line ends at file end?", j === -1 || s.slice(j, j + 4).toString("hex"));
const c = fs.readFileSync("E:/Game/CHANGELOG.md");
const k = c.indexOf("## [Unreleased]");
console.log("changelog around Unreleased:", c.slice(k, k + 60).toString("hex"));
// BOM byte counts (EF BB BF) per file
for (const p of ["E:/Game/CHANGELOG.md", "E:/Game/production/stories.md", "E:/Game/production/epics.md", "E:/Game/production/iterations.md", "E:/Game/production/timeline.md", "E:/Game/production/session-state/active.md"]) {
  const b = fs.readFileSync(p);
  let n = 0;
  for (let x = 0; x + 2 < b.length; x++) if (b[x] === 0xEF && b[x+1] === 0xBB && b[x+2] === 0xBF) { n++; x += 2; }
  console.log("BOMs", p.split("/").pop(), n);
}
// EOL check on stories L667-671 region
const region = s.slice(s.indexOf("STATUS (I528)"), s.length);
let cr = 0, lf = 0;
for (const x of region) { if (x === 0x0D) cr++; if (x === 0x0A) lf++; }
console.log("stories tail region: CR", cr, "LF", lf);
const regC = c.slice(0, 2000);
let cr2 = 0, lf2 = 0;
for (const x of regC) { if (x === 0x0D) cr2++; if (x === 0x0A) lf2++; }
console.log("changelog head region: CR", cr2, "LF", lf2);
