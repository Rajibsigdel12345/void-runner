const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
function tail(name, len) {
  const s = B(name);
  console.log("=== TAIL " + name + " (len " + s.length + ") ===");
  console.log(JSON.stringify(s.slice(s.length - len)));
  console.log("");
}
let s = B("production/stories.md");
let i = s.indexOf("ST-564");
let occ = [], k = -1;
while ((k = s.indexOf("ST-564", k + 1)) >= 0) occ.push(k);
console.log("stories ST-564 occurrences:", occ.join(","), "file len", s.length);
if (occ.length) {
  const a = occ[0];
  console.log(JSON.stringify(s.slice(a, a + 700)));
}
tail("production/iterations.md", 1200);
tail("production/timeline.md", 1000);
tail("production/session-state/active.md", 900);
s = B("CHANGELOG.md");
i = s.indexOf("I598");
occ = []; k = -1;
while ((k = s.indexOf("I598", k + 1)) >= 0) occ.push(k);
console.log("changelog I598 occurrences:", occ.join(","), "file len", s.length);
if (occ.length) console.log(JSON.stringify(s.slice(Math.max(0, occ[0]-60), occ[0] + 300)));
