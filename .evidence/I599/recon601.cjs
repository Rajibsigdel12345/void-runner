const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
function show(name, start, len) {
  const s = B(name);
  console.log("=== " + name + " (len " + s.length + ") ===");
  console.log(JSON.stringify(s.slice(start, start + len)));
  console.log("");
}
// scope-check-E86.md: find ST-564 fix-table region
let s = B("production/scope-check-E86.md");
let i = s.indexOf("ST-564");
console.log("scope-check ST-564 idx:", i);
if (i >= 0) show("production/scope-check-E86.md", Math.max(0, i - 400), 1600);
// epics.md: E86 block
s = B("production/epics.md");
i = s.indexOf("E86");
console.log("epics E86 idx:", i);
// find the E86 epic header block
let j = s.indexOf("## E86");
if (j < 0) j = s.indexOf("E86:");
console.log("epics E86 header idx:", j);
show("production/epics.md", j, 2200);
