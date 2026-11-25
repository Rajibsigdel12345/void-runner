const fs = require("fs");
const files = {
  epics: "production/epics.md",
  stories: "production/stories.md",
  iters: "production/iterations.md",
  timeline: "production/timeline.md",
  active: "production/session-state/active.md",
  changelog: "CHANGELOG.md"
};
function probe(name, p) {
  const b = fs.readFileSync(p);
  const bom = b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF ? "BOM" : "noBOM";
  const s = b.toString("latin1");
  const crlf = (s.match(/\r\n/g) || []).length;
  const lfOnly = (s.match(/(?<!\r)\n/g) || []).length;
  const tail = JSON.stringify(s.slice(-8));
  console.log("== " + name + " " + p + " == len " + b.length + " " + bom + " CRLF " + crlf + " LFonly " + lfOnly + " tail " + tail);
}
probe("epics", files.epics);
const e = fs.readFileSync(files.epics, "utf8").split(/\r?\n/);
let i83 = e.findIndex(l => /^## E83 /.test(l));
let i82 = e.findIndex(l => /^## E82 /.test(l));
console.log("epics: total lines " + e.length + "  E83 header at line " + (i83 + 1) + "  E82 header at line " + (i82 + 1));
console.log("epics line " + (i83 - 1 + 1) + " (before E83): " + JSON.stringify(e[i83 - 1]));
console.log("epics line " + (i83 + 1) + " (E83 header): " + JSON.stringify(e[i83]));
const st = fs.readFileSync(files.stories, "utf8").split(/\r?\n/);
console.log("stories: total lines " + st.length);
for (let i = 0; i < Math.min(14, st.length); i++) console.log("  st[" + i + "]: " + JSON.stringify(st[i]).slice(0, 160));
const it = fs.readFileSync(files.iters, "utf8").split(/\r?\n/);
console.log("iters: total lines " + it.length);
let h588 = it.findIndex(l => /^## I588/.test(l));
console.log("iters: I588 header at line " + (h588 + 1));
for (let i = 0; i < Math.min(6, it.length); i++) console.log("  it[" + i + "]: " + JSON.stringify(it[i]).slice(0, 160));
const tl = fs.readFileSync(files.timeline, "utf8").split(/\r?\n/);
console.log("timeline: total lines " + tl.length);
for (let i = 0; i < Math.min(6, tl.length); i++) console.log("  tl[" + i + "]: " + JSON.stringify(tl[i]).slice(0, 200));
const ac = fs.readFileSync(files.active, "utf8").split(/\r?\n/);
console.log("active: total lines " + ac.length);
for (let i = Math.max(0, ac.length - 5); i < ac.length; i++) console.log("  ac[" + i + "]: " + JSON.stringify(ac[i]).slice(0, 200));
const cl = fs.readFileSync(files.changelog, "utf8").split(/\r?\n/);
console.log("changelog: total lines " + cl.length);
for (let i = 0; i < Math.min(14, cl.length); i++) console.log("  cl[" + i + "]: " + JSON.stringify(cl[i]).slice(0, 200));
