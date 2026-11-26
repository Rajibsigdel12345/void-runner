const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
function region(name, find, before, len, label) {
  const s = B(name);
  let i = s.indexOf(find);
  console.log("=== " + (label || find) + " in " + name + " idx:", i, "===");
  if (i >= 0) console.log(JSON.stringify(s.slice(Math.max(0, i - before), i + len)));
  else console.log("(not found)");
  console.log("");
}
function tail(name, len, label) {
  const s = B(name);
  console.log("=== TAIL " + (label || name) + " (len " + s.length + ") ===");
  console.log(JSON.stringify(s.slice(s.length - len)));
  console.log("");
}
// scope-check: the fix table
region("production/scope-check-E86.md", "ST-564", 200, 1400, "scope-check 2nd ST-564");
let s = B("production/scope-check-E86.md");
// print all ST-564 occurrences
let k = -1, occ = [];
while ((k = s.indexOf("ST-564", k + 1)) >= 0) occ.push(k);
console.log("scope-check ST-564 occurrences:", occ.join(","));
// epics.md: full Stories line of E86
s = B("production/epics.md");
const stI = s.indexOf("- Stories: ST-564");
const stEnd = s.indexOf("\r\n", stI);
console.log("epics Stories line len:", stEnd - stI);
console.log(JSON.stringify(s.slice(stI, stEnd + 2)));
