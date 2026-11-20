const fs = require("fs");
function edit(path, pairs) {
  const before = fs.readFileSync(path, "utf8");
  const bomBefore = (before.match(/\uFEFF/g) || []).length;
  let s = before, report = [];
  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    if (n !== 1) { console.log("FAIL " + path + " count=" + n + " for: " + from.slice(0, 60)); process.exitCode = 1; continue; }
    s = s.replace(from, to);
    report.push("ok: " + from.slice(0, 50) + "...");
  }
  const bomAfter = (s.match(/\uFEFF/g) || []).length;
  fs.writeFileSync(path, s, "utf8");
  console.log(path + " BOM " + bomBefore + "->" + bomAfter + " | " + report.length + " edits");
}
edit("production/iterations.md", [
  ["V-SWITCH: cockpit->chase pathLen 19.4 u, frame1 frac 0.081, t99 683 ms = DAMPED; chase->overview pathLen 43.1 u, frame1 frac 0.081, t99 683 ms = DAMPED.",
   "V-SWITCH (45-frame rAF path; pathLen is rAF-timing-dependent across headless runs - the verdict + t99 are the stable claims): cockpit->chase pathLen 21.0 u, frame1 frac 0.077, t99 683 ms = DAMPED; chase->overview pathLen 39.7 u, frame1 frac 0.085, t99 683 ms = DAMPED."],
  ["(only d 1.4 in-frame)",
   "(d 1.1 + d 1.4 in-frame, bottom ~19% of the frame; d 0.5/0.8 below the frame)"]
]);
edit("production/stories.md", [
  ["NDC y -1.50/-1.02/-0.77/-0.62, only d 1.4 in-frame; ship center NDC y -6.77;",
   "NDC y -1.50/-1.02/-0.77/-0.62, d 1.1 + d 1.4 in-frame [bottom ~19% of the frame] / d 0.5+0.8 below the frame; ship center NDC y -6.77;"],
  ["cockpit->chase pathLen 19.4 u, frame1 frac 0.081, t99 683 ms = DAMPED; chase->overview pathLen 43.1 u, frame1 frac 0.081, t99 683 ms = DAMPED - G-b CLOSED BY MEASUREMENT.",
   "cockpit->chase pathLen 21.0 u, frame1 frac 0.077, t99 683 ms = DAMPED; chase->overview pathLen 39.7 u, frame1 frac 0.085, t99 683 ms = DAMPED [pathLen rAF-timing-dependent across runs; verdict + t99 stable] - G-b CLOSED BY MEASUREMENT."]
]);
edit("production/epics.md", [
  ["V-switch DAMPED both directions [frame1 frac 0.081, t99 683 ms]",
   "V-switch DAMPED both directions [frame1 frac 0.077/0.085, t99 683 ms]"]
]);
edit("production/timeline.md", [
  ["V-switch DAMPED both directions [frame1 frac 0.081, t99 683 ms]",
   "V-switch DAMPED both directions [frame1 frac 0.077/0.085, t99 683 ms]"]
]);
console.log("DONE");