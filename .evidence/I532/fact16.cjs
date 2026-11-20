const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/stories.md", "latin1");
const lines = s.split("\n");
console.log("=== stories.md L666-L680 (first 130 chars each) ===");
for (let n = 665; n <= 680 && n < lines.length; n++) {
  console.log("L" + (n + 1) + ": " + lines[n].slice(0, 130));
}
console.log("=== L705-709 (end) ===");
for (let n = 704; n < lines.length; n++) console.log("L" + (n + 1) + ": " + lines[n].slice(0, 130));
// exact EOL bytes of L670 (ST-496 line) and L671 (ST-497 line)
const i496 = s.indexOf("STATUS (I530)");
const i497 = s.indexOf("ST-497 DONE (I531)");
console.log("EOL bytes before ST-497 line:", [...s.slice(i497 - 6, i497)].map(x => x.toString(16)).join(" "));
const j497 = s.indexOf("\n", i497);
console.log("bytes after ST-497 line:", [...s.slice(j497 - 2, j497 + 12)].map(x => x.toString(16)).join(" "), s.slice(j497 + 1, j497 + 40));
