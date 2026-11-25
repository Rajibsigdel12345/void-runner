const fs = require("fs");
const spec = {
  epics: ["production/epics.md", 3],
  stories: ["production/stories.md", 5],
  iters: ["production/iterations.md", 5],
  timeline: ["production/timeline.md", 3],
  active: ["production/session-state/active.md", 0],
  changelog: ["CHANGELOG.md", 7]
};
let ok = true;
for (const [k, [p, bomN]] of Object.entries(spec)) {
  const b = fs.readFileSync(p);
  let n = 0;
  while (b[n] === 0xEF && b[n + 1] === 0xBB && b[n + 2] === 0xBF) n += 3;
  const bomOk = n / 3 === bomN;
  const asciiOk = /^[\x00-\x7F]*$/.test(b.slice(n).toString("latin1"));
  const tail = JSON.stringify(b.slice(-26).toString("latin1"));
  if (!bomOk || !asciiOk) ok = false;
  console.log(k + ": BOMs=" + (n / 3) + (bomOk ? " ok" : " MISMATCH exp " + bomN) + " ascii=" + (asciiOk ? "ok" : "FAIL") + " tail=" + tail);
}
// spot-checks
const e = fs.readFileSync("production/epics.md", "utf8").split(/\r?\n/);
const h84 = e.findIndex(l => l.startsWith("## E84 "));
console.log("epics: E84 header at line " + (h84 + 1) + "; line before: " + JSON.stringify(e[h84 - 1]).slice(0, 40) + "; line after: " + JSON.stringify(e[h84 + 9]).slice(0, 30));
const st = fs.readFileSync("production/stories.md", "utf8").split(/\r?\n/);
console.log("stories: last line: " + JSON.stringify(st[st.length - 2]).slice(0, 60));
const cl = fs.readFileSync("CHANGELOG.md", "utf8").split("\n");
console.log("changelog: line 10: " + JSON.stringify(cl[9]).slice(0, 60) + "; line 11: " + JSON.stringify(cl[10]).slice(0, 40));
console.log(ok ? "VERIFY OK" : "VERIFY FAIL");
