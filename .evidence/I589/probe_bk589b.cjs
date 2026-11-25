const fs = require("fs");
const files = {
  epics: "production/epics.md",
  stories: "production/stories.md",
  iters: "production/iterations.md",
  timeline: "production/timeline.md",
  active: "production/session-state/active.md",
  changelog: "CHANGELOG.md"
};
for (const [k, p] of Object.entries(files)) {
  const b = fs.readFileSync(p);
  let n = 0;
  while (b[n] === 0xEF && b[n + 1] === 0xBB && b[n + 2] === 0xBF) n += 3;
  console.log(k + ": BOMs=" + (n / 3) + " head=" + JSON.stringify(b.slice(0, n + 20).toString("latin1")));
  console.log(k + ": tail=" + JSON.stringify(b.slice(-24).toString("latin1")));
}
const e = fs.readFileSync(files.epics, "utf8").split(/\r?\n/);
console.log("--- epics E83 section (lines 942-951) ---");
for (let i = 941; i <= 950; i++) console.log((i + 1) + ": " + JSON.stringify(e[i]).slice(0, 300));
const st = fs.readFileSync(files.stories, "utf8").split(/\r?\n/);
console.log("--- stories tail (last 16 lines) ---");
for (let i = st.length - 16; i < st.length; i++) console.log((i + 1) + ": " + JSON.stringify(st[i]).slice(0, 220));
const it = fs.readFileSync(files.iters, "utf8").split(/\r?\n/);
console.log("--- iters I588 entry (from header to end) ---");
for (let i = 7256; i < it.length; i++) console.log((i + 1) + ": " + JSON.stringify(it[i]).slice(0, 250));
const ac = fs.readFileSync(files.active, "utf8");
console.log("--- active last NEXT line full ---");
const acl = fs.readFileSync(files.active, "utf8").split(/\r?\n/);
console.log(JSON.stringify(acl[acl.length - 2]));
