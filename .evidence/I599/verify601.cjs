const fs = require("fs");
const B = (p) => fs.readFileSync(p, "latin1");
function region(name, find, before, len) {
  const s = B(name);
  const i = s.indexOf(find);
  console.log("=== " + name + " @ " + find.slice(0, 50) + " idx " + i + " ===");
  if (i < 0) { console.log("NOT FOUND"); return; }
  console.log(JSON.stringify(s.slice(Math.max(0, i - before), i + len)));
  console.log("");
}
function tail(name, len) {
  const s = B(name);
  console.log("=== TAIL " + name + " ===");
  console.log(JSON.stringify(s.slice(s.length - len)));
  console.log("");
}
region("production/scope-check-E86.md", "probe599 PASS n=11 (I599", 120, 420);
region("production/epics.md", "DONE I599: probe599 PASS n=11", 120, 260);
region("production/stories.md", "ST-564 E86 cockpit thrust-basis", 10, 300);
region("production/stories.md", "acceptance I599: probe599 PASS", 60, 600);
tail("production/iterations.md", 1500);
tail("production/timeline.md", 700);
tail("production/session-state/active.md", 700);
region("CHANGELOG.md", "- I599: Cockpit controls", 10, 420);
